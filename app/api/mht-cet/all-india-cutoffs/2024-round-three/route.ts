import { NextRequest, NextResponse } from "next/server";
import { getPocketBase } from "@/lib/pocketbaseClient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "50");
    const sort = searchParams.get("sort") || "rank";

    // Get filter parameters
    const search = searchParams.get("search") || "";
    const branch = searchParams.get("branch") || "";
    const branches = searchParams.get("branches") || "";
    const minPercentile = searchParams.get("minPercentile") || "";
    const maxPercentile = searchParams.get("maxPercentile") || "";
    const minRank = searchParams.get("minRank") || "";
    const maxRank = searchParams.get("maxRank") || "";
    const collegeName = searchParams.get("collegeName") || "";

    // Build filter string
    const filters = [];

    if (search) {
      filters.push(
        `(course_name ~ "${search}" || college_name ~ "${search}" || choice_code ~ "${search}")`,
      );
    }

    if (branch) {
      filters.push(`course_name ~ "${branch}"`);
    }

    if (branches) {
      // Handle multiple branches
      const branchList = branches
        .split(",")
        .map((b) => b.trim())
        .filter((b) => b);
      if (branchList.length > 0) {
        const branchFilters = branchList
          .map((b) => `course_name ~ "${b}"`)
          .join(" || ");
        filters.push(`(${branchFilters})`);
      }
    }

    if (minPercentile) {
      filters.push(`percentile >= ${parseFloat(minPercentile)}`);
    }

    if (maxPercentile) {
      filters.push(`percentile <= ${parseFloat(maxPercentile)}`);
    }

    if (minRank) {
      filters.push(`rank >= ${parseInt(minRank)}`);
    }

    if (maxRank) {
      filters.push(`rank <= ${parseInt(maxRank)}`);
    }

    if (collegeName) {
      filters.push(`college_name ~ "${collegeName}"`);
    }

    const filterString = filters.length > 0 ? filters.join(" && ") : "";

    const pb = getPocketBase();

    // Fetch records with pagination and filtering
    const result = await pb
      .collection("2024_all_india_rounds_three")
      .getList(page, perPage, {
        filter: filterString,
        sort: sort,
        fields:
          "id,sr_no,rank,percentile,choice_code,institute_code,merit_exam,type,seat_type,college_code,course_name,college_name,created,updated",
      });

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
      },
    });
  } catch (error) {
    console.error("Error fetching 2024 All India Round Three data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
