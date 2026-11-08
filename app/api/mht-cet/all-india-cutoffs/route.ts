import { NextRequest, NextResponse } from "next/server";
import { resolveAllIndiaSelection } from "@/lib/mht-cet/all-india/config";
import {
  ALL_INDIA_PER_PAGE,
  isAllIndiaUnavailable,
  queryAllIndiaCutoffs,
} from "@/lib/mht-cet/all-india/query";

// Published cutoffs only change on a data import, so identical queries are
// served from the edge and browser caches.
const CACHE_CONTROL = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const selection = resolveAllIndiaSelection(params.get("year"), params.get("round"));
  try {
    const result = await queryAllIndiaCutoffs(selection.collection, params);
    return NextResponse.json(
      { success: true, year: selection.year, round: selection.round, ...result },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch (error) {
    console.error(`All India cutoffs ${selection.year} round ${selection.round} failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: isAllIndiaUnavailable(error)
          ? "MHT-CET all-India cutoffs are unavailable"
          : "Failed to fetch data from the server.",
        data: [],
        pagination: { page: 1, perPage: ALL_INDIA_PER_PAGE, totalPages: 0, totalItems: 0 },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
