import { NextRequest, NextResponse } from "next/server";
import { ensureUserAuthenticated } from "@/lib/pocketbase/user-auth";
import { getPocketBase } from "@/lib/pocketbaseClient";
import {
  getCollectionForRound,
  isRoundAvailableForYear,
  isSupportedYear,
  DEFAULT_ROUND,
  DEFAULT_YEAR,
  getDisplayNameForRound,
} from "@/app/mht-cet/state-cutoffs/constants";
import {
  buildStateCutoffSearchFilter,
  escapeFilterValue,
} from "@/app/mht-cet/state-cutoffs/search-filter";
import type { CutoffRecord } from "@/app/mht-cet/state-cutoffs/types";

const MAX_EXPORT_FILTER_VALUES = 40;
const MAX_FILTER_VALUE_LENGTH = 240;
const RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

const invalidRequest = (message: string) =>
  NextResponse.json(
    { success: false, error: "Invalid request", message },
    { status: 400, headers: RESPONSE_HEADERS },
  );

const escapeCsvText = (value: unknown): string => {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
};

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Parse query parameters for filtering
    const search = (searchParams.get("search") || "").trim();
    const categories = searchParams.getAll("categories");
    const courses = searchParams.getAll("courses");
    const statuses = searchParams.getAll("statuses");
    const homeUniversities = searchParams.getAll("homeUniversities");
    const percentileInput = searchParams.get("percentileInput") || "";
    const roundParam = searchParams.get("round");
    const yearParam = searchParams.get("year");

    const allFilterValues = [
      ...categories,
      ...courses,
      ...statuses,
      ...homeUniversities,
    ];
    if (search.length > 200) {
      return invalidRequest("Search text is too long.");
    }
    if (
      allFilterValues.length > MAX_EXPORT_FILTER_VALUES ||
      allFilterValues.some(
        (value) =>
          value.trim().length === 0 ||
          value.length > MAX_FILTER_VALUE_LENGTH,
      )
    ) {
      return invalidRequest("Export filters are missing or too large.");
    }
    if (percentileInput) {
      const percentile = Number(percentileInput);
      if (!Number.isFinite(percentile) || percentile < 0 || percentile > 100) {
        return invalidRequest("Percentile must be between 0 and 100.");
      }
    }

    // Validate and sanitize round parameter
    const year = yearParam === null ? DEFAULT_YEAR : Number(yearParam);
    if (!Number.isInteger(year) || !isSupportedYear(year)) {
      return invalidRequest("The requested cutoff year is unavailable.");
    }
    const round = roundParam === null ? DEFAULT_ROUND : Number(roundParam);
    if (!Number.isInteger(round) || !isRoundAvailableForYear(round, year)) {
      return invalidRequest("The requested CAP round is unavailable.");
    }
    // Get collection name for the round
    const collectionName = getCollectionForRound(round, year);
    const roundDisplayName = getDisplayNameForRound(round);

    const pb = getPocketBase();

    let allRecords: CutoffRecord[];

    try {
      // Verify the PocketBase session before exporting account-only data.
      await ensureUserAuthenticated();

      // Helper function to build filter query parts with chunked parameters
      const buildFilterParts = (
        courseChunk?: string[],
        categoryChunk?: string[],
        statusChunk?: string[],
        homeUniversityChunk?: string[],
      ) => {
        const filterParts: string[] = [];

        if (search) {
          filterParts.push(buildStateCutoffSearchFilter(search));
        }

        // Use chunked categories if provided, otherwise use all categories
        const categoriesToFilter = categoryChunk || categories;
        if (categoriesToFilter && categoriesToFilter.length > 0) {
          const categoryFilter = categoriesToFilter
            .map(
              (cat: string) =>
                `category = "${escapeFilterValue(cat)}"`,
            )
            .join(" || ");
          filterParts.push(`(${categoryFilter})`);
        }

        // Use chunked courses if provided, otherwise use all courses
        const coursesToFilter = courseChunk || courses;
        if (coursesToFilter && coursesToFilter.length > 0) {
          const courseFilter = coursesToFilter
            .map(
              (course: string) =>
                `course_name = "${escapeFilterValue(course)}"`,
            )
            .join(" || ");
          filterParts.push(`(${courseFilter})`);
        }

        // Use chunked statuses if provided, otherwise use all statuses
        const statusesToFilter = statusChunk || statuses;
        if (statusesToFilter && statusesToFilter.length > 0) {
          const statusFilter = statusesToFilter
            .map(
              (status: string) =>
                `status = "${escapeFilterValue(status)}"`,
            )
            .join(" || ");
          filterParts.push(`(${statusFilter})`);
        }

        // Use chunked home universities if provided, otherwise use all home universities
        const homeUniversitiesToFilter =
          homeUniversityChunk || homeUniversities;
        if (homeUniversitiesToFilter && homeUniversitiesToFilter.length > 0) {
          const homeUniversityFilter = homeUniversitiesToFilter
            .map(
              (uni: string) =>
                `home_university = "${escapeFilterValue(uni)}"`,
            )
            .join(" || ");
          filterParts.push(`(${homeUniversityFilter})`);
        }

        // Percentile-based filtering
        if (percentileInput) {
          const targetPercentile = Number(percentileInput);
          const minPercentile = 0;
          const maxPercentile =
            Math.round(targetPercentile * 10000000000) / 10000000000;
          filterParts.push(
            `(cutoff_score >= ${minPercentile} && cutoff_score <= ${maxPercentile})`,
          );
        }

        return filterParts.length > 0 ? filterParts.join(" && ") : "";
      };

      // Calculate if we need to chunk the query due to large filter lists
      const MAX_ITEMS_PER_CHUNK = 10; // Reduced chunk size to prevent URL length issues
      const totalFilterItems =
        (categories?.length || 0) +
        (courses?.length || 0) +
        (statuses?.length || 0) +
        (homeUniversities?.length || 0);
      const shouldChunkQuery = totalFilterItems > 30; // If total filters exceed 30 items, use chunking

      if (shouldChunkQuery) {
        // Create chunks for each filter type
        const categoryChunks =
          categories && categories.length > MAX_ITEMS_PER_CHUNK
            ? Array.from(
                { length: Math.ceil(categories.length / MAX_ITEMS_PER_CHUNK) },
                (_, i) =>
                  categories.slice(
                    i * MAX_ITEMS_PER_CHUNK,
                    (i + 1) * MAX_ITEMS_PER_CHUNK,
                  ),
              )
            : [categories];

        const courseChunks =
          courses && courses.length > MAX_ITEMS_PER_CHUNK
            ? Array.from(
                { length: Math.ceil(courses.length / MAX_ITEMS_PER_CHUNK) },
                (_, i) =>
                  courses.slice(
                    i * MAX_ITEMS_PER_CHUNK,
                    (i + 1) * MAX_ITEMS_PER_CHUNK,
                  ),
              )
            : [courses];

        const statusChunks =
          statuses && statuses.length > MAX_ITEMS_PER_CHUNK
            ? Array.from(
                { length: Math.ceil(statuses.length / MAX_ITEMS_PER_CHUNK) },
                (_, i) =>
                  statuses.slice(
                    i * MAX_ITEMS_PER_CHUNK,
                    (i + 1) * MAX_ITEMS_PER_CHUNK,
                  ),
              )
            : [statuses];

        const homeUniversityChunks =
          homeUniversities && homeUniversities.length > MAX_ITEMS_PER_CHUNK
            ? Array.from(
                {
                  length: Math.ceil(
                    homeUniversities.length / MAX_ITEMS_PER_CHUNK,
                  ),
                },
                (_, i) =>
                  homeUniversities.slice(
                    i * MAX_ITEMS_PER_CHUNK,
                    (i + 1) * MAX_ITEMS_PER_CHUNK,
                  ),
              )
            : [homeUniversities];

        // Execute queries for all combinations of chunks
        const chunkPromises: Promise<CutoffRecord[]>[] = [];
        for (const categoryChunk of categoryChunks) {
          for (const courseChunk of courseChunks) {
            for (const statusChunk of statusChunks) {
              for (const homeUniversityChunk of homeUniversityChunks) {
                const chunkFilterQuery = buildFilterParts(
                  courseChunk,
                  categoryChunk,
                  statusChunk,
                  homeUniversityChunk,
                );
                if (chunkFilterQuery) {
                  chunkPromises.push(
                    pb.collection(collectionName).getFullList<CutoffRecord>({
                      filter: chunkFilterQuery,
                      sort: "-last_rank",
                    }),
                  );
                }
              }
            }
          }
        }

        // Wait for all chunk queries to complete and combine results
        const chunkResults = await Promise.all(chunkPromises);
        allRecords = chunkResults.flatMap((result) => result);

        // Remove duplicates
        const uniqueRecords = new Map<string, CutoffRecord>();
        allRecords.forEach((record) => {
          uniqueRecords.set(record.id, record);
        });
        allRecords = Array.from(uniqueRecords.values());
      } else {
        // Execute single query for smaller filter lists
        const filterQuery = buildFilterParts();

        try {
          allRecords = await pb
            .collection(collectionName)
            .getFullList<CutoffRecord>({
              filter: filterQuery,
              sort: "-last_rank",
            });
        } catch (collectionError) {
          console.error(
            `Export query failed for ${collectionName}:`,
            collectionError,
          );

          // Check if it's a collection not found error
          if (
            collectionError instanceof Error &&
            (collectionError.message.includes("not found") ||
              collectionError.message.includes("does not exist"))
          ) {
            return NextResponse.json(
              {
                success: false,
                error: "Data not available",
                message: `${roundDisplayName} data is not available for export`,
                round,
              },
              {
                status: 404,
                headers: RESPONSE_HEADERS,
              },
            );
          }

          throw collectionError; // Re-throw other errors
        }
      }
    } catch (error) {
      console.error("Database export failed or authentication error:", error);

      // Check if it's an authentication error
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("authentication")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication required",
            message: "Please log in to export cutoff data",
          },
          {
            status: 401,
            headers: RESPONSE_HEADERS,
          },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Export unavailable",
          message: "The cutoff export could not be completed. Try again.",
        },
        { status: 503, headers: RESPONSE_HEADERS },
      );
    }

    // Convert to CSV
    const headers = [
      "College Code",
      "College Name",
      "Course Code",
      "Course Name",
      "Category",
      "Seat Allocation",
      "Cutoff Score",
      "Last Rank",
      "Total Admitted",
    ];

    const csvContent = [
      headers.join(","),
      ...allRecords.map((record) =>
        [
          escapeCsvText(record.college_code),
          escapeCsvText(record.college_name),
          escapeCsvText(record.course_code),
          escapeCsvText(record.course_name),
          escapeCsvText(record.category),
          escapeCsvText(record.seat_allocation_section),
          record.cutoff_score,
          record.last_rank,
          record.total_admitted,
        ].join(","),
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        ...RESPONSE_HEADERS,
        "Content-Disposition": `attachment; filename=mht_cet_state_cutoffs_${year}_${roundDisplayName.toLowerCase().replace(" ", "_")}.csv`,
      },
    });
  } catch (error) {
    console.error("Export API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to export cutoff data",
        message: "The cutoff export could not be completed. Try again.",
      },
      { status: 500, headers: RESPONSE_HEADERS },
    );
  }
}
