"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useQueryState,
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  parseAsStringLiteral,
} from "nuqs";

// Custom hook for managing all filter state via URL
export function useCutoffFilters() {
  // Core filters
  const [percentile, setPercentile] = useQueryState(
    "percentile",
    parseAsString.withDefault(""),
  );
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [year, setYear] = useQueryState(
    "year",
    parseAsInteger.withDefault(2025),
  );
  const [round, setRound] = useQueryState(
    "round",
    parseAsInteger.withDefault(1),
  );

  // Multi-select filters
  const [categories, setCategories] = useQueryState(
    "categories",
    parseAsArrayOf(parseAsString, ",").withDefault([]),
  );
  const [courses, setCourses] = useQueryState(
    "courses",
    parseAsArrayOf(parseAsString, ",").withDefault([]),
  );
  const [statuses, setStatuses] = useQueryState(
    "statuses",
    parseAsArrayOf(parseAsString, ",").withDefault([]),
  );
  const [universities, setUniversities] = useQueryState(
    "universities",
    parseAsArrayOf(parseAsString, ",").withDefault([]),
  );

  // Pagination
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState(
    "perPage",
    parseAsInteger.withDefault(25),
  );

  // Sorting
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsString.withDefault("cutoff_score"),
  );
  const [sortOrder, setSortOrder] = useQueryState(
    "sortOrder",
    parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
  );

  // View density
  const [density, setDensity] = useQueryState(
    "density",
    parseAsStringLiteral([
      "compact",
      "comfortable",
      "spacious",
    ] as const).withDefault("comfortable"),
  );

  // Combined filters object for API calls
  const filters = useMemo(
    () => ({
      percentileInput: percentile,
      search,
      year,
      round,
      categories,
      courses,
      statuses,
      homeUniversities: universities,
      page,
      perPage,
      sortBy,
      sortOrder,
    }),
    [
      percentile,
      search,
      year,
      round,
      categories,
      courses,
      statuses,
      universities,
      page,
      perPage,
      sortBy,
      sortOrder,
    ],
  );

  // Clear all filters
  const clearAllFilters = useCallback(async () => {
    await Promise.all([
      setPercentile(null),
      setSearch(null),
      setYear(2025),
      setRound(1),
      setCategories(null),
      setCourses(null),
      setStatuses(null),
      setUniversities(null),
      setPage(1),
      setSortBy("cutoff_score"),
      setSortOrder("desc"),
    ]);
  }, [
    setPercentile,
    setSearch,
    setYear,
    setRound,
    setCategories,
    setCourses,
    setStatuses,
    setUniversities,
    setPage,
    setSortBy,
    setSortOrder,
  ]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (percentile) count++;
    if (search) count++;
    if (categories.length > 0) count++;
    if (courses.length > 0) count++;
    if (statuses.length > 0) count++;
    if (universities.length > 0) count++;
    return count;
  }, [percentile, search, categories, courses, statuses, universities]);

  return {
    // Core filters
    percentile,
    setPercentile,
    search,
    setSearch,
    year,
    setYear,
    round,
    setRound,

    // Multi-select
    categories,
    setCategories,
    courses,
    setCourses,
    statuses,
    setStatuses,
    universities,
    setUniversities,

    // Pagination
    page,
    setPage,
    perPage,
    setPerPage,

    // Sorting
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    // View
    density,
    setDensity,

    // Helpers
    filters,
    clearAllFilters,
    activeFilterCount,
  };
}

// Debounce hook for search inputs
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
