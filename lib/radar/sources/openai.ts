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
