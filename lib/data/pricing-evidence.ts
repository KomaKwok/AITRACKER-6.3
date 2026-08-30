import { readFile } from "node:fs/promises";
import { PriceDateEvidence, PriceSnapshotEntry } from "@/lib/data/pricing-snapshot";
import { pricingSnapshot } from "@/lib/data/pricing-snapshot";
import { getDataFilePath, readPersistedJson } from "@/lib/data/persisted-json";

const evidenceFile = getDataFilePath("pricing-evidence.json");

interface StoredPricingSnapshot {
  entries: PriceSnapshotEntry[];
  refreshedAt: string;
}

export async function getPricingEntries() {
  const parsed = await readPersistedJson<StoredPricingSnapshot>({
    filename: "pricing-snapshot.json",
    blobPathname: "ai-radar/pricing-snapshot.json",
    fallback: { entries: pricingSnapshot, refreshedAt: pricingSnapshot[0]?.verifiedAt ?? new Date(0).toISOString() }
  });
  return parsed.entries?.length ? parsed.entries : pricingSnapshot;
}

export async function readPricingEvidence() {
  try {
    const raw = await readFile(evidenceFile, "utf8");
    return JSON.parse(raw) as Record<string, PriceDateEvidence>;
  } catch {
    return {};
  }
}

export async function withPricingEvidence(entries: PriceSnapshotEntry[]) {
  const evidence = await readPricingEvidence();

  return entries.map((entry) => ({
    ...entry,
    dateEvidence: evidence[entry.company] ?? entry.dateEvidence
  }));
}
