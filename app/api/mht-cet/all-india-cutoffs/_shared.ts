import { NextRequest, NextResponse } from "next/server";
import { getPocketBase } from "@/lib/pocketbaseClient";

type QueryConfig = {
  page: number;
  perPage: number;
  sort: string;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 50;
const MAX_PER_PAGE = 200;
const DEFAULT_SORT = "rank";

function clampPositiveInt(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseOptionalFloat(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeFilterValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n|\r/g, "")
    .trim();
}

function normalizeSort(sort: string | null): string {
  if (!sort) return DEFAULT_SORT;
  const value = sort.trim();
  if (!value) return DEFAULT_SORT;

  const columns = value.split(",").map((part) => part.trim());
  const isValid = columns.every((column) => /^-?[a-zA-Z0-9_]+$/.test(column));
  return isValid ? value : DEFAULT_SORT;
}

function parseQuery(searchParams: URLSearchParams): QueryConfig {
  return {
    page: clampPositiveInt(searchParams.get("page"), DEFAULT_PAGE, 1, 100000),
    perPage: clampPositiveInt(
      searchParams.get("perPage"),
      DEFAULT_PER_PAGE,
      1,
      MAX_PER_PAGE,
    ),
    sort: normalizeSort(searchParams.get("sort")),
  };
}

function buildFilter(searchParams: URLSearchParams): string {
  const filters: string[] = [];

  const search = searchParams.get("search") || "";
  const branch = searchParams.get("branch") || "";
  const branches = searchParams.get("branches") || "";
  const collegeName = searchParams.get("collegeName") || "";

  if (search.trim()) {
    const safeSearch = sanitizeFilterValue(search);
    filters.push(
      `(course_name ~ "${safeSearch}" || college_name ~ "${safeSearch}" || choice_code ~ "${safeSearch}")`,
    );
  }

  if (branch.trim()) {
    const safeBranch = sanitizeFilterValue(branch);
    filters.push(`course_name ~ "${safeBranch}"`);
  }

  if (branches.trim()) {
    const branchList = branches
      .split(",")
      .map((item) => sanitizeFilterValue(item))
      .filter(Boolean);

    if (branchList.length > 0) {
      const branchFilter = branchList
        .map((item) => `course_name ~ "${item}"`)
        .join(" || ");
      filters.push(`(${branchFilter})`);
    }
  }

  let minPercentile = parseOptionalFloat(searchParams.get("minPercentile"));
  let maxPercentile = parseOptionalFloat(searchParams.get("maxPercentile"));
  if (
    minPercentile !== null &&
    maxPercentile !== null &&
    minPercentile > maxPercentile
  ) {
    [minPercentile, maxPercentile] = [maxPercentile, minPercentile];
  }
  if (minPercentile !== null) {
    filters.push(`percentile >= ${minPercentile}`);
  }
  if (maxPercentile !== null) {
    filters.push(`percentile <= ${maxPercentile}`);
  }

  let minRank = parseOptionalInt(searchParams.get("minRank"));
  let maxRank = parseOptionalInt(searchParams.get("maxRank"));
  if (minRank !== null && maxRank !== null && minRank > maxRank) {
    [minRank, maxRank] = [maxRank, minRank];
  }
  if (minRank !== null) {
    filters.push(`rank >= ${minRank}`);
  }
  if (maxRank !== null) {
    filters.push(`rank <= ${maxRank}`);
  }

  if (collegeName.trim()) {
    const safeCollegeName = sanitizeFilterValue(collegeName);
    filters.push(`college_name ~ "${safeCollegeName}"`);
  }

  return filters.join(" && ");
}

export async function handleAllIndiaCutoffsRequest(
  request: NextRequest,
  collectionName: string,
  roundLabel: string,
) {
  const { searchParams } = new URL(request.url);
  const { page, perPage, sort } = parseQuery(searchParams);
  const filter = buildFilter(searchParams);

  try {
    const pb = getPocketBase();
    const result = await pb.collection(collectionName).getList(page, perPage, {
      filter,
      sort,
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
    console.error(`Error fetching 2024 All India ${roundLabel} data:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch data from the server.",
        details: errorMessage,
        data: [],
        pagination: {
          page: DEFAULT_PAGE,
          perPage: DEFAULT_PER_PAGE,
          totalPages: 0,
          totalItems: 0,
        },
      },
      { status: 500 },
    );
  }
}
