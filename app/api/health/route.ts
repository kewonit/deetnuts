import { NextResponse } from "next/server";

import { getDeploymentSha } from "@/lib/deployment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      sha: getDeploymentSha(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
