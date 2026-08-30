import { RawFetchedItem, fetchText, inferTags, parseDateGuess, stripHtml } from "@/lib/radar/adapter-utils";
import { Source } from "@/lib/types";

const PAPER_LIMIT = 10;
const FEATURED_MAX_AGE_DAYS = 90;
const FEATURED_PAPER_IDS = new Set(["2608.25756"]);

function decodeXml(value: string) {
  return stripHtml(value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
}

function readTag(block: string, tag: string) {
  return decodeXml(block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "");
}

function normalizeArxivId(value: string) {
  return value
    .replace(/^https?:\/\/(?:export\.)?arxiv\.org\/abs\//i, "")
    .replace(/^arxiv:/i, "")
    .replace(/v\d+$/i, "")
    .trim();
}

export function parseArxivFeed(xml: string, source: Source): RawFetchedItem[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)]
    .map((match) => match[1] ?? "")
    .map((entry) => {
      const idUrl = readTag(entry, "id");
      const arxivId = normalizeArxivId(idUrl);
      const title = readTag(entry, "title").replace(/\s+/g, " ").trim();
      const summary = readTag(entry, "summary").replace(/\s+/g, " ").trim();
      const publishedAt = parseDateGuess(readTag(entry, "published"));

      if (!arxivId || !title || !summary) {
        return null;
      }

      return {
        title,
        ...(arxivId === "2608.25756" ? { titleZh: "TailSFT：过滤式微调提升后训练表现" } : {}),
        url: `https://arxiv.org/abs/${arxivId}`,
        externalId: `arxiv:${arxivId}`,
        company: "Research Community",
        product: source.product,
        publishedAt,
        snippet: summary.slice(0, 1800),
        category: "Paper" as const,
        tags: inferTags(title, summary, ["Research"])
      };
    })
    .filter((paper): paper is NonNullable<typeof paper> => Boolean(paper));
}

function relevanceScore(paper: RawFetchedItem) {
  const haystack = `${paper.title} ${paper.snippet}`.toLowerCase();
  const weightedTerms: Array<[string, number]> = [
    ["post-training", 14],
    ["fine-tuning", 12],
    ["reinforcement learning", 12],
    ["language model", 10],
    ["reasoning", 9],
    ["agent", 9],
    ["alignment", 8],
    ["training data", 8],
    ["benchmark", 7],
    ["evaluation", 6],
    ["multimodal", 6],
    ["inference", 5],
    ["dataset", 5]
  ];
  const topicScore = weightedTerms.reduce((score, [term, weight]) => score + (haystack.includes(term) ? weight : 0), 0);
  const ageDays = Math.max(0, (Date.now() - +new Date(paper.publishedAt)) / (24 * 60 * 60 * 1000));
  const freshnessScore = Math.max(0, 30 - ageDays);
  const arxivId = paper.externalId?.replace(/^arxiv:/, "") ?? "";
  const featuredBoost = FEATURED_PAPER_IDS.has(arxivId) && ageDays <= FEATURED_MAX_AGE_DAYS ? 1000 : 0;
  return featuredBoost + topicScore + freshnessScore;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export const arxivAiPapersAdapter = {
  sourceId: "arxiv-ai-papers",
  async fetch(source: Source) {
    const [latestUrl, featuredUrl] = source.feedUrls ?? [];
    if (!latestUrl) {
      return [];
    }

    const latestPapers = parseArxivFeed(await fetchText(latestUrl), source);
    let featuredPapers: RawFetchedItem[] = [];

    if (featuredUrl) {
      await delay(3000);
      featuredPapers = parseArxivFeed(await fetchText(featuredUrl), source);
    }

    const uniquePapers = [...featuredPapers, ...latestPapers].filter(
      (paper, index, list) =>
        list.findIndex((candidate) => candidate.externalId === paper.externalId) === index &&
        Date.now() - +new Date(paper.publishedAt) <= FEATURED_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
    );

    return uniquePapers
      .sort((a, b) => relevanceScore(b) - relevanceScore(a) || +new Date(b.publishedAt) - +new Date(a.publishedAt))
      .slice(0, PAPER_LIMIT)
      .map((paper, index) => ({ ...paper, sourceRank: index + 1 }));
  }
};
