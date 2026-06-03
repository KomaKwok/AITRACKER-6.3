"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onRefresh() {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    setMessage(null);
    try {
      const response = await fetch("/api/refresh", {
        method: "POST"
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      setMessage(payload.message || (payload.ok ? labels.done : labels.failed));
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setMessage(labels.failed);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className={`flex flex-col items-start gap-2 ${align === "end" ? "sm:items-end" : "sm:items-start"}`}>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing || isPending}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <RefreshCcw className={`h-4 w-4 ${isRefreshing || isPending ? "animate-spin" : ""}`} />
        {isRefreshing ? labels.loading : labels.button}
      </button>
      {showMessage && isRefreshing ? <p className="text-xs text-slate-500">{labels.waiting}</p> : null}
      {showMessage && message ? <p className="text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}
