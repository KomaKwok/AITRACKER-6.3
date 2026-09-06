"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RefreshStatus } from "@/lib/radar/refresh-job";

const RefreshContext = createContext<{ busy: boolean; ready: boolean; refresh: () => void } | null>(null);
export function useFeedRefresh() {
  const context = useContext(RefreshContext);
  if (!context) throw new Error("Missing refresh controller");
  return context;
}

export function RefreshController({ children, locale }: { children: React.ReactNode; locale: "zh" | "en" }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RefreshStatus | null>(null);
  const active = useRef<AbortController | null>(null);
  const zh = locale === "zh";

  const refresh = useCallback(async (automatic = false) => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setRunning(true);
    setResult(null);
    const request = async (method: "GET" | "POST") => {
      const response = await fetch(`/api/refresh${automatic ? "?mode=auto" : ""}`, {
        method, cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)])
      });
      if (!response.ok) throw new Error("Refresh request failed");
      return await response.json() as RefreshStatus;
    };
    try {
      let status = await request("POST");
      const deadline = Date.now() + 4 * 60000;
      while (status.state === "running") {
        if (Date.now() > deadline) throw new Error("Refresh is taking too long");
        await new Promise<void>((resolve, reject) => {
          const abort = () => { clearTimeout(timer); reject(new Error("Aborted")); };
          const timer = setTimeout(() => { controller.signal.removeEventListener("abort", abort); resolve(); }, 2000);
          controller.signal.addEventListener("abort", abort, { once: true });
        });
        status = await request("GET");
      }
      setResult(status);
      startTransition(() => { router.refresh(); setReady(true); });
    } catch {
      if (!controller.signal.aborted) {
        setResult({ state: "error" });
        startTransition(() => { router.refresh(); setReady(true); });
      }
    } finally {
      if (active.current === controller) active.current = null;
      if (!controller.signal.aborted) setRunning(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) void refresh(true); });
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(true); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      active.current?.abort();
      active.current = null;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const busy = running || pending;
  const report = result?.report;
  const message = busy || !ready
    ? zh ? "正在检查并更新来源，完成后会自动显示，请稍候…" : "Checking sources. Results will appear automatically…"
    : result?.state === "error"
      ? zh ? "本次未能取得最新资讯，以下为历史数据或初始快照；请查看日期，可点击更新资讯重试。" : "Latest updates unavailable. Showing historical data or the bundled snapshot; check dates and retry."
      : `${zh ? `本轮新增 ${report?.newSignals ?? 0} 条，内容变化 ${report?.changedSignals ?? 0} 条。` : `${report?.newSignals ?? 0} new items, ${report?.changedSignals ?? 0} changed items.`}${result?.state === "partial" ? zh ? " 部分来源未返回内容或价格核验失败，相关数据保留上次结果。" : " Some sources or pricing checks failed or returned no items; previous results were retained." : ""}${!report?.newSignals && !report?.changedSignals ? zh ? " 暂无新内容。" : " No new content." : ""}`;

  return <RefreshContext.Provider value={{ busy, ready: ready && !pending, refresh: () => void refresh() }}>
    <div role="status" aria-live="polite" className="mx-auto mb-4 max-w-7xl rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm text-slate-600">{message}</div>
    {children}
  </RefreshContext.Provider>;
}

export function FreshDataGate({ children }: { children: React.ReactNode }) {
  const { ready } = useFeedRefresh();
  return ready ? children : <div aria-busy="true" className="panel min-h-48 animate-pulse bg-slate-100" />;
}
