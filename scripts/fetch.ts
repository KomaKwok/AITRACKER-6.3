import { loadEnvConfig } from "@next/env";
import { refreshRadarData } from "@/lib/radar/fetchers";
import { getStorePath } from "@/lib/data/store";

loadEnvConfig(process.cwd());

async function main() {
  const store = await refreshRadarData();
  console.log(`Refreshed AI Radar. ${store.signals.length} signals stored. Updated at ${store.lastUpdatedAt}.`);
  console.log(`Store file: ${getStorePath()}`);
  console.log("Export files: data/exports/latest-links-zh.md, data/exports/latest-links.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
