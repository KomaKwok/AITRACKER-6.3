import { Signal, Source } from "@/lib/types";

export const PRODUCT_HISTORY_DAYS = 180;
export const MAX_SIGNALS_PER_PRODUCT_SOURCE = 40;
export const MIN_RETAINED_SIGNALS_PER_SOURCE = 6;
export const PAPER_BATCH_SIZE = 10;

function uniqueSignals(signals: Signal[]) {
  const seen = new Set<string>();
  return signals.filter((signal) => {
    const key = signal.dedupeHash || signal.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function newestFirst(a: Signal, b: Signal) {
  return +new Date(b.publishedAt) - +new Date(a.publishedAt);
}

export function mergeSourceHistory(input: {
  existingSignals: Signal[];
  freshSignals: Signal[];
  source: Source;
  now?: Date;
}) {
  const existingForSource = input.existingSignals.filter((signal) => signal.sourceId === input.source.id);
  const merged = uniqueSignals([...input.freshSignals, ...existingForSource]);
  if (input.source.sourceType === "Research") {
    if (!input.freshSignals.length) {
      return existingForSource
        .sort((a, b) => (a.sourceRank ?? 99) - (b.sourceRank ?? 99) || newestFirst(a, b))
        .slice(0, PAPER_BATCH_SIZE);
    }
    const freshBatch = uniqueSignals(input.freshSignals).sort(
      (a, b) => (a.sourceRank ?? 99) - (b.sourceRank ?? 99)
    );
    return uniqueSignals([...freshBatch, ...existingForSource.sort(newestFirst)]).slice(0, PAPER_BATCH_SIZE);
  }

  const cutoff = (input.now ?? new Date()).getTime() - PRODUCT_HISTORY_DAYS * 24 * 60 * 60 * 1000;
  const newest = merged.sort(newestFirst);
  const inWindow = newest
    .filter((signal) => +new Date(signal.publishedAt) >= cutoff)
    .slice(0, MAX_SIGNALS_PER_PRODUCT_SOURCE);
  return uniqueSignals([...inWindow, ...newest.slice(0, MIN_RETAINED_SIGNALS_PER_SOURCE)]).slice(
    0,
    MAX_SIGNALS_PER_PRODUCT_SOURCE
  );
}
