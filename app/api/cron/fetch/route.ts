import { NextRequest, NextResponse } from "next/server";
import { refreshJob } from "@/lib/radar/refresh-job";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = request.headers.get("x-cron-token") ?? authorization?.replace(/^Bearer\s+/i, "");
  if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  await refreshJob.start();
  const status = refreshJob.status();
  return NextResponse.json({ ...status, ok: status.state !== "error" });
}
