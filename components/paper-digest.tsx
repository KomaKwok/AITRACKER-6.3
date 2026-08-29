import { ArrowUpRight, BookOpen } from "lucide-react";
import { Signal } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { formatRelativeDate } from "@/lib/utils";

export function PaperDigest({
  papers,
  locale
}: {
  papers: Signal[];
  locale: "zh" | "en";
}) {
  if (!papers.length) {
    return (
      <EmptyState
        title={locale === "zh" ? "还没有抓到论文" : "No papers fetched yet"}
        description={
          locale === "zh"
            ? "点击手动刷新后，这里会展示最近一期 Hugging Face Daily Papers 中热度最高的 10 篇。"
            : "Run a manual refresh to load the top 10 papers from the latest Hugging Face Daily Papers batch."
        }
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {papers.map((paper, index) => {
        const displayTitle =
          locale === "zh" && paper.titleZh && /[\u4e00-\u9fff]/.test(paper.titleZh) ? paper.titleZh : paper.title;

        return (
          <article key={paper.id} className="panel group p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-sm font-bold text-violet-700">
                {String(paper.sourceRank ?? index + 1).padStart(2, "0")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
                  <BookOpen className="h-3.5 w-3.5" />
                  {locale === "zh" ? "每日论文精选" : "Daily paper pick"}
                </div>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold leading-6 tracking-tight text-ink">{displayTitle}</h3>
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={locale === "zh" ? `打开论文：${displayTitle}` : `Open paper: ${displayTitle}`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition group-hover:border-violet-200 group-hover:text-violet-700"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{paper.summary}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {paper.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {tag}
                    </span>
                  ))}
                  <span className="text-xs text-slate-500">{formatRelativeDate(paper.publishedAt, locale)}</span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
