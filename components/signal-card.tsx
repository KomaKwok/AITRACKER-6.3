import { ArrowUpRight } from "lucide-react";
import { Signal } from "@/lib/types";
import { RegionBadge, ScoreBar, SignalBadge, SourceBadge } from "@/components/badges";
import { formatRelativeDate, hasReliableRecency, withinDays } from "@/lib/utils";

export function SignalCard({
  signal,
  labels,
  locale
}: {
  signal: Signal;
  labels: { topSignal: string; strongSignal: string; watch: string; newLabel?: string };
  locale: "zh" | "en";
}) {
  const isNew = hasReliableRecency(signal.sourceId) && withinDays(signal.publishedAt, 1);
  const displayTitle = locale === "zh" && signal.titleZh && /[\u4e00-\u9fff]/.test(signal.titleZh) ? signal.titleZh : signal.title;

  return (
    <article className="panel p-5">
      <div className="flex flex-wrap items-center gap-2">
        <RegionBadge region={signal.region} />
        <SourceBadge sourceType={signal.sourceType} />
        <SignalBadge
          score={signal.signalScore}
          labels={{ top: labels.topSignal, strong: labels.strongSignal, watch: labels.watch }}
        />
        {signal.status === "developing" ? (
          <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
            {locale === "zh" ? "前瞻 · 尚未发布" : "Developing · not released"}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight text-ink">{displayTitle}</h3>
            {isNew ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {labels.newLabel ?? "NEW"}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{signal.summary}</p>
        </div>
        <a
          href={signal.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {signal.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-medium text-slate-700">{signal.company}</span>
          {" · "}
          {signal.sourceName}
          {" · "}
          {formatRelativeDate(signal.publishedAt, locale)}
        </div>
        <ScoreBar score={signal.signalScore} />
      </div>
    </article>
  );
}
