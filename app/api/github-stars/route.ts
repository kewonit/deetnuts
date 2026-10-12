import { NextResponse } from "next/server";

import { formatStarCount, getGitHubStarCount } from "@/lib/github-stars";

// Counts are cached in memory by lib/github-stars, so this stays dynamic and
// never calls GitHub during the build.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHED = "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400";
const RETRY = "public, max-age=300, s-maxage=300";

export async function GET() {
  const stars = await getGitHubStarCount();
  return NextResponse.json(
    { stars, label: formatStarCount(stars) },
    { headers: { "Cache-Control": stars === null ? RETRY : CACHED } },
  );
}
