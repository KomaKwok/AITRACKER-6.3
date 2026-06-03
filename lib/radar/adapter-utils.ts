import { Source, Tag } from "@/lib/types";

export interface RawFetchedItem {
  title: string;
  url: string;
  company: string;
  product: string;
  publishedAt: string;
  snippet: string;
  category: "Feature" | "Model" | "Platform" | "Deprecation" | "Pricing";
  tags?: Tag[];
}

export interface SourceAdapter {
  sourceId: string;
  fetch: (source: Source) => Promise<RawFetchedItem[]>;
}

const USER_AGENT = "AITracker/2.0";
const REQUEST_TIMEOUT_MS = 15000;

export async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "";
  const sniff = buffer.toString("ascii", 0, Math.min(buffer.length, 2048));
  const declaredCharset =
    contentType.match(/charset=([^;]+)/i)?.[1] ??
    sniff.match(/charset=["']?([\w-]+)/i)?.[1] ??
    "utf-8";
  const normalizedCharset = /gbk|gb2312|gb18030/i.test(declaredCharset) ? "gb18030" : "utf-8";

  return new TextDecoder(normalizedCharset).decode(buffer);
}

export async function fetchFirstAvailableText(urls: string[]) {
  const errors: string[] = [];

  for (const url of urls) {
    try {
      const text = await fetchText(url);
      return { url, text };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(errors.join(" | "));
}

export function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(parseInt(decimal, 10)))
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function absoluteUrl(baseUrl: string, maybeRelative: string) {
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return maybeRelative;
  }
}

export function tryParseDateGuess(text: string) {
  const direct = Date.parse(text);
  if (!Number.isNaN(direct)) {
    return new Date(direct).toISOString();
  }

  const patterns = [
    /\b\d{4}-\d{2}-\d{2}\b/,
    /\b\d{4}\.\d{2}\.\d{2}\b/,
    /\b[A-Z][a-z]+ \d{1,2}, \d{4}\b/,
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}, \d{4}\b/i,
    /\b\d{4}[年.-]\d{1,2}[月.-]\d{1,2}\b/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[0]) {
      continue;
    }

    const normalized = match[0].replace(/\./g, "-").replace(/年|月/g, "-").replace(/日/g, "");
    const parsed = Date.parse(normalized);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  return null;
}

export function parseDateGuess(text: string) {
  return tryParseDateGuess(text) ?? new Date().toISOString();
}

export function cleanBulletText(value: string) {
  return stripHtml(value)
    .replace(/^[-*•\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function uniqueByUrl<T extends { url: string }>(items: T[]) {
  return items.filter((item, index, list) => list.findIndex((candidate) => candidate.url === item.url) === index);
}

export function isMarketingNoise(text: string) {
  const haystack = text.toLowerCase();
  const negatives = [
    "register now",
    "contact sales",
    "learn more about us",
    "join us",
    "newsletter",
    "webinar",
    "summit",
    "case study",
    "customer story",
    "free credit",
    "活动",
    "报名",
    "直播",
    "峰会",
    "白皮书",
    "品牌"
  ];

  return negatives.some((term) => haystack.includes(term));
}

export function inferTags(title: string, snippet: string, extras: Tag[] = []) {
  const haystack = `${title} ${snippet}`.toLowerCase();
  const tags = new Set<Tag>(extras);

  if (/\bagent|mcp|tool|workflow|assistant\b/i.test(haystack)) tags.add("Agent");
  if (/\bcode|coding|sdk|developer|cli|repo\b/i.test(haystack)) tags.add("Coding");
  if (/\bsearch|retrieval|knowledge\b/i.test(haystack)) tags.add("Search");
  if (/\bimage|video|audio|voice|vision|multimodal\b/i.test(haystack)) tags.add("Multimodal");
  if (/\bmodel|snapshot|release|version|flash|sonnet|opus|seed\b/i.test(haystack)) tags.add("Model Release");
  if (/\bapi|endpoint|responses|chat completions|openai compatible\b/i.test(haystack)) tags.add("API");
  if (/\bteam|enterprise|admin|analytics|compliance|governance\b/i.test(haystack)) tags.add("Enterprise");
  if (/\blatency|cache|runtime|infra|infrastructure\b/i.test(haystack)) tags.add("Infrastructure");

  return [...tags].slice(0, 4);
}
