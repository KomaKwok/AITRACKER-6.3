import { NextRequest, NextResponse } from "next/server";
import { refreshPricingSnapshot } from "@/lib/pricing/refresh";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-cron-token");
  if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await refreshPricingSnapshot();

    return NextResponse.json({
      ok: true,
      message: "Flagship pricing refreshed from official pages.",
      totalCompanies: snapshot.entries.length,
      verifiedCompanies: snapshot.verifiedCount
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
