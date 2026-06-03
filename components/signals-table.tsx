import { Signal } from "@/lib/types";
import { RegionBadge, ScoreBar, SignalBadge, SourceBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { formatRelativeDate, hasReliableRecency, withinDays } from "@/lib/utils";

export function SignalsTable({
  signals,
  labels,
  locale
}: {
  signals: Signal[];
  labels: {
    signal: string;
    type: string;
    region: string;
    published: string;
    score: string;
    topSignal: string;
    strongSignal: string;
    watch: string;
  };
  locale: "zh" | "en";
}) {
  if (!signals.length) {
    return (
      <EmptyState
        title={locale === "zh" ? "暂无真实信号" : "No live signals yet"}
        description={
          locale === "zh"
            ? "当前筛选条件下还没有抓到可验证的真实信号。未实现适配器的来源会保持为空，而不会展示示例数据。"
            : "There are no verified live signals for the current filters yet. Unsupported sources stay empty instead of showing sample data."
        }
      />
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-4 py-4">{labels.signal}</th>
              <th className="px-4 py-4">{labels.type}</th>
              <th className="px-4 py-4">{labels.region}</th>
              <th className="px-4 py-4">{labels.published}</th>
              <th className="px-4 py-4">{labels.score}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white/70">
            {signals.map((signal) => {
              const displayTitle =
                locale === "zh" && signal.titleZh && /[\u4e00-\u9fff]/.test(signal.titleZh) ? signal.titleZh : signal.title;

              return (
              <tr key={signal.id} className="align-top" suppressHydrationWarning>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={signal.url} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-accent">
                        {displayTitle}
                      </a>
                      {hasReliableRecency(signal.sourceId) && withinDays(signal.publishedAt, 1) ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <SignalBadge
                        score={signal.signalScore}
                        labels={{ top: labels.topSignal, strong: labels.strongSignal, watch: labels.watch }}
                      />
                      {signal.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="max-w-xl text-slate-600">{signal.summary}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <SourceBadge sourceType={signal.sourceType} />
                    <div className="text-slate-600">{signal.company}</div>
                    <div className="text-xs text-slate-500">
                      {signal.product} / {signal.category}
                    </div>
                    <div className="text-xs text-slate-500">{signal.sourceName}</div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <RegionBadge region={signal.region} />
                </td>
                <td className="px-4 py-4 text-slate-600">{formatRelativeDate(signal.publishedAt, locale)}</td>
                <td className="px-4 py-4">
                  <ScoreBar score={signal.signalScore} />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
