import { EmptyState } from "@/components/empty-state";
import { DashboardBriefCard } from "@/components/dashboard-brief";
import { PriceBoard } from "@/components/price-board";
import { PaperDigest } from "@/components/paper-digest";
import { SectionHeader } from "@/components/section-header";
import { SignalCard } from "@/components/signal-card";
import { getPricingEntries } from "@/lib/data/pricing-evidence";
import { getDictionary } from "@/lib/i18n";
import { selectDashboardSections } from "@/lib/radar/dashboard";
import { getDashboardData } from "@/lib/radar/repository";
import { formatDashboardTime, formatRelativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DashboardPage() {
  const { locale, t } = await getDictionary();
  const data = await getDashboardData();
  const priceEntries = await getPricingEntries();
  const { recentSignals, radarSignals, paperSignals } = selectDashboardSections(data.signals);

  return (
    <div className="space-y-8">
      <section>
        <div className="panel overflow-hidden p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="eyebrow">{t.dashboard.eyebrow}</div>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-ink">{t.dashboard.heroTitle}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{t.dashboard.heroDescription}</p>
            </div>
            <div className="shrink-0 rounded-[1.9rem] border border-slate-200/70 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_38%),linear-gradient(180deg,#f9fbff_0%,#eef4fb_100%)] p-3 shadow-sm xl:min-w-[260px]">
              <div className="rounded-[1.5rem] bg-white/92 p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t.dashboard.lastUpdated}</div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {locale === "zh" ? "最近成功抓取" : "Last successful fetch"}
                  </span>
                </div>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div className="text-3xl font-semibold tracking-tight text-ink">
                    {formatDashboardTime(data.lastUpdatedAt, locale)}
                  </div>
                  <div className="text-sm text-slate-500">{formatRelativeDate(data.lastUpdatedAt, locale)}</div>
                </div>
              </div>
            </div>
          </div>
          <DashboardBriefCard brief={data.brief} locale={locale} signals={data.signals} />
          <PriceBoard entries={priceEntries} locale={locale} />
        </div>
      </section>

      <section>
        <SectionHeader title={t.dashboard.paperTitle} description={t.dashboard.paperDescription} />
        <PaperDigest papers={paperSignals} locale={locale} />
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <div>
          <SectionHeader title={t.dashboard.todayWeekTitle} />
          <div className="space-y-4">
            {recentSignals.length ? (
              recentSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} labels={t.common} locale={locale} />
              ))
            ) : (
              <EmptyState
                title={locale === "zh" ? "暂无近期动态" : "No recent updates"}
                description={
                  locale === "zh"
                    ? "当前还没有可用于回补的可信信号。刷新不会再清空上一轮成功抓到的内容。"
                    : "There are no retained verified signals yet. Refreshing no longer clears the last successful results."
                }
              />
            )}
          </div>
        </div>
        <div className="space-y-8">
          <div>
            <SectionHeader title={t.dashboard.radarTitle} />
            <div className="space-y-4">
              {radarSignals.length ? (
                radarSignals.map((signal) => <SignalCard key={signal.id} signal={signal} labels={t.common} locale={locale} />)
              ) : (
                <EmptyState
                  title={locale === "zh" ? "暂无一手雷达信号" : "No first-hand radar signals yet"}
                  description={
                    locale === "zh"
                      ? "系统现在只显示真实抓到的数据。由于大部分官方适配器还没实现，这里可能暂时为空。"
                      : "The app now shows only verified fetched data. Because most official adapters are not implemented yet, this section may be empty for now."
                  }
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
