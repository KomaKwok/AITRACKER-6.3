import crypto from "node:crypto";
import { summarizeSnippet, suggestTags } from "@/lib/ai/fallback";
import { buildFallbackBrief, isBriefCurrent } from "@/lib/radar/brief";
import { enrichSignalWithAi, generateDashboardBrief } from "@/lib/ai/client";
import { defaultSources } from "@/lib/data/default-sources";
import { readStore, writeStore } from "@/lib/data/store";
import { adapterRegistry } from "@/lib/radar/adapters";
import { RawFetchedItem } from "@/lib/radar/adapter-utils";
import { writeRadarExports } from "@/lib/radar/export";
import { mergeSourceHistory } from "@/lib/radar/retention";
import { calculateFirstHandScore, calculateHeatScore, calculateSignalScore } from "@/lib/radar/scoring";
import { Signal, Source, Tag } from "@/lib/types";

interface RefreshOptions {
  sourceIds?: string[];
  excludeSourceIds?: string[];
}

const SOURCE_TIMEOUT_MS = 20000;
const DEBUG_FETCH = process.env.DEBUG_FETCH === "1";

function hash(value: string) {
  return crypto.createHash("sha1").update(value).digest("hex");
}

function normalizedPaperTitle(signal: Signal) {
  return signal.title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ").trim();
}

function isDuplicateSignal(candidate: Signal, signal: Signal) {
  if (candidate.dedupeHash === signal.dedupeHash) return true;
  if (candidate.externalId && signal.externalId && candidate.externalId === signal.externalId) return true;
  return (
    candidate.category === "Paper" &&
    signal.category === "Paper" &&
    normalizedPaperTitle(candidate) === normalizedPaperTitle(signal)
  );
}

function dedupeStoredSignals(signals: Signal[]) {
  const result: Signal[] = [];
  const paperIndexes = new Map<string, number>();

  for (const signal of signals) {
    if (signal.category !== "Paper") {
      result.push(signal);
      continue;
    }

    const key = signal.externalId ?? normalizedPaperTitle(signal);
    const existingIndex = paperIndexes.get(key);
    if (existingIndex === undefined) {
      paperIndexes.set(key, result.length);
      result.push(signal);
      continue;
    }

    if (signal.sourceId === "arxiv-ai-papers" && result[existingIndex]?.sourceId !== "arxiv-ai-papers") {
      result[existingIndex] = signal;
    }
  }

  return result;
}

function normalizeSources(sources: Source[]) {
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  return defaultSources.map((source) => ({ ...source, ...sourceMap.get(source.id) }));
}

async function withSourceTimeout<T>(promise: Promise<T>, source: Source): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${source.name} timed out`)), SOURCE_TIMEOUT_MS);
      })
    ]);
  } finally { clearTimeout(timer); }
}

function isProductSignal(item: RawFetchedItem) {
  const haystack = `${item.title} ${item.snippet}`.toLowerCase();
  const productTerms = [
    "release",
    "api",
    "model",
    "sdk",
    "agent",
    "assistant",
    "response",
    "feature",
    "launch",
    "ga",
    "beta",
    "preview",
    "mcp",
    "search",
    "reasoning",
    "context",
    "tool",
    "workspace",
    "compliance",
    "analytics",
    "模型",
    "发布",
    "更新",
    "能力",
    "推理",
    "接入",
    "智能体"
  ];
  const noiseTerms = ["webinar", "summit", "newsletter", "contact sales", "活动报名", "白皮书", "合作案例"];

  return productTerms.some((term) => haystack.includes(term)) && !noiseTerms.some((term) => haystack.includes(term));
}

async function fetchSourceItems(source: Source) {
  const adapter = adapterRegistry.get(source.id);
  if (!adapter) {
    return [];
  }

  const items = await adapter.fetch(source);
  return source.sourceType === "Research" ? items.slice(0, 10) : items.filter(isProductSignal).slice(0, 16);
}

async function normalizeSignal(source: Source, item: RawFetchedItem, previous?: Signal, useAi = true): Promise<Signal> {
  const ai = previous && previous.rawContentSnippet === item.snippet && previous.title === item.title
    ? { summary: previous.summary, titleZh: previous.titleZh, tags: previous.tags }
    : !useAi ? { summary: summarizeSnippet(item.title, item.snippet), tags: suggestTags(item.title, item.snippet) }
    : await enrichSignalWithAi({
    title: item.title,
    snippet: item.snippet,
    contentKind: item.category === "Paper" ? "AI research paper" : "AI product update"
  });
  const tags = (item.tags?.length ? item.tags : ai.tags).slice(0, 4) as Tag[];
  const firstHandScore = calculateFirstHandScore({
    sourceType: source.sourceType,
    fetchStrategy: source.fetchStrategy,
    priority: source.priority
  });
  const heatScore = calculateHeatScore({
    title: item.title,
    snippet: item.snippet,
    tags
  });
  const signalScore = calculateSignalScore({
    publishedAt: item.publishedAt,
    sourceType: source.sourceType,
    fetchStrategy: source.fetchStrategy,
    title: item.title,
    snippet: item.snippet,
    tags,
    priority: source.priority
  });
  const dedupeHash = hash(item.externalId ? `external:${item.externalId}` : `${item.title}:${item.url}`);

  return {
    id: dedupeHash.slice(0, 12),
    title: item.title,
    ...(item.titleZh || ai.titleZh ? { titleZh: item.titleZh ?? ai.titleZh } : {}),
    url: item.url,
    ...(item.externalId ? { externalId: item.externalId } : {}),
    sourceId: source.id,
    sourceName: source.name,
    sourceType: source.sourceType,
    company: item.company,
    product: item.product,
    region: source.region,
    category: item.category,
    publishedAt: item.publishedAt,
    fetchedAt: new Date().toISOString(),
    summary: ai.summary,
    tags,
    firstHandScore,
    heatScore,
    signalScore,
    rawContentSnippet: item.snippet,
    dedupeHash,
    ...(item.sourceRank ? { sourceRank: item.sourceRank } : {}),
    ...(item.status ? { status: item.status } : {})
  };
}

export async function refreshRadarData() {
  return refreshRadarDataWithOptions();
}

async function runRefreshForSources(store: Awaited<ReturnType<typeof readStore>>, sources: Source[]) {
  const nextSignals = [...store.signals];
  const allSources = normalizeSources(store.sources.length ? store.sources : defaultSources);

  const fetched = await Promise.allSettled(sources.map((source) => withSourceTimeout(fetchSourceItems(source), source)));
  const aiDeadline = Date.now() + 35000;
  for (const [sourceIndex, source] of sources.entries()) {
    try {
      const result = fetched[sourceIndex];
      if (result.status === "rejected") throw result.reason;
      const rawItems = result.value;
      const sourceSignals: Signal[] = [];

      for (const item of rawItems) {
        const previous = nextSignals.find((signal) => signal.sourceId === source.id && signal.title === item.title && signal.url === item.url);
        const signal = await normalizeSignal(source, item, previous, Date.now() < aiDeadline);
        const duplicateInSource = sourceSignals.some((candidate) => isDuplicateSignal(candidate, signal));
        const duplicateInOtherSources = nextSignals.some(
          (candidate) => candidate.sourceId !== source.id && isDuplicateSignal(candidate, signal)
        );

        if (!duplicateInSource && !duplicateInOtherSources) {
          sourceSignals.push(signal);
        }
      }

      const sourceHistory = mergeSourceHistory({
        existingSignals: nextSignals,
        freshSignals: sourceSignals,
        source
      });
      const preservedSignals = nextSignals.filter((signal) => signal.sourceId !== source.id);
      nextSignals.length = 0;
      nextSignals.push(...preservedSignals, ...sourceHistory);

      source.lastFetchStatus = rawItems.length ? "success" : "empty";
      source.lastFetchMessage = rawItems.length
        ? source.sourceType === "Research"
          ? `Stored ${rawItems.length} curated papers from the latest Daily Papers batch`
          : `Stored ${rawItems.length} product updates from ${source.product}`
        : source.sourceType === "Research"
          ? "No qualifying papers found; kept the latest successful paper batch"
          : "No qualifying product updates found; kept retained source history";
      if (rawItems.length) {
        source.lastSuccessfulAt = new Date().toISOString();
      }
      if (DEBUG_FETCH) {
        console.log(`[fetch] ${source.id}: ${rawItems.length} items`);
      }
    } catch (error) {
      source.lastFetchStatus = "error";
      source.lastFetchMessage = error instanceof Error ? error.message : String(error);
      if (DEBUG_FETCH) {
        console.log(`[fetch] ${source.id}: failed`);
      }
    }

    source.lastFetchedAt = new Date().toISOString();
  }

  const dedupedSignals = dedupeStoredSignals(nextSignals).sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)
  );
  const newSignals = dedupedSignals.filter((signal) => !store.signals.some((old) => old.id === signal.id)).length;
  const changedSignals = dedupedSignals.filter((signal) => store.signals.some((old) =>
    old.id === signal.id && (old.rawContentSnippet !== signal.rawContentSnippet || old.title !== signal.title)
  )).length;
  const successfulSources = sources.filter((source) => source.lastFetchStatus === "success").length;
  const briefIsValid = isBriefCurrent(store.brief, dedupedSignals);
  const brief = newSignals || changedSignals ? await generateDashboardBrief(dedupedSignals)
    : briefIsValid ? store.brief : buildFallbackBrief(dedupedSignals);

  const updatedStore = {
    sources: allSources.map((source) => sources.find((candidate) => candidate.id === source.id) ?? source),
    signals: dedupedSignals.slice(0, 300),
    brief,
    lastUpdatedAt: successfulSources ? new Date().toISOString() : store.lastUpdatedAt,
    lastCheckedAt: new Date().toISOString(),
    refreshReport: {
      newSignals, changedSignals, successfulSources,
      failedSources: sources.filter((source) => source.lastFetchStatus === "error").length,
      emptySources: sources.filter((source) => source.lastFetchStatus === "empty").length
    }
  };

  await writeStore(updatedStore);
  try {
    await writeRadarExports(updatedStore);
  } catch (error) {
    console.warn("[export] Local export skipped because this runtime does not provide writable local storage.", error);
  }
  return updatedStore;
}

export async function refreshRadarDataWithOptions(options: RefreshOptions = {}) {
  const store = await readStore();
  const normalizedSources = normalizeSources(store.sources.length ? store.sources : defaultSources);
  const allowedSourceIds = new Set(normalizedSources.map((source) => source.id));
  const normalizedStore = {
    ...store,
    sources: normalizedSources,
    signals: store.signals.filter((signal) => allowedSourceIds.has(signal.sourceId))
  };
  const sources = normalizedSources
    .filter((source) => source.active)
    .filter((source) => (options.sourceIds?.length ? options.sourceIds.includes(source.id) : true))
    .filter((source) => (options.excludeSourceIds?.length ? !options.excludeSourceIds.includes(source.id) : true))
    .filter((source) => {
      if (!source.minRefreshIntervalHours || options.sourceIds?.includes(source.id) || !source.lastSuccessfulAt) {
        return true;
      }
      return Date.now() - +new Date(source.lastSuccessfulAt) >= source.minRefreshIntervalHours * 60 * 60 * 1000;
    });

  return runRefreshForSources(normalizedStore, sources);
}
