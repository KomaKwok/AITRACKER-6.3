import { RegionBadge, SourceBadge } from "@/components/badges";
import { formatRelativeDate } from "@/lib/utils";
import { Source } from "@/lib/types";

export function SourceList({
  sources,
  labels,
  locale
}: {
  sources: Source[];
  labels: {
    active: string;
    inactive: string;
    visit: string;
    lastFetched: string;
    lastSuccess: string;
    priority: string;
    fetchVia: string;
    status: string;
    details: string;
    success: string;
    empty: string;
    error: string;
  };
  locale: "zh" | "en";
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {sources.map((source) => (
        <article key={source.id} className="panel p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2">
                <RegionBadge region={source.region} />
                <SourceBadge sourceType={source.sourceType} />
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {labels.priority} {source.priority}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    source.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {source.active ? labels.active : labels.inactive}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{source.name}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {source.company} / {source.product}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {labels.fetchVia} {source.fetchStrategy}
              </p>
              <p className="mt-2 text-sm text-slate-600">{labels.details} {source.lastFetchMessage ?? "—"}</p>
            </div>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {labels.visit}
            </a>
          </div>
          <div className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
            <div className="flex items-center justify-between gap-2 sm:block">
              <span>{labels.status}</span>
              <span className="sm:mt-1 sm:block">
                {source.lastFetchStatus === "success"
                  ? labels.success
                  : source.lastFetchStatus === "error"
                    ? labels.error
                    : labels.empty}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 sm:block">
              <span>{labels.lastFetched}</span>
              <span className="sm:mt-1 sm:block">{formatRelativeDate(source.lastFetchedAt, locale)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 sm:block">
              <span>{labels.lastSuccess}</span>
              <span className="sm:mt-1 sm:block">{formatRelativeDate(source.lastSuccessfulAt ?? null, locale)}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
