import type { DashboardBrief, Signal } from "@/lib/types";
import { hasReliableRecency } from "@/lib/utils";

export function selectBriefSignals(signals: Signal[], now = Date.now()) {
  const recent = signals.filter((signal) => {
    const age = now - Date.parse(signal.publishedAt);
    return age >= -86400000 && age <= 30 * 86400000 && hasReliableRecency(signal.sourceId);
  }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || b.signalScore - a.signalScore);
  const selected: Signal[] = [];
  const counts = new Map<string, number>();
  for (const signal of recent.filter((item) => item.category !== "Paper")) {
    const count = counts.get(signal.company) ?? 0;
    if (count >= 2) continue;
    counts.set(signal.company, count + 1);
    selected.push(signal);
    if (selected.length === 6) break;
  }
  return [...selected, ...recent.filter((item) => item.category === "Paper").slice(0, 2)];
}

export function buildFallbackBrief(signals: Signal[]): DashboardBrief {
  const selected = selectBriefSignals(signals);
  const lead = selected[0];
  const bullets = selected.slice(0, 3);
  return {
    headline: lead?.title ?? "No dated updates in the past 30 days",
    headlineZh: lead ? lead.titleZh || lead.title : "近 30 天暂无可核实日期的新动态",
    summary: lead ? `${lead.publishedAt.slice(0, 10)} · ${lead.sourceName}: ${lead.summary}`
      : "No recent source evidence is available. Earlier items remain in the feed with their original dates.",
    summaryZh: lead ? `${lead.publishedAt.slice(0, 10)} · ${lead.sourceName}：${lead.summary}`
      : "目前没有近期来源证据。历史内容保留在信号流中，并显示原始发布日期。",
    bullets: bullets.map((item) => `${item.publishedAt.slice(0, 10)} · ${item.title}`),
    bulletsZh: bullets.map((item) => `${item.publishedAt.slice(0, 10)} · ${item.titleZh || item.title}`),
    generatedAt: new Date().toISOString(),
    sourceSignalIds: selected.map((item) => item.id)
  };
}

export function isBriefCurrent(brief: DashboardBrief | undefined, signals: Signal[]) {
  if (!brief) return false;
  const selected = selectBriefSignals(signals);
  return brief.sourceSignalIds.length === selected.length &&
    brief.sourceSignalIds.every((id, index) => id === selected[index].id);
}
