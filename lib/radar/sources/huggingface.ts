import { fetchText, inferTags, parseDateGuess, uniqueByUrl } from "@/lib/radar/adapter-utils";
import { Source } from "@/lib/types";

const PAPER_LIMIT = 10;

interface HuggingFacePaper {
  id?: string;
  title?: string;
  summary?: string;
  ai_summary?: string;
  ai_keywords?: string[];
  publishedAt?: string;
  submittedOnDailyAt?: string;
  upvotes?: number;
}

interface DailyPaperEntry extends HuggingFacePaper {
  paper?: HuggingFacePaper;
}

interface NormalizedPaper extends HuggingFacePaper {
  id: string;
  title: string;
  dailyDate: string;
}

function normalizeEntry(entry: DailyPaperEntry): NormalizedPaper | null {
  const paper = entry.paper ?? entry;
  const id = paper.id?.trim();
  const title = (paper.title ?? entry.title)?.trim();

  if (!id || !title) {
    return null;
  }

  return {
    ...entry,
    ...paper,
    id,
    title,
    dailyDate: paper.submittedOnDailyAt ?? entry.submittedOnDailyAt ?? paper.publishedAt ?? entry.publishedAt ?? ""
  };
}

function selectLatestDailyPapers(papers: NormalizedPaper[]) {
  const latestDailyDate = papers
    .map((paper) => paper.dailyDate)
    .filter(Boolean)
    .sort((a, b) => +new Date(b) - +new Date(a))[0];

  const latestBatch = papers
    .filter((paper) => paper.dailyDate === latestDailyDate)
    .sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0));
  const earlierPapers = papers
    .filter((paper) => paper.dailyDate !== latestDailyDate)
    .sort(
      (a, b) =>
        +new Date(b.dailyDate || b.publishedAt || 0) - +new Date(a.dailyDate || a.publishedAt || 0) ||
        (b.upvotes ?? 0) - (a.upvotes ?? 0)
    );

  return [...latestBatch, ...earlierPapers].slice(0, PAPER_LIMIT);
}

export const huggingFaceDailyPapersAdapter = {
  sourceId: "huggingface-daily-papers",
  async fetch(source: Source) {
    const apiUrl = source.feedUrls?.[0] ?? "https://huggingface.co/api/daily_papers?p=0&limit=100&sort=publishedAt";
    const payload = JSON.parse(await fetchText(apiUrl)) as DailyPaperEntry[];
    const papers = payload.map(normalizeEntry).filter((paper): paper is NormalizedPaper => Boolean(paper));

    return uniqueByUrl(
      selectLatestDailyPapers(papers).map((paper, index) => {
        const summary = [paper.ai_summary, paper.summary, ...(paper.ai_keywords ?? [])]
          .filter(Boolean)
          .join(". ")
          .slice(0, 1800);

        return {
          title: paper.title,
          url: `https://huggingface.co/papers/${paper.id}`,
          externalId: `arxiv:${paper.id.replace(/v\d+$/i, "")}`,
          company: "Research Community",
          product: "AI Research",
          publishedAt: parseDateGuess(paper.publishedAt ?? paper.dailyDate),
          snippet: summary,
          category: "Paper" as const,
          tags: inferTags(paper.title, summary, ["Research"]),
          sourceRank: index + 1
        };
      })
    );
  }
};
