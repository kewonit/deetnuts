import { NextRequest, NextResponse } from "next/server";
import { getCutoffTrends } from "@/lib/josaa-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const instituteId = searchParams.get("instituteId");
    const branchId = searchParams.get("branchId");
    const category = searchParams.get("category") || undefined;
    const gender = searchParams.get("gender") || undefined;

    if (!instituteId || !branchId) {
      return NextResponse.json(
        { error: "Missing required parameters: instituteId and branchId" },
        { status: 400 },
      );
    }

    const trends = await getCutoffTrends(
      instituteId,
      branchId,
      category,
      gender,
    );

    return NextResponse.json(trends, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Error fetching trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch trends data" },
      { status: 500 },
    );
  }
}
