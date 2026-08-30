import { fetchFirstAvailableText, fetchText, stripHtml, tryParseDateGuess } from "@/lib/radar/adapter-utils";
import { PriceSnapshotEntry, pricingSnapshot } from "@/lib/data/pricing-snapshot";
import { readPersistedJson, writePersistedJson } from "@/lib/data/persisted-json";

interface ParsedPrice {
  product: string;
  headlinePrice: string;
  secondaryPrice: string;
  officialUpdatedAt?: string | null;
  note: string;
}

interface PricingDefinition {
  company: string;
  sourceUrl: string;
  load?: () => Promise<string>;
  parse: (html: string) => ParsedPrice | null;
}

function money(value: string) {
  return value.replace(/,/g, "").match(/\d+(?:\.\d+)?/)?.[0] ?? null;
}

function htmlRows(html: string) {
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((row) =>
      [...row[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)]
        .map((cell) => stripHtml(cell[1]))
        .filter(Boolean)
    )
    .filter((row) => row.length > 1);
}

function normalizedText(html: string) {
  return stripHtml(
    html
      .replace(/<\/(?:p|div|li|h[1-6]|tr|td|th)>/gi, "\n")
      .replace(/<br\s*\/?\s*>/gi, "\n")
  ).replace(/\s+/g, " ");
}

function parseOfficialUpdatedAt(text: string) {
  const match = text.match(/(?:最近更新时间|Last updated)[:：\s]*(\d{4}[-./]\d{1,2}[-./]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i);
  return match?.[1] ? tryParseDateGuess(match[1]) : null;
}

function versionScore(name: string) {
  const numbers = name.match(/\d+(?:\.\d+)*/g) ?? [];
  return numbers.reduce((score, value, index) => score + Number(value) / 10 ** (index * 3), 0);
}

function parseOpenAi(html: string): ParsedPrice | null {
  const text = normalizedText(html);
  const candidates = [...text.matchAll(/(GPT-\d+(?:\.\d+)*\s+Sol)\b/gi)].sort(
    (a, b) => versionScore(b[1]) - versionScore(a[1])
  );

  for (const candidate of candidates) {
    const window = text.slice(candidate.index, (candidate.index ?? 0) + 900);
    const prices = window.match(/Input price\s*\$([\d.]+)[\s\S]*?Output price\s*\$([\d.]+)/i);
    if (prices) {
      return {
        product: candidate[1].replace(/\s+/g, " "),
        headlinePrice: `$${prices[1]} / 1M input`,
        secondaryPrice: `$${prices[2]} / 1M output`,
        note: "Official OpenAI model catalog flagship rate; standard short-context processing."
      };
    }
  }

  return null;
}

function parseAnthropic(html: string): ParsedPrice | null {
  const rows = htmlRows(html)
    .filter((row) => /^Claude Opus\s+\d+(?:\.\d+)?$/i.test(row[0]))
    .sort((a, b) => versionScore(b[0]) - versionScore(a[0]) || b.length - a.length);

  for (const row of rows) {
    const values = row.slice(1).map(money).filter((value): value is string => Boolean(value));
    if (values.length >= 2) {
      return {
        product: row[0].replace(/\s*\(.+?\)\s*/g, "").trim(),
        headlinePrice: `$${values[0]} / 1M input`,
        secondaryPrice: `$${values.at(-1)} / 1M output`,
        note: "Official Claude API base input and output token rates."
      };
    }
  }

  const text = normalizedText(html);
  const match = text.match(/(Claude Opus\s+\d+(?:\.\d+)?)[\s\S]{0,500}?\$([\d.]+)\s*\/\s*MTok[\s\S]{0,500}?\$([\d.]+)\s*\/\s*MTok/i);
  return match
    ? {
        product: match[1],
        headlinePrice: `$${match[2]} / 1M input`,
        secondaryPrice: `$${match[3]} / 1M output`,
        note: "Official Claude API base input and output token rates."
      }
    : null;
}

function parseTencent(html: string): ParsedPrice | null {
  const rows = htmlRows(html)
    .filter((row) => /^Hy\d+\b/i.test(row[0]) && !/preview|role|vision|image|mt/i.test(row[0]))
    .sort((a, b) => versionScore(b[0]) - versionScore(a[0]));
  const row = rows[0];
  const values = row?.slice(1).map(money).filter((value): value is string => Boolean(value)) ?? [];
  const text = normalizedText(html);

  if (row && values.length >= 2) {
    return {
      product: row[0],
      headlinePrice: `¥${values.at(-3) ?? values[0]} / 1M input`,
      secondaryPrice: `¥${values.at(-2) ?? values[1]} / 1M output`,
      officialUpdatedAt: parseOfficialUpdatedAt(text),
      note: "Tencent TokenHub flagship text model, online inference in Guangzhou."
    };
  }

  const match = text.match(/\b(Hy\d+)\b[\s\S]{0,180}?([\d.]+)\s*[|\s]+([\d.]+)\s*[|\s]+([\d.]+)/i);
  return match
    ? {
        product: match[1],
        headlinePrice: `¥${match[2]} / 1M input`,
        secondaryPrice: `¥${match[3]} / 1M output`,
        officialUpdatedAt: parseOfficialUpdatedAt(text),
        note: "Tencent TokenHub flagship text model, online inference in Guangzhou."
      }
    : null;
}

function parseDeepSeek(html: string): ParsedPrice | null {
  const text = normalizedText(html);
  const englishMatch = text.match(
    /(DeepSeek-V\d+(?:[.-]\d+)*-Pro)[\s\S]{0,900}?Input\s*\(cache miss\)\s*US?\$([\d.]+)[\s\S]{0,240}?Output\s*US?\$([\d.]+)/i
  );
  if (englishMatch) {
    return {
      product: englishMatch[1],
      headlinePrice: `$${englishMatch[2]} / 1M input`,
      secondaryPrice: `$${englishMatch[3]} / 1M output`,
      note: "Official DeepSeek cache-miss input and output token rates."
    };
  }

  const chineseMatch = text.match(
    /(DeepSeek-V\d+(?:[.-]\d+)*-Pro)[\s\S]{0,500}?输入（缓存未命中）\s*([\d.]+)\s*元[\s\S]{0,160}?输出\s*([\d.]+)\s*元/i
  );
  return chineseMatch
    ? {
        product: chineseMatch[1],
        headlinePrice: `¥${chineseMatch[2]} / 1M input`,
        secondaryPrice: `¥${chineseMatch[3]} / 1M output`,
        note: "Official DeepSeek cache-miss input and output token rates."
      }
    : null;
}

function parseMiniMax(html: string): ParsedPrice | null {
  const text = normalizedText(html);
  const candidates = [...text.matchAll(/(MiniMax-M\d+(?:\.\d+)*)\b/gi)].sort(
    (a, b) => versionScore(b[1]) - versionScore(a[1])
  );

  for (const candidate of candidates) {
    const window = text.slice(candidate.index, (candidate.index ?? 0) + 600);
    const values = [...window.matchAll(/\$([\d.]+)/g)].map((match) => Number(match[1]));
    if (values.length >= 4) {
      return {
        product: candidate[1],
        headlinePrice: `$${Math.min(values[0], values[1])} / 1M input`,
        secondaryPrice: `$${Math.min(values[2], values[3])} / 1M output`,
        note: "Official MiniMax API rate for the standard <=512K context tier."
      };
    }
    if (values.length >= 2) {
      return {
        product: candidate[1],
        headlinePrice: `$${values[0]} / 1M input`,
        secondaryPrice: `$${values[1]} / 1M output`,
        note: "Official MiniMax API rate for the standard context tier."
      };
    }
  }

  return null;
}

function parseDoubao(html: string): ParsedPrice | null {
  const bundleMatch = html.match(
    /text:["'](Doubao-Seed-Evolving)["'][\s\S]{0,520}?text:["']([\d.]+)["'],unit:["']元(?:起)?\/百万输入tokens["'][\s\S]{0,180}?text:["']([\d.]+)["'],unit:["']元(?:起)?\/百万输出tokens["']/i
  );
  if (bundleMatch) {
    return {
      product: bundleMatch[1],
      headlinePrice: `¥${bundleMatch[2]} / 1M input`,
      secondaryPrice: `¥${bundleMatch[3]} / 1M output`,
      note: "Official Volcano Engine Ark pay-as-you-go rate for the current Doubao flagship model."
    };
  }

  const text = normalizedText(html);
  const candidates = [...text.matchAll(/(Doubao-Seed-(?:Evolving|\d+(?:\.\d+)*-pro))\b/gi)].sort((a, b) => {
    const aEvolving = /Evolving/i.test(a[1]) ? 1 : 0;
    const bEvolving = /Evolving/i.test(b[1]) ? 1 : 0;
    return bEvolving - aEvolving || versionScore(b[1]) - versionScore(a[1]);
  });

  for (const candidate of candidates) {
    const window = text.slice(candidate.index, (candidate.index ?? 0) + 420);
    const prices = window.match(/([\d.]+)\s*元起?\s*\/\s*百万输入\s*tokens[\s\S]{0,100}?([\d.]+)\s*元起?\s*\/\s*百万输出\s*tokens/i);
    if (prices) {
      return {
        product: candidate[1],
        headlinePrice: `¥${prices[1]} / 1M input`,
        secondaryPrice: `¥${prices[2]} / 1M output`,
        officialUpdatedAt: parseOfficialUpdatedAt(text),
        note: "Official short-context starting rate for the flagship Doubao text model."
      };
    }
  }

  return null;
}

async function loadDoubaoPricingBundle() {
  const productPageUrl = "https://www.volcengine.com/product/ark";
  const productPage = await fetchText(productPageUrl);
  const moduleDefinition = productPage.match(/"name":"product\/ark"[\s\S]{0,900}/)?.[0];
  const bundlePaths = moduleDefinition
    ? [...moduleDefinition.matchAll(/"source_url(?:_backup)?":"(\/\/[^"?]+\/bundles\/js\/main\.js)"/g)].map(
        (match) => `https:${match[1]}`
      )
    : [];

  if (!bundlePaths.length) {
    throw new Error("Volcano Engine Ark page loaded, but its pricing bundle URL was not found.");
  }

  return (await fetchFirstAvailableText(bundlePaths)).text;
}

const definitions: PricingDefinition[] = [
  {
    company: "OpenAI",
    sourceUrl: "https://developers.openai.com/api/docs/models",
    parse: parseOpenAi
  },
  {
    company: "Anthropic",
    sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    parse: parseAnthropic
  },
  {
    company: "腾讯混元",
    sourceUrl: "https://cloud.tencent.com/document/product/1823/130055",
    parse: parseTencent
  },
  {
    company: "DeepSeek",
    sourceUrl: "https://www.deepseek.com/platform/",
    parse: parseDeepSeek
  },
  {
    company: "MiniMax",
    sourceUrl: "https://platform.minimax.io/docs/guides/pricing-paygo",
    parse: parseMiniMax
  },
  {
    company: "豆包 / 方舟",
    sourceUrl: "https://www.volcengine.com/product/ark",
    load: loadDoubaoPricingBundle,
    parse: parseDoubao
  }
];

async function readPreviousEntries() {
  const parsed = await readPersistedJson<{ entries?: PriceSnapshotEntry[] }>({
    filename: "pricing-snapshot.json",
    blobPathname: "ai-radar/pricing-snapshot.json",
    fallback: { entries: pricingSnapshot }
  });
  return parsed.entries?.length ? parsed.entries : pricingSnapshot;
}

function hasPriceChanged(previous: PriceSnapshotEntry, next: ParsedPrice) {
  return (
    previous.product !== next.product ||
    previous.headlinePrice !== next.headlinePrice ||
    previous.secondaryPrice !== next.secondaryPrice
  );
}

export async function refreshPricingSnapshot() {
  const now = new Date().toISOString();
  const previousEntries = await readPreviousEntries();
  const previousMap = new Map(previousEntries.map((entry) => [entry.company, entry]));

  const entries = await Promise.all(
    definitions.map(async (definition) => {
      const previous = previousMap.get(definition.company) ?? pricingSnapshot.find((entry) => entry.company === definition.company)!;

      try {
        const html = definition.load ? await definition.load() : await fetchText(definition.sourceUrl);
        const parsed = definition.parse(html);
        if (!parsed) {
          throw new Error("Official page loaded, but the flagship price row could not be parsed.");
        }

        return {
          ...previous,
          ...parsed,
          sourceUrl: definition.sourceUrl,
          verifiedAt: now,
          lastAttemptedAt: now,
          verificationStatus: "verified" as const,
          verificationMessage: "Official page fetched and flagship price parsed successfully.",
          priceChangedAt: hasPriceChanged(previous, parsed) ? now : previous.priceChangedAt ?? previous.verifiedAt
        };
      } catch (error) {
        return {
          ...previous,
          sourceUrl: definition.sourceUrl,
          lastAttemptedAt: now,
          verificationStatus: "stale" as const,
          verificationMessage: error instanceof Error ? error.message : "Pricing refresh failed."
        };
      }
    })
  );

  await writePersistedJson({
    filename: "pricing-snapshot.json",
    blobPathname: "ai-radar/pricing-snapshot.json",
    value: { refreshedAt: now, entries }
  });

  return {
    refreshedAt: now,
    entries,
    verifiedCount: entries.filter((entry) => entry.verificationStatus === "verified").length
  };
}
