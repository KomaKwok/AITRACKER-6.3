import { RawFetchedItem, SourceAdapter, cleanBulletText, fetchFirstAvailableText, inferTags, tryParseDateGuess } from "@/lib/radar/adapter-utils";

const DATE_HEADING_RE =
  /<h[2-4][^>]*>[\s\S]*?([A-Z][a-z]+ \d{1,2}, \d{4})[\s\S]*?<\/h[2-4]>([\s\S]*?)(?=<h[2-4][^>]*>[\s\S]*?[A-Z][a-z]+ \d{1,2}, \d{4}[\s\S]*?<\/h[2-4]>|$)/gi;

function normalizeTitle(value: string) {
  return cleanBulletText(value).replace(/\s+/g, " ").trim().slice(0, 120);
}

function classifyCategory(text: string, fallback: RawFetchedItem["category"]) {
  if (/deprecat|retire|removal|sunset/i.test(text)) {
    return "Deprecation";
  }
  if (/model|opus|sonnet|haiku/i.test(text)) {
    return "Model";
  }
  return fallback;
}

function parseApiItems(html: string, sourceUrl: string, company: string, product: string) {
  const items: RawFetchedItem[] = [];

  for (const match of html.matchAll(DATE_HEADING_RE)) {
    const publishedAt = tryParseDateGuess(match[1] ?? "");
    if (!publishedAt) {
      continue;
    }

    const block = match[2] ?? "";
    const bullets = [...block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];

    for (const bullet of bullets) {
      const snippet = cleanBulletText(bullet[1] ?? "");
      if (!snippet || snippet.length < 30 || /For updates to claude\.ai/i.test(snippet)) {
        continue;
      }

      const title =
        normalizeTitle(
          snippet.split(/(?<=\.)\s/)[0] ??
            snippet.split(/[:;]/)[0] ??
            snippet
        ) || normalizeTitle(snippet);
      if (!title) {
        continue;
      }

      items.push({
        title,
        url: sourceUrl,
        company,
        product,
        publishedAt,
        snippet,
        category: classifyCategory(`${title} ${snippet}`, "Feature"),
        tags: inferTags(title, snippet, ["API"])
      });
    }
  }

  return items.slice(0, 18);
}

function parseAppItems(html: string, sourceUrl: string, company: string, product: string) {
  const items: RawFetchedItem[] = [];

  for (const match of html.matchAll(DATE_HEADING_RE)) {
    const publishedAt = tryParseDateGuess(match[1] ?? "");
    if (!publishedAt) {
      continue;
    }

    const block = match[2] ?? "";
    const paragraphs = [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((paragraph) => cleanBulletText(paragraph[1] ?? ""))
      .filter(Boolean)
      .filter((paragraph) => !/^\*+\s*$/.test(paragraph));

    for (let index = 0; index < paragraphs.length - 1; index += 1) {
      const titleCandidate = paragraphs[index] ?? "";
      const snippetCandidate = paragraphs[index + 1] ?? "";

      const looksLikeTitle =
        titleCandidate.length >= 6 &&
        titleCandidate.length <= 100 &&
        !/[.!?]$/.test(titleCandidate) &&
        !/for more information/i.test(titleCandidate);
      const looksLikeBody = snippetCandidate.length >= 35;

      if (!looksLikeTitle || !looksLikeBody) {
        continue;
      }

      items.push({
        title: normalizeTitle(titleCandidate),
        url: sourceUrl,
        company,
        product,
        publishedAt,
        snippet: snippetCandidate,
        category: classifyCategory(`${titleCandidate} ${snippetCandidate}`, "Platform"),
        tags: inferTags(titleCandidate, snippetCandidate)
      });
      index += 1;
    }
  }

  return items.slice(0, 18);
}

export const anthropicApiAdapter: SourceAdapter = {
  sourceId: "claude-api-release-notes",
  async fetch(source) {
    const { url, text: html } = await fetchFirstAvailableText([source.url, ...(source.fallbackUrls ?? [])]);
    return parseApiItems(html, url, source.company, source.product);
  }
};

export const anthropicAppsAdapter: SourceAdapter = {
  sourceId: "claude-app-release-notes",
  async fetch(source) {
    const { url, text: html } = await fetchFirstAvailableText([source.url, ...(source.fallbackUrls ?? [])]);
    return parseAppItems(html, url, source.company, source.product);
  }
};
