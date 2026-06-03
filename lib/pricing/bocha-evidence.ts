import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pricingSnapshot, PriceDateEvidence } from "@/lib/data/pricing-snapshot";

interface BochaResult {
  name?: string;
  url?: string;
  siteName?: string;
  snippet?: string;
  summary?: string;
  datePublished?: string;
}

const officialIncludes: Record<string, string> = {
  OpenAI: "openai.com",
  Anthropic: "anthropic.com,platform.claude.com",
  Google: "ai.google.dev,developers.googleblog.com,blog.google",
  DeepSeek: "api-docs.deepseek.com,deepseek.com",
  MiniMax: "platform.minimax.io,minimax.io",
  "豆包 / 方舟": "volcengine.com"
};

const queryTemplates: Record<string, string> = {
  OpenAI: "OpenAI API pricing price update announcement changelog official",
  Anthropic: "Anthropic Claude API pricing price update announcement changelog official",
  Google: "Google Gemini API pricing price update announcement official",
  DeepSeek: "DeepSeek API pricing price update announcement changelog official",
  MiniMax: "MiniMax API pricing price update announcement release notes official",
  "豆包 / 方舟": "火山方舟 Agent Plan 价格 套餐 更新 公告 官方"
};

function hasPriceIntent(result: BochaResult) {
  const text = `${result.name ?? ""} ${result.snippet ?? ""} ${result.summary ?? ""}`.toLowerCase();
  return /price|pricing|bill|cost|token|rate|价格|定价|计费|套餐|费用/.test(text);
}

function parseDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(+date) ? null : date.toISOString();
}

async function searchBocha(company: string) {
  const response = await fetch("https://api.bochaai.com/v1/web-search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BOCHA_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: queryTemplates[company] ?? `${company} pricing update announcement official`,
      freshness: "noLimit",
      summary: true,
      include: officialIncludes[company],
      count: 8
    })
  });

  if (!response.ok) {
    throw new Error(`Bocha error ${response.status} for ${company}`);
  }

  const payload = await response.json();
  return (payload.data?.webPages?.value ?? payload.webPages?.value ?? []) as BochaResult[];
}

export async function updatePricingEvidence() {
  if (!process.env.BOCHA_API_KEY) {
    throw new Error("Missing BOCHA_API_KEY.");
  }

  const evidence: Record<string, PriceDateEvidence> = {};

  for (const entry of pricingSnapshot) {
    if (entry.officialUpdatedAt) {
      evidence[entry.company] = {
        kind: "official_page",
        date: entry.officialUpdatedAt,
        title: entry.note,
        url: entry.sourceUrl,
        checkedAt: new Date().toISOString()
      };
      continue;
    }

    const results = await searchBocha(entry.company);
    const matched = results.find((result) => result.url && hasPriceIntent(result));
    const date = parseDate(matched?.datePublished);

    evidence[entry.company] =
      matched && date
        ? {
            kind: "official_announcement",
            date,
            title: matched.name,
            url: matched.url,
            siteName: matched.siteName,
            checkedAt: new Date().toISOString()
          }
        : {
            kind: "not_stated",
            date: null,
            title: matched?.name ?? entry.note,
            url: matched?.url ?? entry.sourceUrl,
            siteName: matched?.siteName,
            checkedAt: new Date().toISOString()
          };
  }

  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });
  await writeFile(path.join(dataDir, "pricing-evidence.json"), JSON.stringify(evidence, null, 2), "utf8");

  return evidence;
}
