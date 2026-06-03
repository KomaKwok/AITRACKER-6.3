import { writeStore } from "@/lib/data/store";
import { writeRadarExports } from "@/lib/radar/export";
import { buildSeedStore } from "@/lib/radar/seed";

async function main() {
  const store = buildSeedStore();
  await writeStore(store);
  const exports = await writeRadarExports(store);
  console.log(`Seeded ${store.signals.length} signals across ${store.sources.length} sources.`);
  console.log(`Generated ${exports.markdownFile} and ${exports.jsonFile}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
