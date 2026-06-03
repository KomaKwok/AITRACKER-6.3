import { loadEnvConfig } from "@next/env";
import { updatePricingEvidence } from "@/lib/pricing/bocha-evidence";

loadEnvConfig(process.cwd());

async function main() {
  const evidence = await updatePricingEvidence();

  console.log(`Updated pricing evidence for ${Object.keys(evidence).length} companies.`);
  console.log("Evidence file: data/pricing-evidence.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
