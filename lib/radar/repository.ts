import { readStore, writeStore } from "@/lib/data/store";
import { defaultSources } from "@/lib/data/default-sources";
import { buildSeedStore } from "@/lib/radar/seed";
import { Signal, Source } from "@/lib/types";

function normalizeStoreSources(store: Awaited<ReturnType<typeof readStore>>) {
  const defaultSourceIds = new Set(defaultSources.map((source) => source.id));
  const sourceMap = new Map(store.sources.map((source) => [source.id, source]));
  const sources = defaultSources.map((source) => ({ ...source, ...sourceMap.get(source.id) }));
  const signals = store.signals.filter((signal) => defaultSourceIds.has(signal.sourceId));
  return { ...store, sources, signals };
}

export async function ensureSeededStore() {
  const store = await readStore();
  if (!store.sources.length && !store.signals.length) {
    const seeded = buildSeedStore();
    await writeStore(seeded);
    return seeded;
  }
  const normalized = normalizeStoreSources(store);
  if (
    normalized.sources.length !== store.sources.length ||
    normalized.signals.length !== store.signals.length ||
    normalized.sources.some((source, index) => source.id !== store.sources[index]?.id)
  ) {
    await writeStore({
      ...store,
      sources: normalized.sources,
      signals: normalized.signals
    });
  }
  return normalized;
}

export async function getAllSignals() {
  const store = await ensureSeededStore();
  return store.signals;
}

export async function getAllSources() {
  const store = await ensureSeededStore();
  return store.sources;
}

export async function getDashboardData() {
  const store = await ensureSeededStore();
  const now = Date.now();
  const signals24h = store.signals.filter((signal) => now - +new Date(signal.publishedAt) <= 24 * 60 * 60 * 1000);
  const signals7d = store.signals.filter((signal) => now - +new Date(signal.publishedAt) <= 7 * 24 * 60 * 60 * 1000);

  return {
    sources: store.sources,
    signals: store.signals,
    trendSummary: store.trendSummary,
    lastUpdatedAt: store.lastUpdatedAt,
    metrics: {
      totalSources: store.sources.length,
      newSignals24h: signals24h.length,
      newSignals7d: signals7d.length
    }
  };
}

export function filterSignals(
  signals: Signal[],
  filters: {
    region?: string;
    sourceType?: string;
    tag?: string;
    timeRange?: string;
    sort?: string;
  }
) {
  let next = [...signals];

  if (filters.region && filters.region !== "All") {
    next = next.filter((signal) => signal.region === filters.region);
  }
  if (filters.sourceType && filters.sourceType !== "All") {
    next = next.filter((signal) => signal.sourceType === filters.sourceType);
  }
  if (filters.tag && filters.tag !== "All") {
    next = next.filter((signal) => signal.tags.includes(filters.tag as Signal["tags"][number]));
  }
  if (filters.timeRange && filters.timeRange !== "All") {
    const hours =
      filters.timeRange === "24h" ? 24 : filters.timeRange === "7d" ? 24 * 7 : filters.timeRange === "30d" ? 24 * 30 : null;
    if (hours) {
      next = next.filter((signal) => Date.now() - +new Date(signal.publishedAt) <= hours * 60 * 60 * 1000);
    }
  }

  next.sort((a, b) =>
    filters.sort === "score"
      ? b.signalScore - a.signalScore || +new Date(b.publishedAt) - +new Date(a.publishedAt)
      : +new Date(b.publishedAt) - +new Date(a.publishedAt)
  );

  return next;
}

export function splitByRegion(signals: Signal[]) {
  return {
    global: signals.filter((signal) => signal.region === "Global"),
    china: signals.filter((signal) => signal.region === "China")
  };
}

export function getSourceCoverageSummary(sources: Source[]) {
  const active = sources.filter((source) => source.active).length;
  const official = sources.filter((source) => source.sourceType === "Official").length;
  return { active, official };
}
