"use client";

import useSWR from "swr";

// Global fetcher for SWR - handles JSON responses
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }
  return res.json();
};

// Fetcher that extracts a specific field from the response
const createFieldFetcher = (field: string) => async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data[field] || data;
};

// Hook for fetching JoSAA institutes with SWR deduplication
export function useJosaaInstitutes() {
  const { data, error, isLoading } = useSWR(
    "/api/josaa/institutes",
    createFieldFetcher("institutes"),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Dedupe requests within 60s
    },
  );

  return {
    institutes: data || [],
    isLoading,
    error,
  };
}

// Hook for fetching institute branches by slug
export function useInstituteBranches(slug: string | null) {
  const { data, error, isLoading } = useSWR(
    slug ? `/api/josaa/institutes/${slug}` : null,
    createFieldFetcher("branches"),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    },
  );

  return {
    branches: data || [],
    isLoading,
    error,
  };
}

// Hook for predictions with filters
interface PredictionFilters {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  institute?: string;
  branch?: string;
  seatType?: string;
  quota?: string;
  search?: string;
  minCutoff?: number | null;
  maxCutoff?: number | null;
  minChange?: number | null;
  maxChange?: number | null;
}

export function usePredictionsData(filters: PredictionFilters) {
  // Build query string from filters
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.perPage) params.append("perPage", filters.perPage.toString());
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
  if (filters.institute) params.append("institute", filters.institute);
  if (filters.branch) params.append("branch", filters.branch);
  if (filters.seatType) params.append("seatType", filters.seatType);
  if (filters.quota) params.append("quota", filters.quota);
  if (filters.search?.trim()) params.append("search", filters.search.trim());
  if (
    filters.minCutoff !== null &&
    filters.minCutoff !== undefined &&
    !isNaN(filters.minCutoff)
  ) {
    params.append("minCutoff", filters.minCutoff.toString());
  }
  if (
    filters.maxCutoff !== null &&
    filters.maxCutoff !== undefined &&
    !isNaN(filters.maxCutoff)
  ) {
    params.append("maxCutoff", filters.maxCutoff.toString());
  }
  if (
    filters.minChange !== null &&
    filters.minChange !== undefined &&
    !isNaN(filters.minChange)
  ) {
    params.append("minChange", filters.minChange.toString());
  }
  if (
    filters.maxChange !== null &&
    filters.maxChange !== undefined &&
    !isNaN(filters.maxChange)
  ) {
    params.append("maxChange", filters.maxChange.toString());
  }

  const queryString = params.toString();
  const url = queryString
    ? `/api/predictions?${queryString}`
    : "/api/predictions";

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000, // Shorter for filtered data
  });

  return {
    data: data?.data || [],
    pagination: data?.pagination || {
      page: 1,
      perPage: 50,
      totalRecords: 0,
      totalPages: 0,
    },
    filters: data?.filters || {
      institutes: [],
      branches: [],
      seatTypes: [],
      quotas: [],
    },
    stats: data?.stats || {
      totalRecords: 0,
      filteredRecords: 0,
      averagePredictedCutoff: 0,
      averageChange: 0,
      averagePercentChange: 0,
    },
    isLoading,
    error: error?.message || (data?.success === false ? data?.error : null),
    refetch: mutate,
  };
}

// Generic SWR hook for any URL
export function useFetch<T>(url: string | null, options?: { field?: string }) {
  const fetcherToUse = options?.field
    ? createFieldFetcher(options.field)
    : fetcher;

  const { data, error, isLoading, mutate } = useSWR<T>(url, fetcherToUse, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
  });

  return {
    data,
    isLoading,
    error,
    refetch: mutate,
  };
}
