import { NextRequest, NextResponse } from "next/server";
import {
  getInstitutes,
  getInstitutesByType,
  searchJosaa,
} from "@/lib/josaa-client";
import { InstituteType } from "@/lib/types/josaa";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const state = searchParams.get("state");
    const query = searchParams.get("q");
    const grouped = searchParams.get("grouped") === "true";

    // If search query provided, use search function
    if (query) {
      const results = await searchJosaa(query, 20);
      return NextResponse.json(results, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      });
    }

    // If grouped flag, return institutes grouped by type
    if (grouped) {
      const result = await getInstitutesByType();
      return NextResponse.json(result, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      });
    }

    // Regular list with optional filters
    const result = await getInstitutes({
      type:
        type && ["IIT", "NIT", "IIIT", "GFTI", "CFTI"].includes(type)
          ? (type as InstituteType)
          : undefined,
      state: state || undefined,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Error fetching institutes:", error);
    return NextResponse.json(
      { error: "Failed to fetch institutes" },
      { status: 500 },
    );
  }
}
