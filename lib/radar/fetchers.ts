import crypto from "node:crypto";
import { enrichSignalWithAi } from "@/lib/ai/client";
import { defaultSources } from "@/lib/data/default-sources";
import { readStore, writeStore } from "@/lib/data/store";
import { adapterRegistry } from "@/lib/radar/adapters";
import { RawFetchedItem } from "@/lib/radar/adapter-utils";
import { writeRadarExports } from "@/lib/radar/export";
import { calculateFirstHandScore, calculateHeatScore, calculateSignalScore } from "@/lib/radar/scoring";
import { generateTrendSummary } from "@/lib/radar/trends";
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

function normalizeSources(sources: Source[]) {
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  return defaultSources.map((source) => ({ ...source, ...sourceMap.get(source.id) }));
}

function buildReadableSummary(item: RawFetchedItem, aiSummary: string) {
  const sentence = item.snippet
    .split(/[.!?]/)
    .map((part) => part.trim())
    .find((part) => part.length > 30);

  return sentence ? `${sentence.replace(/[.;,:-]+$/, "")}.` : aiSummary;
}

async function withSourceTimeout<T>(promise: Promise<T>, source: Source): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${source.name} timed out after ${SOURCE_TIMEOUT_MS / 1000}s`)), SOURCE_TIMEOUT_MS)
    )
  ]);
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
  return items.filter(isProductSignal);
}

async function normalizeSignal(source: Source, item: RawFetchedItem): Promise<Signal> {
  const ai = await enrichSignalWithAi({
    title: item.title,
    snippet: item.snippet
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
  const dedupeHash = hash(`${item.title}:${item.url}`);

  return {
    id: dedupeHash.slice(0, 12),
    title: item.title,
    ...(ai.titleZh ? { titleZh: ai.titleZh } : {}),
    url: item.url,
    sourceId: source.id,
    sourceName: source.name,
    sourceType: source.sourceType,
    company: item.company,
    product: item.product,
    region: source.region,
    category: item.category,
    publishedAt: item.publishedAt,
    fetchedAt: new Date().toISOString(),
    summary: buildReadableSummary(item, ai.summary),
    tags,
    firstHandScore,
    heatScore,
    signalScore,
    rawContentSnippet: item.snippet,
    dedupeHash
  };
}

export async function refreshRadarData() {
  return refreshRadarDataWithOptions();
}

async function runRefreshForSources(store: Awaited<ReturnType<typeof readStore>>, sources: Source[]) {
  const nextSignals = [...store.signals];
  const allSources = normalizeSources(store.sources.length ? store.sources : defaultSources);

  for (const source of sources) {
    try {
      const rawItems = await withSourceTimeout(fetchSourceItems(source), source);
      const sourceSignals: Signal[] = [];

      for (const item of rawItems) {
        const signal = await normalizeSignal(source, item);
        const duplicateInSource = sourceSignals.some((candidate) => candidate.dedupeHash === signal.dedupeHash);
        const duplicateInOtherSources = nextSignals.some(
          (candidate) => candidate.sourceId !== source.id && candidate.dedupeHash === signal.dedupeHash
        );

        if (!duplicateInSource && !duplicateInOtherSources) {
          sourceSignals.push(signal);
        }
      }

      const preservedSignals = nextSignals.filter((signal) => signal.sourceId !== source.id);
      nextSignals.length = 0;
      nextSignals.push(...preservedSignals, ...sourceSignals);

      source.lastFetchStatus = rawItems.length ? "success" : "empty";
      source.lastFetchMessage = rawItems.length
        ? `Stored ${rawItems.length} product updates from ${source.product}`
        : "No qualifying product updates found on the official page";
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

  nextSignals.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));

  const updatedStore = {
    sources: allSources.map((source) => sources.find((candidate) => candidate.id === source.id) ?? source),
    signals: nextSignals.slice(0, 300),
    trendSummary: generateTrendSummary(nextSignals),
    lastUpdatedAt: new Date().toISOString()
  };

  await writeStore(updatedStore);
  await writeRadarExports(updatedStore);
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
    .filter((source) => (options.excludeSourceIds?.length ? !options.excludeSourceIds.includes(source.id) : true));

  return runRefreshForSources(normalizedStore, sources);
}
