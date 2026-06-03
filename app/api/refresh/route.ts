import { NextResponse } from "next/server";
import { refreshRadarDataWithOptions } from "@/lib/radar/fetchers";

let refreshInProgress = false;

export async function POST() {
  if (refreshInProgress) {
    return NextResponse.json({
      ok: true,
      message: "Refresh is already running in the background."
    });
  }

  refreshInProgress = true;
  refreshRadarDataWithOptions()
    .catch((error) => {
      console.error("[refresh] background refresh failed", error);
    })
    .finally(() => {
      refreshInProgress = false;
    });

  return NextResponse.json({
    ok: true,
    message: "Refresh started. New data will appear after the background job finishes."
  });
}
