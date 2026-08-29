import { loadEnvConfig } from "@next/env";
import { refreshRadarDataWithOptions } from "@/lib/radar/fetchers";
import { getStorePath } from "@/lib/data/store";
import { refreshPricingSnapshot } from "@/lib/pricing/refresh";

loadEnvConfig(process.cwd());

async function main() {
  const sourceIds = process.argv
    .slice(2)
    .filter((argument) => argument.startsWith("--source="))
    .map((argument) => argument.slice("--source=".length))
    .filter(Boolean);
  const [store, pricing] = await Promise.all([
    refreshRadarDataWithOptions(sourceIds.length ? { sourceIds } : {}),
    refreshPricingSnapshot()
  ]);
  console.log(`Refreshed AI Radar. ${store.signals.length} signals stored. Updated at ${store.lastUpdatedAt}.`);
  console.log(`Store file: ${getStorePath()}`);
  console.log(`Pricing: ${pricing.verifiedCount}/${pricing.entries.length} official pages verified.`);
  console.log("Export files: data/exports/latest-links-zh.md, data/exports/latest-links.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
