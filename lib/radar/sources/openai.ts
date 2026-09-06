import { RawFetchedItem, SourceAdapter, cleanBulletText, fetchFirstAvailableText, inferTags, parseDateGuess, stripHtml } from "@/lib/radar/adapter-utils";

export const openAiAdapter: SourceAdapter = {
  sourceId: "openai-api-changelog",
  async fetch(source) {
    const { url, text: html } = await fetchFirstAvailableText([source.url, ...(source.fallbackUrls ?? [])]);
    const sectionMatches = [
      ...html.matchAll(
        /<h(?:2|3)[^>]*>([A-Z][a-z]+(?:\s+\d{1,2})?,\s+\d{4}|[A-Z][a-z]+\s+\d{4})<\/h(?:2|3)>([\s\S]*?)(?=<h(?:2|3)[^>]*>|$)/gi
      )
    ];

    const items: RawFetchedItem[] = [];

    for (const match of sectionMatches) {
      const publishedAt = parseDateGuess(stripHtml(match[1] ?? ""));
      const block = match[2] ?? "";
      const bulletMatches = [...block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];

      for (const bullet of bulletMatches) {
        const snippet = cleanBulletText(bullet[1] ?? "");
        if (!snippet || snippet.length < 24) {
          continue;
        }

        const title = snippet.split(/[.;:]/)[0]?.trim().slice(0, 120);
        if (!title) {
          continue;
        }

        items.push({
          title,
          url,
          company: source.company,
          product: source.product,
          publishedAt,
          snippet,
          category: /deprecat|retire|sunset/i.test(snippet) ? "Deprecation" : /price|billing/i.test(snippet) ? "Pricing" : "Feature",
          tags: inferTags(title, snippet, ["API"])
        });
      }
    }

    return items.slice(0, 16);
  }
};

// Parse the current feed instead of synthesizing a specific model announcement.
export function parseOpenAiNews(xml: string, source: import("@/lib/types").Source): RawFetchedItem[] {
  const readTag = (block: string, tag: string) => stripHtml(
    (block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  ).trim();
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].flatMap((match) => {
    const block = match[1];
    const title = readTag(block, "title");
    const url = readTag(block, "link");
    const date = Date.parse(readTag(block, "pubDate"));
    const snippet = readTag(block, "description");
    try {
      const link = new URL(url);
      if (link.protocol !== "https:" || !["openai.com", "www.openai.com"].includes(link.hostname)) return [];
    } catch { return []; }
    if (!title || !Number.isFinite(date) || date > Date.now() + 86400000) return [];
    const text = `${title} ${snippet}`;
    return [{
      title, url, company: source.company, product: source.product,
      publishedAt: new Date(date).toISOString(), snippet,
      category: /deprecat|retire|sunset/i.test(text) ? "Deprecation" as const
        : /pric|billing/i.test(text) ? "Pricing" as const
        : /model|gpt|reasoning/i.test(text) ? "Model" as const : "Feature" as const,
      tags: inferTags(title, snippet)
    }];
  }).sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}

export const openAiNewsAdapter: SourceAdapter = {
  sourceId: "openai-news",
  async fetch(source) {
    const { text } = await fetchFirstAvailableText([source.url]);
    return parseOpenAiNews(text, source);
  }
};
