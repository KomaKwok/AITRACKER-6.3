import { cn, scoreToTone } from "@/lib/utils";

export function RegionBadge({ region }: { region: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        region === "China" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"
      )}
    >
      {region}
    </span>
  );
}

export function SourceBadge({ sourceType }: { sourceType: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      {sourceType}
    </span>
  );
}

export function SignalBadge({
  score,
  labels
}: {
  score: number;
  labels: { top: string; strong: string; watch: string };
}) {
  const label = score >= 85 ? labels.top : score >= 70 ? labels.strong : labels.watch;
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
      {label}
    </span>
  );
}

export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
        <div className={cn("h-full rounded-full", scoreToTone(score))} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600">{score}</span>
    </div>
  );
}
