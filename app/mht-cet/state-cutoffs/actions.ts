"use server";

import {
  getPocketBase,
  type PocketBaseLike,
} from "@/lib/pocketbaseClient";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MhtCetCandidateProfileSchema,
  buildAllocationOrFilter,
  deriveEligibleSeatPools,
} from "@/lib/mht-cet/state-cutoffs/candidate-profile";
import {
  getCollectionForRound,
  isRoundAvailableForYear,
  DEFAULT_ROUND,
  DEFAULT_YEAR,
  ROUNDS_BY_YEAR,
} from "./constants";
import {
  type SearchInsight,
  summarizeSearchInsightRows,
} from "./search-insights";
import { runWithConcurrencyLimit } from "./concurrency";
import {
  buildStateCutoffSearchFilter,
  escapeFilterValue,
} from "./search-filter";
import type { CutoffRecord } from "./types";

interface ProfiledCutoffQuery {
  page: number;
  perPage: number;
  search: string;
  categories: string[];
  courses: string[];
  statuses: string[];
  homeUniversities: string[];
  scoreMode: "percentile" | "rank";
  scoreValue: string;
  round: number;
  year: number;
  profile: unknown;
}

interface ProfiledQueryBuilder {
  in(column: string, values: readonly string[]): ProfiledQueryBuilder;
  not(column: string, operator: string, value: unknown): ProfiledQueryBuilder;
  or(filter: string): ProfiledQueryBuilder;
  gt(column: string, value: number): ProfiledQueryBuilder;
  gte(column: string, value: number): ProfiledQueryBuilder;
  lte(column: string, value: number): ProfiledQueryBuilder;
  eq(column: string, value: string): ProfiledQueryBuilder;
  order(
    column: string,
    options: { ascending: boolean },
  ): ProfiledQueryBuilder;
  range(
    from: number,
    to: number,
  ): PromiseLike<{
    data: unknown[] | null;
    error: { code?: string; message: string } | null;
    count: number | null;
  }>;
}

const tokenizeProfileSearch = (search: string): string[] => {
  const tokens = search.slice(0, 200).toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return [...new Set(tokens)].slice(0, 8);
};

const sanitizeProfileStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.slice(0, 200).filter(
        (item): item is string =>
          typeof item === "string" &&
          item.length > 0 &&
          item.length <= 240,
      )
    : [];

export async function getProfiledCutoffRecords(
  input: ProfiledCutoffQuery,
) {
  const parsedProfile = MhtCetCandidateProfileSchema.safeParse(input.profile);
  if (!parsedProfile.success) {
    return {
      success: false,
      error: "Invalid candidate profile",
      message: "Please correct the highlighted candidate profile fields.",
      fieldErrors: Object.fromEntries(
        parsedProfile.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      ),
    };
  }

  const sanitizedYear =
    Number.isInteger(input.year) && ROUNDS_BY_YEAR[input.year]
      ? input.year
      : DEFAULT_YEAR;
  const sanitizedRound =
    Number.isInteger(input.round) &&
    isRoundAvailableForYear(input.round, sanitizedYear)
      ? input.round
      : DEFAULT_ROUND;
  const collectionName = getCollectionForRound(
    sanitizedRound,
    sanitizedYear,
  );
  const page = Number.isInteger(input.page) && input.page > 0 ? input.page : 1;
  const perPage =
    Number.isInteger(input.perPage) &&
    input.perPage > 0 &&
    input.perPage <= 200
      ? input.perPage
      : 25;
  const score = Number(input.scoreValue);
  const requestedCodes = sanitizeProfileStringArray(input.categories);
  const courses = sanitizeProfileStringArray(input.courses);
  const statuses = sanitizeProfileStringArray(input.statuses);
  const homeUniversities = sanitizeProfileStringArray(
    input.homeUniversities,
  );
  const search = typeof input.search === "string" ? input.search : "";

  if (
    typeof input.scoreValue !== "string" ||
    input.scoreValue.trim() === "" ||
    !Number.isFinite(score) ||
    (input.scoreMode === "percentile" && (score < 0 || score > 100)) ||
    (input.scoreMode === "rank" &&
      (!Number.isInteger(score) || score < 1 || score > 1_000_000))
  ) {
    return {
      success: false,
      error: "Invalid score",
      message:
        input.scoreMode === "rank"
          ? "Enter a valid MHT-CET merit rank from 1 to 1,000,000."
          : "Enter a percentile from 0 to 100.",
      fieldErrors: { scoreValue: ["Invalid score value"] },
    };
  }

  const derived = deriveEligibleSeatPools(
    parsedProfile.data,
    requestedCodes,
  );
  if (derived.categoryCodes.length === 0) {
    return {
      success: true,
      data: [],
      totalItems: 0,
      totalPages: 0,
      page,
      perPage,
      round: sanitizedRound,
      year: sanitizedYear,
      collection: collectionName,
      searchInsight: null,
      profileMetadata: {
        ignoredRequestedCodes: derived.ignoredRequestedCodes,
        excludedUnmappedRows: 0,
        stageSemanticsAvailable: false,
      },
    };
  }

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from(collectionName)
      .select(
        "id,college_code,college_name,course_code,course_name,category,seat_allocation_section,cutoff_score,last_rank,total_admitted,status,home_university,institute_home_university_id,affiliating_university_id,minority_community_id",
        { count: "exact" },
      )
      .in("category", derived.categoryCodes)
      .not("institute_home_university_id", "is", null)
      .or(
        buildAllocationOrFilter(parsedProfile.data),
      ) as unknown as ProfiledQueryBuilder;

    if (input.scoreMode === "rank") {
      query = query
        .not("last_rank", "is", null)
        .gt("last_rank", 0)
        .gte("last_rank", score)
        .order("last_rank", { ascending: true })
        .order("id", { ascending: true });
    } else {
      query = query
        .gte("cutoff_score", 0)
        .lte("cutoff_score", score)
        .order("cutoff_score", { ascending: false })
        .order("id", { ascending: true });
    }

    if (courses.length > 0) {
      query = query.in("course_name", courses);
    }
    if (statuses.length > 0) {
      query = query.in("status", statuses);
    }
    if (homeUniversities.length > 0) {
      query = query.in("home_university", homeUniversities);
    }

    for (const token of tokenizeProfileSearch(search)) {
      if (/^\d+$/.test(token)) {
        query = query.eq("college_code", token.replace(/^0+(?=\d)/, ""));
      } else {
        query = query.or(
          `college_name.ilike.%${token}%,course_name.ilike.%${token}%`,
        );
      }
    }

    if (
      derived.categoryCodes.includes("MI") &&
      derived.minorityInstituteIds.length > 0
    ) {
      query = query.or(
        `category.neq.MI,and(category.eq.MI,minority_community_id.in.(${derived.minorityInstituteIds.join(",")}))`,
      );
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("Profiled cutoff query failed", {
        collectionName,
        code: error.code,
        message: error.message,
      });
      const missingTable = error.code === "42P01";
      const missingProfileColumns =
        error.code === "42703" ||
        error.message.includes("institute_home_university_id");
      return {
        success: false,
        error: missingTable
          ? "Data not available"
          : missingProfileColumns
            ? "Profiled cutoff data is not ready"
            : "Failed to fetch cutoff data",
        message: missingTable
          ? `Cutoff data is unavailable for ${sanitizedYear} round ${sanitizedRound}.`
          : missingProfileColumns
            ? "The candidate eligibility migration must be applied before using guided results."
            : "The cutoff data could not be loaded. Try again.",
      };
    }

    const totalItems = count ?? 0;
    return {
      success: true,
      data: data ?? [],
      totalItems,
      totalPages: Math.ceil(totalItems / perPage),
      page,
      perPage,
      round: sanitizedRound,
      year: sanitizedYear,
      collection: collectionName,
      searchInsight: null,
      profileMetadata: {
        ignoredRequestedCodes: derived.ignoredRequestedCodes,
        excludedUnmappedRows: 0,
        stageSemanticsAvailable: false,
      },
    };
  } catch (error) {
    console.error("Profiled cutoff request failed", error);
    return {
      success: false,
      error: "Failed to fetch cutoff data",
      message: "The cutoff data could not be loaded. Try again.",
    };
  }
}

export async function getCutoffRecords(
  page: number,
  perPage: number,
  search: string,
  categories: string[],
  courses: string[],
  statuses: string[],
  homeUniversities: string[],
  percentileInput: string,
  round: number,
  year: number,
  sortBy: string,
  sortOrder: string,
) {
  try {
    const sanitizedYear =
      Number.isInteger(year) && ROUNDS_BY_YEAR[year] ? year : DEFAULT_YEAR;

    // Validate and sanitize round input
    const sanitizedRound =
      Number.isInteger(round) && isRoundAvailableForYear(round, sanitizedYear)
        ? round
        : DEFAULT_ROUND;

    // Get the collection name for the specified round and year
    const collectionName = getCollectionForRound(sanitizedRound, sanitizedYear);

    const pb = getPocketBase();

    // Helper function to build filter query parts with chunked parameters
    const buildFilterParts = (
      courseChunk?: string[],
      categoryChunk?: string[],
      statusChunk?: string[],
      homeUniversityChunk?: string[],
      includePercentile = true,
    ) => {
      const filterParts: string[] = [];
      const buildEqualsFilter = (field: string, values: string[]) => {
        return values
          .map((value: string) => `${field} = "${escapeFilterValue(value)}"`)
          .join(" || ");
      };

      if (search) {
        filterParts.push(buildStateCutoffSearchFilter(search));
      }

      // Use chunked categories if provided, otherwise use all categories
      const categoriesToFilter = categoryChunk || categories;

      if (
        categoriesToFilter &&
        Array.isArray(categoriesToFilter) &&
        categoriesToFilter.length > 0
      ) {
        const categoryFilter = buildEqualsFilter(
          "category",
          categoriesToFilter,
        );
        filterParts.push(`(${categoryFilter})`);
      }

      // Use chunked courses if provided, otherwise use all courses
      const coursesToFilter = courseChunk || courses;
      if (
        coursesToFilter &&
        Array.isArray(coursesToFilter) &&
        coursesToFilter.length > 0
      ) {
        const courseFilter = buildEqualsFilter("course_name", coursesToFilter);
        filterParts.push(`(${courseFilter})`);
      }

      // Use chunked home universities if provided, otherwise use all home universities
      const homeUniversitiesToFilter = homeUniversityChunk || homeUniversities;
      if (
        homeUniversitiesToFilter &&
        Array.isArray(homeUniversitiesToFilter) &&
        homeUniversitiesToFilter.length > 0
      ) {
        const homeUniversityFilter = buildEqualsFilter(
          "home_university",
          homeUniversitiesToFilter,
        );
        filterParts.push(`(${homeUniversityFilter})`);
      }

      // Use chunked statuses if provided, otherwise use all statuses
      const statusesToFilter = statusChunk || statuses;
      if (
        statusesToFilter &&
        Array.isArray(statusesToFilter) &&
        statusesToFilter.length > 0
      ) {
        const statusFilter = buildEqualsFilter("status", statusesToFilter);
        filterParts.push(`(${statusFilter})`);
      }

      // Percentile-based filtering (from target down to 0%) - filtering cutoff_score directly
      if (
        includePercentile &&
        percentileInput &&
        !isNaN(parseFloat(percentileInput))
      ) {
        const targetPercentile = parseFloat(percentileInput);
        // Use higher precision (10 decimal places) to avoid floating-point errors
        const minPercentile = 0; // Changed: show from 0% to target percentile
        const maxPercentile =
          Math.round(targetPercentile * 10000000000) / 10000000000;

        // Filter cutoff_score directly since cutoff_score = percentile
        // Show from 0% to target percentile (inclusive)
        filterParts.push(
          `(cutoff_score >= ${minPercentile} && cutoff_score <= ${maxPercentile})`,
        );
      }

      return filterParts.length > 0 ? filterParts.join(" && ") : "";
    };

    // Build sort string - CRITICAL: Always sort by cutoff_score descending when percentile is provided
    // This ensures highest percentiles (closest to target) appear first
    let sortString;
    if (percentileInput && !isNaN(parseFloat(percentileInput))) {
      sortString = "-cutoff_score"; // Always sort by percentile descending for percentile searches
    } else {
      const sortPrefix = sortOrder === "desc" ? "-" : "";
      sortString = `${sortPrefix}${sortBy}`;
    }

    // Calculate if we need to chunk the query due to large filter lists
    const MAX_ITEMS_PER_CHUNK = 10; // Reduced chunk size to prevent URL length issues
    const totalFilterItems =
      (categories?.length || 0) +
      (courses?.length || 0) +
      (statuses?.length || 0) +
      (homeUniversities?.length || 0);
    const shouldSplitQuery = totalFilterItems > 30; // If total filters exceed 30 items, use chunking

    const chunkValues = (values?: string[]) =>
      values && values.length > MAX_ITEMS_PER_CHUNK
        ? Array.from(
            { length: Math.ceil(values.length / MAX_ITEMS_PER_CHUNK) },
            (_, index) =>
              values.slice(
                index * MAX_ITEMS_PER_CHUNK,
                (index + 1) * MAX_ITEMS_PER_CHUNK,
              ),
          )
        : [values || []];

    const categoryChunks = chunkValues(categories);
    const courseChunks = chunkValues(courses);
    const statusChunks = chunkValues(statuses);
    const homeUniversityChunks = chunkValues(homeUniversities);
    const MAX_CONCURRENT_CHUNK_QUERIES = 8;

    let result;

    // Helper function to validate collection exists
    const validateCollectionExists = async (
      pb: PocketBaseLike,
      collectionName: string,
    ): Promise<boolean> => {
      try {
        await pb.collection(collectionName).getList(1, 1, { skipTotal: true });
        return true;
      } catch (error) {
        console.error(
          `Collection validation failed for ${collectionName}:`,
          error,
        );
        return false;
      }
    };

    const buildSearchInsight = async (): Promise<SearchInsight | null> => {
      if (!search || !percentileInput || isNaN(parseFloat(percentileInput))) {
        return null;
      }

      const loadRows = async (filter: string) => {
        return pb.collection(collectionName).getFullList<{
          id: string;
          college_name: string | null;
          cutoff_score: number | null;
        }>({
          filter,
          sort: "cutoff_score",
          fields: "id,college_name,cutoff_score",
        });
      };

      try {
        if (!shouldSplitQuery) {
          const filterQuery = buildFilterParts(
            undefined,
            undefined,
            undefined,
            undefined,
            false,
          );
          if (!filterQuery) {
            return null;
          }

          return summarizeSearchInsightRows(await loadRows(filterQuery));
        }

        const chunkTasks: Array<
          () => Promise<
            Array<{
              id: string;
              college_name: string | null;
              cutoff_score: number | null;
            }>
          >
        > = [];
        for (const categoryChunk of categoryChunks) {
          for (const courseChunk of courseChunks) {
            for (const statusChunk of statusChunks) {
              for (const homeUniversityChunk of homeUniversityChunks) {
                const chunkFilterQuery = buildFilterParts(
                  courseChunk,
                  categoryChunk,
                  statusChunk,
                  homeUniversityChunk,
                  false,
                );
                if (!chunkFilterQuery) {
                  continue;
                }

                chunkTasks.push(() =>
                  loadRows(chunkFilterQuery).catch((error) => {
                    console.error(
                      `Search insight chunk failed for ${collectionName}:`,
                      error,
                    );
                    return [];
                  }),
                );
              }
            }
          }
        }

        const chunkResults = await runWithConcurrencyLimit(
          chunkTasks,
          MAX_CONCURRENT_CHUNK_QUERIES,
        );
        const uniqueRows = new Map<
          string,
          { college_name: string | null; cutoff_score: number | null }
        >();

        for (const rows of chunkResults) {
          for (const row of rows) {
            uniqueRows.set(row.id, {
              college_name: row.college_name,
              cutoff_score: row.cutoff_score,
            });
          }
        }

        return summarizeSearchInsightRows([...uniqueRows.values()]);
      } catch (error) {
        console.error(
          `Search insight lookup failed for ${collectionName}:`,
          error,
        );
        return null;
      }
    };

    if (shouldSplitQuery) {
      // When chunking queries, we need to be more careful about collection validation
      const collectionExists = await validateCollectionExists(
        pb,
        collectionName,
      );
      if (!collectionExists) {
        console.error(
          `Collection ${collectionName} does not exist or is not accessible`,
        );
        return {
          success: false,
          error: "Data not available",
          message: `Round ${sanitizedRound} data is not available`,
          details: `Collection ${collectionName} not found`,
          round: sanitizedRound,
        };
      }

      // Execute queries for all combinations of chunks
      const chunkTasks: Array<
        () => Promise<{
          items: CutoffRecord[];
          totalItems: number;
          totalPages: number;
          page: number;
          perPage: number;
        }>
      > = [];
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
                chunkTasks.push(() =>
                  pb
                    .collection(collectionName)
                    .getList<CutoffRecord>(
                      1, // Always get page 1 for chunks
                      200, // Get more items per chunk to have enough for final pagination
                      {
                        filter: chunkFilterQuery,
                        sort: sortString,
                      },
                    )
                    .catch((error) => {
                      console.error(
                        `Chunk query failed for ${collectionName}:`,
                        error,
                      );
                      return {
                        items: [],
                        totalItems: 0,
                        totalPages: 0,
                        page: 1,
                        perPage: 200,
                      };
                    }),
                );
              }
            }
          }
        }
      }

      const chunkResults = await runWithConcurrencyLimit(
        chunkTasks,
        MAX_CONCURRENT_CHUNK_QUERIES,
      );

      // Combine all results
      const allItems = chunkResults.flatMap((chunkResult) => chunkResult.items);

      // Remove duplicates
      const uniqueItems = new Map<string, CutoffRecord>();
      allItems.forEach((item) => {
        uniqueItems.set(item.id, item);
      });
      const uniqueItemsArray = Array.from(uniqueItems.values());

      const totalItems = uniqueItemsArray.length;

      // Sort the combined and deduplicated results according to the sort criteria
      uniqueItemsArray.sort((a, b) => {
        if (percentileInput && !isNaN(parseFloat(percentileInput))) {
          // Sort by cutoff_score descending for percentile searches
          return parseFloat(b.cutoff_score) - parseFloat(a.cutoff_score);
        } else if (sortBy === "cutoff_score") {
          const aVal = parseFloat(a.cutoff_score);
          const bVal = parseFloat(b.cutoff_score);
          return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
        } else if (sortBy === "last_rank") {
          const aVal = parseInt(a.last_rank);
          const bVal = parseInt(b.last_rank);
          return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
        }
        return 0;
      });

      // Apply pagination to the combined and sorted results
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedItems = uniqueItemsArray.slice(startIndex, endIndex);

      // Create a result object similar to PocketBase's format
      result = {
        items: paginatedItems,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / perPage),
        page: page,
        perPage: perPage,
      };

    } else {
      // Execute single query for smaller course lists
      const filterQuery = buildFilterParts();

      // This query uses the authenticated user's credentials and respects collection permissions
      try {
        result = await pb
          .collection(collectionName)
          .getList<CutoffRecord>(page, perPage, {
            filter: filterQuery,
            sort: sortString,
          });
      } catch (collectionError) {
        console.error(
          `Failed to query collection ${collectionName}:`,
          collectionError,
        );

        // Check if it's a collection not found error
        if (
          collectionError instanceof Error &&
          (collectionError.message.includes("not found") ||
            collectionError.message.includes("does not exist"))
        ) {
          return {
            success: false,
            error: "Data not available",
            message: `Round ${sanitizedRound} data is not available`,
            details: `Collection ${collectionName} not found`,
            round: sanitizedRound,
          };
        }

        throw collectionError; // Re-throw other errors
      }
    }

    let searchInsight: SearchInsight | null = null;
    if (search && percentileInput && result.totalItems === 0) {
      searchInsight = await buildSearchInsight();
    }

    return {
      success: true,
      data: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage,
      round: sanitizedRound,
      year: sanitizedYear,
      collection: collectionName,
      searchInsight,
    };
  } catch (error: unknown) {
    console.error("Server Action Error:", error);

    // Enhanced error handling for different error types
    if (error instanceof Error) {
      // Check if it's an authentication error
      if (
        error.message.includes("authentication") ||
        error.message.includes("unauthorized")
      ) {
        return {
          success: false,
          error: "Authentication required",
          message: "Please log in to access cutoff data",
          details: error.message,
          round: round,
        };
      }

      // Check if it's a collection not found error
      if (
        error.message.includes("not found") ||
        error.message.includes("does not exist") ||
        error.message.includes("collection")
      ) {
        return {
          success: false,
          error: "Data not available",
          message: `Round ${round} data is not available`,
          details: `Collection data not accessible: ${error.message}`,
          round: round,
        };
      }

      // Check if it's a network/connectivity error
      if (
        error.message.includes("network") ||
        error.message.includes("fetch") ||
        error.message.includes("timeout")
      ) {
        return {
          success: false,
          error: "Connection error",
          message:
            "Unable to connect to the database. Please check your internet connection and try again.",
          details: error.message,
          round: round,
        };
      }
    }

    // Generic error fallback
    return {
      success: false,
      error: "Failed to fetch cutoff data",
      details: error instanceof Error ? error.message : "Unknown error occurred",
      round: round,
    };
  }
}
