import { refreshRadarDataWithOptions } from "@/lib/radar/fetchers";
import { refreshPricingSnapshot } from "@/lib/pricing/refresh";
import type { RadarStore } from "@/lib/types";

export interface RefreshStatus {
  state: "idle" | "running" | "success" | "partial" | "error";
  completedAt?: string;
  report?: RadarStore["refreshReport"];
  pricingFailed?: boolean;
}

// Shared by browser refreshes and scheduled requests. Every new process checks sources.
export function createRefreshCoordinator(run: () => Promise<Omit<RefreshStatus, "completedAt">>, now = Date.now) {
  let status: RefreshStatus = { state: "idle" };
  let job: Promise<void> | undefined;
  let lastAttempt = 0;
  return {
    status: () => status,
    start(automatic = false) {
      if (job) return job;
      const cooldown = status.state === "error" ? 60000 : 10 * 60000;
      if (automatic && status.state !== "idle" && now() - lastAttempt < cooldown) return Promise.resolve();
      lastAttempt = now();
      status = { state: "running" };
      job = Promise.resolve().then(run).then((result) => {
        status = { ...result, completedAt: new Date(now()).toISOString() };
      }).catch((error) => {
        console.error("[refresh] Job failed", error);
        status = { state: "error", completedAt: new Date(now()).toISOString() };
      }).finally(() => { job = undefined; });
      return job;
    }
  };
}

async function runRefresh(): Promise<RefreshStatus> {
  const [radar, pricing] = await Promise.allSettled([
    refreshRadarDataWithOptions(), refreshPricingSnapshot()
  ]);
  if (radar.status === "rejected") throw radar.reason;
  const report = radar.value.refreshReport;
  const pricingFailed = pricing.status === "rejected" || pricing.value.verifiedCount < pricing.value.entries.length;
  return {
    state: !report?.successfulSources ? "error" : report.failedSources || report.emptySources || pricingFailed ? "partial" : "success",
    report, pricingFailed
  };
}

const globalJobs = globalThis as typeof globalThis & { radarRefreshJob?: ReturnType<typeof createRefreshCoordinator> };
export const refreshJob = globalJobs.radarRefreshJob ??= createRefreshCoordinator(runRefresh);
