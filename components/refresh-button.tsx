"use client";

import { useFeedRefresh } from "@/components/refresh-controller";
import { RefreshCcw } from "lucide-react";

export function RefreshButton({
  labels,
  showMessage = true,
  align = "end"
}: {
  labels: { button: string; loading: string; done: string; failed: string; waiting: string };
  showMessage?: boolean;
  align?: "start" | "end";
}) {
  const { busy, refresh } = useFeedRefresh();

  return (
    <div className={`flex flex-col items-start gap-2 ${align === "end" ? "sm:items-end" : "sm:items-start"}`}>
      <button
        type="button"
        onClick={refresh}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <RefreshCcw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
        {busy ? labels.loading : labels.button}
      </button>
      {showMessage && busy ? <p className="text-xs text-slate-500">{labels.waiting}</p> : null}
    </div>
  );
}
