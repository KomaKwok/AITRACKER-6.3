import { EmptyState } from "@/components/empty-state";
import { PriceBoard } from "@/components/price-board";
import { SectionHeader } from "@/components/section-header";
import { SignalCard } from "@/components/signal-card";
import { withPricingEvidence } from "@/lib/data/pricing-evidence";
import { pricingSnapshot } from "@/lib/data/pricing-snapshot";
import { getDictionary } from "@/lib/i18n";
import { getDashboardData, splitByRegion } from "@/lib/radar/repository";
import { formatDashboardTime, formatRelativeDate, hasReliableRecency, withinDays } from "@/lib/utils";

export default async function DashboardPage() {
  const { locale, t } = await getDictionary();
  const data = await getDashboardData();
  const priceEntries = await withPricingEvidence(pricingSnapshot);
  const todaySignals = data.signals
    .filter((signal) => hasReliableRecency(signal.sourceId) && withinDays(signal.publishedAt, 1))
    .slice(0, 4);
  const weekSignals = data.signals
    .filter((signal) => hasReliableRecency(signal.sourceId) && withinDays(signal.publishedAt, 7))
    .slice(0, 6);
  const topSignals = [...data.signals].sort((a, b) => b.signalScore - a.signalScore).slice(0, 4);
  const regional = splitByRegion(data.signals);

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
                    Live
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
          <PriceBoard entries={priceEntries} locale={locale} />
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <div>
          <SectionHeader title={t.dashboard.todayWeekTitle} description={t.dashboard.todayWeekDescription} />
          <div className="space-y-4">
            {[...todaySignals, ...weekSignals].slice(0, 6).length ? (
              [...todaySignals, ...weekSignals].slice(0, 6).map((signal) => (
                <SignalCard key={signal.id} signal={signal} labels={t.common} locale={locale} />
              ))
            ) : (
              <EmptyState
                title={locale === "zh" ? "暂无今日或本周信号" : "No signals for today or this week"}
                description={
                  locale === "zh"
                    ? "当前还没有抓到最近 7 天内的可信信号。你可以手动刷新，或继续补充更多官方源适配器。"
                    : "There are no verified signals from the last 7 days yet. You can refresh manually or add more official source adapters."
                }
              />
            )}
          </div>
        </div>
        <div className="space-y-8">
          <div>
            <SectionHeader title={t.dashboard.radarTitle} description={t.dashboard.radarDescription} />
            <div className="space-y-4">
              {topSignals.length ? (
                topSignals.map((signal) => <SignalCard key={signal.id} signal={signal} labels={t.common} locale={locale} />)
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
          <div className="panel p-6">
            <SectionHeader title={t.dashboard.trendTitle} description={t.dashboard.trendDescription} />
            {data.trendSummary.last7d.length || data.trendSummary.last30d.length ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t.dashboard.last7d}</h3>
                  <div className="mt-4 space-y-4">
                    {data.trendSummary.last7d.map((trend) => (
                      <div key={trend.label} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-ink">{trend.label}</div>
                          <div className="text-sm text-slate-500">{trend.count} signals</div>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{trend.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t.dashboard.last30d}</h3>
                  <div className="mt-4 space-y-4">
                    {data.trendSummary.last30d.map((trend) => (
                      <div key={trend.label} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-ink">{trend.label}</div>
                          <div className="text-sm text-slate-500">{trend.count} signals</div>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{trend.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title={locale === "zh" ? "暂无趋势可总结" : "No trends to summarize yet"}
                description={
                  locale === "zh"
                    ? "趋势总结依赖最近抓到的可信信号。当前数据不足，所以这里保持为空。"
                    : "Trend summaries depend on recently fetched verified signals. There is not enough live data yet, so this section stays empty."
                }
              />
            )}
          </div>
          <div className="panel p-6">
            <SectionHeader title={t.dashboard.chinaVsGlobalTitle} description={t.dashboard.chinaVsGlobalDescription} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-sky-50 p-4">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">{t.dashboard.global}</div>
                <div className="mt-2 text-3xl font-semibold text-ink">{regional.global.length}</div>
                <p className="mt-2 text-sm text-slate-600">{t.dashboard.globalDescription}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">{t.dashboard.china}</div>
                <div className="mt-2 text-3xl font-semibold text-ink">{regional.china.length}</div>
                <p className="mt-2 text-sm text-slate-600">{t.dashboard.chinaDescription}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{data.trendSummary.chinaVsGlobal}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
