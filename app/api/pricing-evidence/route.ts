import { NextRequest, NextResponse } from "next/server";
import { updatePricingEvidence } from "@/lib/pricing/bocha-evidence";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-cron-token");
  if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const evidence = await updatePricingEvidence();

    return NextResponse.json({
      ok: true,
      message: "Pricing evidence updated.",
      totalCompanies: Object.keys(evidence).length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
