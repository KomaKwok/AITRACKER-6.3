import crypto from "node:crypto";
import { defaultSources } from "@/lib/data/default-sources";
import { generateTrendSummary } from "@/lib/radar/trends";
import { RadarStore, Signal } from "@/lib/types";

function hash(value: string) {
  return crypto.createHash("sha1").update(value).digest("hex");
}

function createSignal(input: Omit<Signal, "id" | "dedupeHash" | "fetchedAt">): Signal {
  const dedupeHash = hash(`${input.title}:${input.url}`);
  return {
    ...input,
    id: dedupeHash.slice(0, 12),
    dedupeHash,
    fetchedAt: new Date().toISOString()
  };
}

export function buildSeedStore(): RadarStore {
  const signals: Signal[] = [];

  return {
    sources: defaultSources,
    signals,
    trendSummary: generateTrendSummary(signals),
    lastUpdatedAt: new Date().toISOString()
  };
}
