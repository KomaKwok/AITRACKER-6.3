import { subDays } from "date-fns";
import { Signal, TrendPoint, TrendSummary } from "@/lib/types";

function buildTrendPoints(signals: Signal[]) {
  const buckets = new Map<string, { count: number; companies: Set<string> }>();

  for (const signal of signals) {
    const key = signal.tags[0] || signal.company;
    const current = buckets.get(key) ?? { count: 0, companies: new Set<string>() };
    current.count += 1;
    current.companies.add(signal.company);
    buckets.set(key, current);
  }

  return [...buckets.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([label, value]): TrendPoint => ({
      label,
      count: value.count,
      summary: `${label} signals are accelerating across ${value.companies.size} company sources.`
    }));
}

export function generateTrendSummary(signals: Signal[]): TrendSummary {
  const now = new Date();
  const last7dSignals = signals.filter((signal) => new Date(signal.publishedAt) >= subDays(now, 7));
  const last30dSignals = signals.filter((signal) => new Date(signal.publishedAt) >= subDays(now, 30));

  const chinaCount = last30dSignals.filter((signal) => signal.region === "China").length;
  const globalCount = last30dSignals.filter((signal) => signal.region === "Global").length;
  const chinaFocus = chinaCount >= globalCount ? "China sources are matching or outpacing" : "Global sources are still leading";

  return {
    generatedAt: new Date().toISOString(),
    last7d: buildTrendPoints(last7dSignals),
    last30d: buildTrendPoints(last30dSignals),
    chinaVsGlobal: `${chinaFocus} the current signal flow, while China remains concentrated around official model and assistant updates and global coverage shows more API, agent, and open ecosystem activity.`
  };
}
