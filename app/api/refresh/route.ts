import { NextResponse } from "next/server";
import { refreshRadarDataWithOptions } from "@/lib/radar/fetchers";
import { refreshPricingSnapshot } from "@/lib/pricing/refresh";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let refreshInProgress = false;

export async function POST() {
  if (refreshInProgress) {
    return NextResponse.json(
      {
        ok: false,
        message: "Refresh is already running. Please wait for the current fetch to finish."
      },
      { status: 409 }
    );
  }

  refreshInProgress = true;

  try {
    const [store, pricing] = await Promise.all([refreshRadarDataWithOptions(), refreshPricingSnapshot()]);
    return NextResponse.json({
      ok: true,
      message: "Refresh completed.",
      totalSignals: store.signals.length,
      pricingVerified: pricing.verifiedCount,
      lastUpdatedAt: store.lastUpdatedAt
    });
  } catch (error) {
    console.error("[refresh] refresh failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Refresh failed."
      },
      { status: 500 }
    );
  } finally {
    refreshInProgress = false;
  }
}
