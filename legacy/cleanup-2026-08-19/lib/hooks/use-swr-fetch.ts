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
