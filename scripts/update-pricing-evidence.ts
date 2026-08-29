import { loadEnvConfig } from "@next/env";
import { refreshPricingSnapshot } from "@/lib/pricing/refresh";

loadEnvConfig(process.cwd());

async function main() {
  const snapshot = await refreshPricingSnapshot();

  console.log(`Verified ${snapshot.verifiedCount}/${snapshot.entries.length} flagship prices.`);
  console.log("Snapshot file: data/pricing-snapshot.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
