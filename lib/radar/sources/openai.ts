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

export const openAiFrontierWatchAdapter: SourceAdapter = {
  sourceId: "openai-frontier-watch",
  async fetch(source) {
    const { url, text: html } = await fetchFirstAvailableText([source.url, ...(source.fallbackUrls ?? [])]);
    const rssItem = [...html.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
      .map((match) => match[1] ?? "")
      .find((item) => /Astra/i.test(item));
    const evidenceBlock = rssItem ?? html;
    const text = stripHtml(evidenceBlock.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
    const hasVerifiedUpcomingModel =
      /Astra/i.test(text) &&
      (/upcoming models?|frontier models?|Astra models?|critical cyber/i.test(text) ||
        /responding-next-frontier-critical-cyber-capabilities/i.test(evidenceBlock));

    if (!hasVerifiedUpcomingModel) {
      return [];
    }

    const rssDate = evidenceBlock.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1];
    const rssLink = evidenceBlock.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const publishedAt = parseDateGuess(rssDate ?? text.match(/August\s+(?:7|18),\s+2026/i)?.[0] ?? text);
    return [
      {
        title: "OpenAI confirms Astra is an upcoming model while expanding safety testing",
        titleZh: "OpenAI 确认 Astra 正在开发",
        url: rssLink || (url.endsWith(".xml") ? source.url : url),
        company: source.company,
        product: source.product,
        publishedAt,
        snippet:
          "OpenAI says internal evaluations show a major step forward in agentic coding and cybersecurity. Astra is an upcoming model, but its release timing and any ChatGPT rollout remain unconfirmed while safeguards are expanded.",
        category: "Model",
        tags: ["Model Release", "Agent", "Coding"],
        status: "developing"
      }
    ];
  }
};
