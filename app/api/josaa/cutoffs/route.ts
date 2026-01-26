import { NextRequest, NextResponse } from "next/server";
import { getCutoffs } from "@/lib/josaa-client";
import {
  JosaaFilters,
  InstituteType,
  CategoryType,
  GenderType,
  SeatType,
} from "@/lib/types/josaa";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: JosaaFilters = {};

    const instituteType = searchParams.get("instituteType");
    if (
      instituteType &&
      ["IIT", "NIT", "IIIT", "GFTI", "CFTI"].includes(instituteType)
    ) {
      filters.instituteType = instituteType as InstituteType;
    }

    const instituteId = searchParams.get("instituteId");
    if (instituteId) filters.instituteId = instituteId;

    const branchId = searchParams.get("branchId");
    if (branchId) filters.branchId = branchId;

    const year = searchParams.get("year");
    if (year) filters.year = parseInt(year);

    const round = searchParams.get("round");
    if (round) filters.round = parseInt(round);

    const category = searchParams.get("category");
    if (category) filters.category = category as CategoryType;

    const gender = searchParams.get("gender");
    if (gender) filters.gender = gender as GenderType;

    const seatType = searchParams.get("seatType");
    if (seatType) filters.seatType = seatType as SeatType;

    const minRank = searchParams.get("minRank");
    if (minRank) filters.minRank = parseInt(minRank);

    const maxRank = searchParams.get("maxRank");
    if (maxRank) filters.maxRank = parseInt(maxRank);

    // Pagination - allow higher limit for internal requests (e.g., from components)
    // External API calls still capped at 100 for safety
    const page = parseInt(searchParams.get("page") || "1");
    const requestedPerPage = parseInt(searchParams.get("perPage") || "50");
    // Allow up to 1000 for internal year-change fetches, cap external at 100
    const perPage = Math.min(requestedPerPage, 1000);
    const expand = searchParams.get("expand") !== "false";

    const result = await getCutoffs(filters, { page, perPage, expand });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Error fetching cutoffs:", error);
    return NextResponse.json(
      { error: "Failed to fetch cutoffs" },
      { status: 500 },
    );
  }
}
