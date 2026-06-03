import {
  RawFetchedItem,
  SourceAdapter,
  absoluteUrl,
  fetchFirstAvailableText,
  fetchText,
  inferTags,
  isMarketingNoise,
  stripHtml,
  tryParseDateGuess,
  uniqueByUrl
} from "@/lib/radar/adapter-utils";

const PRODUCT_SIGNAL_TERMS = ["sdk", "arkitect", "agent", "api", "mcp", "模型", "豆包", "方舟", "插件", "联网"];
const ACTION_SIGNAL_TERMS = ["发布", "上线", "升级", "支持", "下线", "迁移", "调整", "公告", "release", "launch", "upgrade"];
const NOISE_TERMS = [
  "活动",
  "购买指南",
  "计费",
  "权限",
  "白皮书",
  "免费推理额度",
  "协作奖励计划",
  "我的收藏",
  "下载 pdf",
  "文档",
  "概览",
  "简介",
  "说明"
];

async function fetchVolcUpdatedTime(url: string) {
  try {
    const html = await fetchText(url);
    const datetimeMatches = [...html.matchAll(/[12]\d{3}[./-]\d{2}[./-]\d{2}\s+\d{2}:\d{2}:\d{2}/g)];
    const matched = datetimeMatches.at(-1)?.[0] ?? null;
    if (!matched) {
      return null;
    }

    return tryParseDateGuess(matched.replace(/\./g, "-"));
  } catch {
    return null;
  }
}

function normalizeVolcTitle(title: string) {
  return stripHtml(title).replace(/\s+/g, " ").trim();
}

function buildVolcCandidates(html: string, baseUrl: string) {
  const linkMatches = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

  return uniqueByUrl(
    linkMatches
      .map((match) => ({
        title: normalizeVolcTitle(match[2] ?? ""),
        url: absoluteUrl(baseUrl, match[1] ?? "")
      }))
      .filter((candidate) => candidate.title.length >= 6)
      .filter((candidate) => !candidate.url.includes("/1159177") && !candidate.url.includes("/1159178"))
      .filter((candidate) => !/公告\s*20\d{2}$/.test(candidate.title))
      .filter((candidate) => !isMarketingNoise(candidate.title))
      .filter((candidate) => {
        const haystack = candidate.title.toLowerCase();
        if (NOISE_TERMS.some((term) => haystack.includes(term.toLowerCase()))) {
          return false;
        }
        const hasProductSignal = PRODUCT_SIGNAL_TERMS.some((term) => haystack.includes(term.toLowerCase()));
        const hasActionSignal = ACTION_SIGNAL_TERMS.some((term) => haystack.includes(term.toLowerCase()));
        return hasProductSignal && hasActionSignal;
      })
  );
}

async function parseVolcAnnouncementList(html: string, baseUrl: string, category: RawFetchedItem["category"], product: string) {
  const candidates = buildVolcCandidates(html, baseUrl).slice(0, 12);

  const items = await Promise.all(
    candidates.map(async (candidate) => {
      const updatedAt = await fetchVolcUpdatedTime(candidate.url);
      if (!updatedAt) {
        return null;
      }

      return {
        title: candidate.title.slice(0, 120),
        url: candidate.url,
        company: "ByteDance",
        product,
        publishedAt: updatedAt,
        snippet: `${product} official announcement: ${candidate.title}`,
        category,
        tags: inferTags(candidate.title, candidate.title, category === "Model" ? ["Model Release"] : ["API"])
      } satisfies RawFetchedItem;
    })
  );

  return items.filter((item): item is NonNullable<typeof item> => item !== null);
}

export const doubaoProductAdapter: SourceAdapter = {
  sourceId: "doubao-product-announcements",
  async fetch(source) {
    const { url, text: html } = await fetchFirstAvailableText([source.url, ...(source.fallbackUrls ?? [])]);
    return parseVolcAnnouncementList(html, url, "Platform", source.product);
  }
};

export const doubaoModelAdapter: SourceAdapter = {
  sourceId: "doubao-model-announcements",
  async fetch(source) {
    const { url, text: html } = await fetchFirstAvailableText([source.url, ...(source.fallbackUrls ?? [])]);
    return parseVolcAnnouncementList(html, url, "Model", source.product);
  }
};
