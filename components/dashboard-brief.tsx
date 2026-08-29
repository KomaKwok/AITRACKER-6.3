import { Sparkles } from "lucide-react";
import { DashboardBrief } from "@/lib/types";
import { formatRelativeDate } from "@/lib/utils";

export function DashboardBriefCard({ brief, locale }: { brief?: DashboardBrief; locale: "zh" | "en" }) {
  const headline =
    (locale === "zh" ? brief?.headlineZh : brief?.headline) ??
    (locale === "zh" ? "近期 AI 动态等待刷新总结" : "Recent AI activity is waiting for a refresh");
  const summary =
    (locale === "zh" ? brief?.summaryZh : brief?.summary) ??
    (locale === "zh"
      ? "刷新后，系统会根据近期抓到的官方动态与论文生成一段可直接阅读的事实摘要。"
      : "After a refresh, the system summarizes recent verified product updates and papers into a factual brief.");
  const bullets = locale === "zh" ? brief?.bulletsZh : brief?.bullets;

  return (
    <div className="mt-6 overflow-hidden rounded-[1.9rem] border border-violet-200/70 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_38%),linear-gradient(135deg,#faf7ff_0%,#f3f7ff_100%)] p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI BRIEF
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{headline}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">{summary}</p>
        </div>
        {brief?.generatedAt ? (
          <span className="shrink-0 text-xs text-slate-500">
            {locale === "zh" ? "生成于" : "Generated"} {formatRelativeDate(brief.generatedAt, locale)}
          </span>
        ) : null}
      </div>
      {bullets?.length ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {bullets.slice(0, 3).map((bullet, index) => (
            <div key={`${index}-${bullet}`} className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-sm leading-6 text-slate-700">
              <span className="mr-2 font-semibold text-violet-600">0{index + 1}</span>
              {bullet}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
