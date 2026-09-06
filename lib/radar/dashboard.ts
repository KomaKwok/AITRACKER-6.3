import { Signal } from "@/lib/types";
import { hasReliableRecency } from "@/lib/utils";

export const DASHBOARD_NEWS_TARGET = 6;
export const DASHBOARD_PAPER_TARGET = 10;
export const RECENT_PRIMARY_DAYS = 7;
export const RECENT_BACKFILL_DAYS = 180;
export const RADAR_PRIMARY_DAYS = 30;
export const RADAR_BACKFILL_DAYS = 90;

function uniqueSignals(signals: Signal[]) {
  return signals.filter((signal, index, list) => list.findIndex((candidate) => candidate.id === signal.id) === index);
}

function uniquePapers(signals: Signal[]) {
  const seen = new Set<string>();
  return signals.filter((signal) => {
    const key =
      signal.externalId ?? signal.title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ageInDays(signal: Signal, now: Date) {
  return (now.getTime() - +new Date(signal.publishedAt)) / (24 * 60 * 60 * 1000);
}

function withinWindow(signal: Signal, days: number, now: Date) {
  const age = ageInDays(signal, now);
  return age >= -1 && age <= days;
}

function selectDiverseSignals(signals: Signal[], limit: number, maxPerSource: number) {
  const selected: Signal[] = [];
  const sourceCounts = new Map<string, number>();

  for (const signal of signals) {
    const count = sourceCounts.get(signal.sourceId) ?? 0;
    if (count >= maxPerSource) continue;
    selected.push(signal);
    sourceCounts.set(signal.sourceId, count + 1);
    if (selected.length >= limit) return selected;
  }

  for (const signal of signals) {
    if (selected.some((candidate) => candidate.id === signal.id)) continue;
    selected.push(signal);
    if (selected.length >= limit) return selected;
  }

  return selected;
}

export function selectDashboardSections(signals: Signal[], now = new Date()) {
  const productSignals = signals.filter(
    (signal) => signal.category !== "Paper" && hasReliableRecency(signal.sourceId)
  );
  const newestFirst = [...productSignals].sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)
  );

  const recentCandidates = uniqueSignals([
    ...newestFirst.filter((signal) => withinWindow(signal, RECENT_PRIMARY_DAYS, now)),
    ...newestFirst.filter((signal) => withinWindow(signal, RECENT_BACKFILL_DAYS, now))
  ]);
  const recentSignals = selectDiverseSignals(recentCandidates, DASHBOARD_NEWS_TARGET, 2);

  const priorityScore = (signal: Signal) => signal.signalScore;
  const byPriority = (a: Signal, b: Signal) =>
    +new Date(b.publishedAt) - +new Date(a.publishedAt) || priorityScore(b) - priorityScore(a);
  const radarCandidates = uniqueSignals([
    ...productSignals.filter((signal) => withinWindow(signal, RADAR_PRIMARY_DAYS, now)).sort(byPriority),
    ...productSignals.filter((signal) => withinWindow(signal, RADAR_BACKFILL_DAYS, now)).sort(byPriority)
  ]);
  const radarSignals = selectDiverseSignals(radarCandidates, DASHBOARD_NEWS_TARGET, 1);

  const paperSignals = uniquePapers(
    signals
      .filter((signal) => signal.category === "Paper")
      .sort(
        (a, b) =>
          (a.sourceRank ?? 99) - (b.sourceRank ?? 99) || +new Date(b.publishedAt) - +new Date(a.publishedAt)
      )
  )
    .slice(0, DASHBOARD_PAPER_TARGET);

  return { recentSignals, radarSignals, paperSignals };
}
