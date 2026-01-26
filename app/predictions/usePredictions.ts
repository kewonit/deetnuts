"use client";

import useSWR from "swr";
import {
  PredictionRecord,
  PredictionResponse,
  PredictionFilters,
} from "./types";

// Global fetcher for SWR
const fetcher = async (url: string): Promise<PredictionResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
};

interface UsePredictionsResult {
  data: PredictionRecord[];
  loading: boolean;
  error: string | null;
  pagination: PredictionResponse["pagination"];
  filters: PredictionResponse["filters"];
  stats: PredictionResponse["stats"];
  fetchData: () => Promise<void>;
}

export function usePredictions(
  page: number,
  perPage: number,
  filters: PredictionFilters,
  sortBy: string,
  sortOrder: "asc" | "desc",
): UsePredictionsResult {
  // Build query params
  const params = new URLSearchParams({
    page: page.toString(),
    perPage: perPage.toString(),
    sortBy,
    sortOrder,
  });

  // Add filters (only add non-empty values)
  if (filters.institute) params.append("institute", filters.institute);
  if (filters.branch) params.append("branch", filters.branch);
  if (filters.seatType) params.append("seatType", filters.seatType);
  if (filters.quota) params.append("quota", filters.quota);
  if (filters.search?.trim()) params.append("search", filters.search.trim());
  if (filters.minCutoff !== null && !isNaN(filters.minCutoff))
    params.append("minCutoff", filters.minCutoff.toString());
  if (filters.maxCutoff !== null && !isNaN(filters.maxCutoff))
    params.append("maxCutoff", filters.maxCutoff.toString());
  if (filters.minChange !== null && !isNaN(filters.minChange))
    params.append("minChange", filters.minChange.toString());
  if (filters.maxChange !== null && !isNaN(filters.maxChange))
    params.append("maxChange", filters.maxChange.toString());

  const url = `/api/predictions?${params}`;

  const {
    data: result,
    error,
    isLoading,
    mutate,
  } = useSWR<PredictionResponse>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000, // Short dedup for filtered data
  });

  // Default values for when data is loading or errored
  const defaultPagination: PredictionResponse["pagination"] = {
    page: 1,
    perPage: 50,
    totalRecords: 0,
    totalPages: 0,
  };

  const defaultFilters: PredictionResponse["filters"] = {
    institutes: [],
    branches: [],
    seatTypes: [],
    quotas: [],
  };

  const defaultStats: PredictionResponse["stats"] = {
    totalRecords: 0,
    filteredRecords: 0,
    averagePredictedCutoff: 0,
    averageChange: 0,
    averagePercentChange: 0,
  };

  return {
    data: result?.success && result?.data ? result.data : [],
    loading: isLoading,
    error:
      error?.message ||
      (result?.success === false
        ? result?.error || "Failed to fetch predictions data"
        : null),
    pagination: result?.pagination || defaultPagination,
    filters: result?.filters || defaultFilters,
    stats: result?.stats || defaultStats,
    fetchData: async () => {
      await mutate();
    },
  };
}
