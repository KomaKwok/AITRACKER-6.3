import { loadEnvConfig } from "@next/env";
import { enrichSignalWithAi } from "@/lib/ai/client";
import { readStore, writeStore, getStorePath } from "@/lib/data/store";
import { writeRadarExports } from "@/lib/radar/export";

loadEnvConfig(process.cwd());

function hasChinese(value: string | undefined) {
  return Boolean(value && /[\u4e00-\u9fff]/.test(value));
}

async function main() {
  if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
    throw new Error("Missing DEEPSEEK_API_KEY or OPENAI_API_KEY. Add it to .env.local first.");
  }

  const store = await readStore();
  let updated = 0;

  for (const signal of store.signals) {
    if (hasChinese(signal.titleZh)) {
      continue;
    }

    const ai = await enrichSignalWithAi({
      title: signal.title,
      snippet: signal.rawContentSnippet || signal.summary
    });

    if (hasChinese(ai.titleZh)) {
      signal.titleZh = ai.titleZh;
      updated += 1;
    }
  }

  await writeStore(store);
  await writeRadarExports(store);

  console.log(`Backfilled ${updated} Chinese signal titles.`);
  console.log(`Store file: ${getStorePath()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
