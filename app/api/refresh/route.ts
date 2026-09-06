import { after, NextRequest, NextResponse } from "next/server";
import { refreshJob } from "@/lib/radar/refresh-job";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(refreshJob.status(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const job = refreshJob.start(request.nextUrl.searchParams.get("mode") === "auto");
  after(() => job);
  return NextResponse.json(refreshJob.status(), {
    status: refreshJob.status().state === "running" ? 202 : 200,
    headers: { "Cache-Control": "no-store" }
  });
}
