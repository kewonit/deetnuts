import { NextResponse } from "next/server";
import { getTimekeeperPublicConfig } from "@/lib/timekeeper/runtime";

export const dynamic = "force-dynamic";
export function GET() {
  try {
    // Only this explicitly public pair is returned. It belongs to the existing
    // study-map project, not Deetnuts' account or college-data backend.
    return NextResponse.json(getTimekeeperPublicConfig(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The study map is temporarily unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
