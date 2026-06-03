import { RawFetchedItem, SourceAdapter, cleanBulletText, fetchFirstAvailableText, inferTags, parseDateGuess, stripHtml } from "@/lib/radar/adapter-utils";

export const minimaxAdapter: SourceAdapter = {
  sourceId: "minimax-agent-changelog",
  async fetch(source) {
    const { url, text: html } = await fetchFirstAvailableText([source.url, ...(source.fallbackUrls ?? [])]);
    const sections = [...html.matchAll(/v[\d.]+\s+[—-]\s+([0-9]{4}-[0-9]{2}-[0-9]{2})([\s\S]*?)(?=v[\d.]+\s+[—-]\s+[0-9]{4}-[0-9]{2}-[0-9]{2}|$)/g)];
    const items: RawFetchedItem[] = [];

    for (const match of sections) {
      const publishedAt = parseDateGuess(match[1] ?? "");
      const block = match[2] ?? "";
      const bulletMatches = [...block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];

      for (const bullet of bulletMatches) {
        const snippet = cleanBulletText(bullet[1] ?? "");
        if (!snippet || snippet.length < 18) {
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
          category: /desktop|web|session|workspace|permission/i.test(snippet) ? "Platform" : "Feature",
          tags: inferTags(title, snippet, ["Agent"])
        });
      }
    }

    return items.slice(0, 16);
  }
};
