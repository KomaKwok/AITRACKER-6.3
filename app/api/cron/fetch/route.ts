import { NextRequest, NextResponse } from "next/server";
import { refreshRadarData } from "@/lib/radar/fetchers";

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-cron-token");
  if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const store = await refreshRadarData();
  return NextResponse.json({
    ok: true,
    message: "Scheduled fetch completed.",
    totalSignals: store.signals.length,
    lastUpdatedAt: store.lastUpdatedAt
  });
}
