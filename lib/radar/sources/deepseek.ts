import { RawFetchedItem, SourceAdapter, cleanBulletText, fetchFirstAvailableText, inferTags, parseDateGuess, stripHtml } from "@/lib/radar/adapter-utils";

export const deepSeekAdapter: SourceAdapter = {
  sourceId: "deepseek-api-updates",
  async fetch(source) {
    const { url, text: html } = await fetchFirstAvailableText([source.url, ...(source.fallbackUrls ?? [])]);
    const sections = [
      ...html.matchAll(
        /<h2[^>]*>\s*Date:\s*([0-9-]+)[\s\S]*?<\/h2>\s*<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<hr>|<h2[^>]*>\s*Date:|$)/gi
      )
    ];
    const items: RawFetchedItem[] = [];

    for (const match of sections) {
      const publishedAt = parseDateGuess(match[1] ?? "");
      const heading = stripHtml(match[2] ?? "");
      const block = match[3] ?? "";
      const paragraphMatches = [...block.matchAll(/<(?:p|li)[^>]*>([\s\S]*?)<\/(?:p|li)>/gi)];
      const snippetParts = paragraphMatches
        .map((part) => cleanBulletText(part[1] ?? ""))
        .filter(Boolean)
        .slice(0, 3);
      const snippet = snippetParts.join(" ");

      if (!heading || !snippet) {
        continue;
      }

      items.push({
        title: heading.slice(0, 120),
        url,
        company: source.company,
        product: source.product,
        publishedAt,
        snippet,
        category: /model|v\d|r\d/i.test(heading) ? "Model" : "Feature",
        tags: inferTags(heading, snippet, ["API"])
      });
    }

    return items.slice(0, 12);
  }
};
