import { NextResponse } from "next/server";
import { refreshRadarDataWithOptions } from "@/lib/radar/fetchers";

export async function POST() {
  try {
    const store = await refreshRadarDataWithOptions();

    return NextResponse.json({
      ok: true,
      message: `Refresh complete. ${store.signals.length} signals in store.`,
      lastUpdatedAt: store.lastUpdatedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown refresh error";
    return NextResponse.json(
      {
        ok: false,
        message: `Refresh failed: ${message}`
      },
      { status: 500 }
    );
  }
}
