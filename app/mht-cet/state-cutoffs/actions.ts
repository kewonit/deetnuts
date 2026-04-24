"use server";

import { getPocketBase } from "@/lib/pocketbaseClient";
import { ensureUserAuthenticated } from "@/lib/supabaseAuth";
import {
  getCollectionForRound,
  isValidRound,
  DEFAULT_ROUND,
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
    console.log("Server Action called with:", {
      page,
      perPage,
      search,
      categories,
      courses,
      statuses,
      homeUniversities,
      percentileInput,
      round,
      year,
      sortBy,
      sortOrder,
    });

    // Validate and sanitize round input
    const sanitizedRound =
      Number.isInteger(round) && isValidRound(round) ? round : DEFAULT_ROUND;
    if (sanitizedRound !== round) {
      console.warn(
        `Invalid round ${round} provided, using default round ${sanitizedRound}`,
      );
    }

    // Get the collection name for the specified round and year
    const collectionName = getCollectionForRound(sanitizedRound, year);
    console.log(
      `Using collection: ${collectionName} for round ${sanitizedRound} and year ${year}`,
    );

    const pb = getPocketBase();

    // Ensure user authentication using Supabase
    try {
      await ensureUserAuthenticated();
    } catch (authError) {
      console.error("User authentication failed:", authError);
      return {
        success: false,
        error: "Authentication required",
        message: "Please log in to access cutoff data",
        details: "User authentication failed",
        round: sanitizedRound,
      };
    }

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

    console.log("Query strategy:", {
      totalCategories: categories?.length || 0,
      totalCourses: courses?.length || 0,
      totalStatuses: statuses?.length || 0,
      totalHomeUniversities: homeUniversities?.length || 0,
      totalFilterItems,
      shouldSplitQuery,
      maxItemsPerChunk: MAX_ITEMS_PER_CHUNK,
    });

    let result;

    // Helper function to validate collection exists
    const validateCollectionExists = async (
      pb: any,
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

      console.log(
        `Splitting query into chunks - Categories: ${categoryChunks.length}, Courses: ${courseChunks.length}, Statuses: ${statusChunks.length}, Universities: ${homeUniversityChunks.length}`,
      );

      // Execute queries for all combinations of chunks
      const chunkTasks: Array<
        () => Promise<{
          items: any[];
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
                    .getList(
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

      console.log(
        `Executing ${chunkTasks.length} chunk queries against ${collectionName} with concurrency limit ${MAX_CONCURRENT_CHUNK_QUERIES}`,
      );

      const chunkResults = await runWithConcurrencyLimit(
        chunkTasks,
        MAX_CONCURRENT_CHUNK_QUERIES,
      );

      // Combine all results
      const allItems = chunkResults.flatMap((chunkResult) => chunkResult.items);

      // Remove duplicates
      const uniqueItems = new Map();
      allItems.forEach((item) => {
        uniqueItems.set(item.id, item);
      });
      const uniqueItemsArray = Array.from(uniqueItems.values());

      const totalItems = uniqueItemsArray.length;

      // Sort the combined and deduplicated results according to the sort criteria
      uniqueItemsArray.sort((a: any, b: any) => {
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

      console.log("Combined query result:", {
        collection: collectionName,
        chunksExecuted: chunkResults.length,
        totalItemsFound: totalItems,
        finalPaginatedItems: paginatedItems.length,
      });
    } else {
      // Execute single query for smaller course lists
      const filterQuery = buildFilterParts();
      console.log("Executing single query:", {
        collection: collectionName,
        filterQuery:
          filterQuery.substring(0, 200) +
          (filterQuery.length > 200 ? "..." : ""),
        filterLength: filterQuery.length,
      });

      // This query uses the authenticated user's credentials and respects collection permissions
      try {
        result = await pb.collection(collectionName).getList(page, perPage, {
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

    console.log("Database result:", {
      collection: collectionName,
      round: sanitizedRound,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage,
      itemCount: result.items.length,
      searchInsight,
    });

    return {
      success: true,
      data: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage,
      round: sanitizedRound,
      collection: collectionName,
      searchInsight,
    };
  } catch (error: any) {
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
      details: error.message || "Unknown error occurred",
      round: round,
    };
  }
}
