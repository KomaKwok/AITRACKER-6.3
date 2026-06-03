import { readFile } from "node:fs/promises";
import path from "node:path";
import { PriceDateEvidence, PriceSnapshotEntry } from "@/lib/data/pricing-snapshot";

const evidenceFile = path.join(process.cwd(), "data", "pricing-evidence.json");

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
