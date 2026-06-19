"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { CutoffRecord } from "../types";
import { getDisplayNameForRound } from "../constants";
import { type SearchInsight } from "../search-insights";

interface FetchParams {
  page: number;
  perPage: number;
  search: string;
  categories: string[];
  courses: string[];
  statuses: string[];
  homeUniversities: string[];
  percentileInput: string;
  round: number;
  year: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface FetchOptions {
  prefetch?: boolean;
}

interface UseCutoffDataReturn {
  records: CutoffRecord[];
  totalItems: number;
  loading: boolean;
  paginationLoading: boolean;
  hasFetched: boolean;
  searchInsight: SearchInsight | null;
  error: string | null;
  fetchData: (params: FetchParams, options?: FetchOptions) => Promise<void>;
  prefetchNextPage: (params: FetchParams) => void;
  clearCache: () => void;
}

// Maximum cache size for memory management
const MAX_CACHE_SIZE = 100;

export function useCutoffData(): UseCutoffDataReturn {
  const [records, setRecords] = useState<CutoffRecord[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [searchInsight, setSearchInsight] = useState<SearchInsight | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<
    Map<
      string,
      {
        data: CutoffRecord[];
        totalItems: number;
        searchInsight: SearchInsight | null;
        timestamp: number;
      }
    >
  >(new Map());
  const lastParamsRef = useRef<string>("");
  const requestIdRef = useRef<number>(0);
  const prefetchControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Track last successful records to prevent flickering
  const lastRecordsRef = useRef<CutoffRecord[]>([]);
  const lastTotalItemsRef = useRef(0);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Prefetch next page in background (silent, no state updates)
  const prefetchNextPage = useCallback((params: FetchParams) => {
    const currentTotal = lastTotalItemsRef.current;
    if (currentTotal <= 0) return;

    const totalPages = Math.ceil(currentTotal / params.perPage);
    if (params.page >= totalPages || !params.percentileInput) return;

    const nextParams = { ...params, page: params.page + 1 };
    const cacheKey = JSON.stringify(nextParams);

    // Already cached
    if (cacheRef.current.has(cacheKey)) return;

    // Cancel previous prefetch
    if (prefetchControllerRef.current) {
      prefetchControllerRef.current.abort();
    }

    prefetchControllerRef.current = new AbortController();

    // Prefetch in background with low priority
    fetch("/api/mht-cet/state-cutoffs", {
      method: "POST",
      signal: prefetchControllerRef.current.signal,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
      body: JSON.stringify(nextParams),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          // Manage cache size
          if (cacheRef.current.size >= MAX_CACHE_SIZE) {
            // Remove oldest entries
            const entries = Array.from(cacheRef.current.entries()).sort(
              (a, b) => a[1].timestamp - b[1].timestamp,
            );
            for (let i = 0; i < 10; i++) {
              cacheRef.current.delete(entries[i][0]);
            }
          }
          cacheRef.current.set(cacheKey, {
            data: result.data,
            totalItems: result.totalItems,
            searchInsight: result.searchInsight ?? null,
            timestamp: Date.now(),
          });
        }
      })
      .catch(() => {
        // Silently ignore prefetch errors
      });
  }, []);

  const fetchData = useCallback(
    async (params: FetchParams, options?: FetchOptions) => {
      const shouldPrefetch = options?.prefetch ?? true;

      // Don't fetch if no percentile
      if (!params.percentileInput || params.percentileInput.trim() === "") {
        setRecords([]);
        setTotalItems(0);
        setHasFetched(false);
        setSearchInsight(null);
        setLoading(false);
        setPaginationLoading(false);
        return;
      }

      const cacheKey = JSON.stringify(params);
      const paramsKey = `${params.search}-${params.categories.join(",")}-${params.courses.join(",")}-${params.statuses.join(",")}-${params.homeUniversities.join(",")}-${params.percentileInput}-${params.round}-${params.year}`;
      const isOnlyPaginationChange = lastParamsRef.current === paramsKey;

      // Check cache first
      if (cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey)!;
        // Only update if data actually changed
        if (
          JSON.stringify(cached.data) !==
            JSON.stringify(lastRecordsRef.current) ||
          cached.totalItems !== lastTotalItemsRef.current
        ) {
          lastRecordsRef.current = cached.data;
          lastTotalItemsRef.current = cached.totalItems;
          setRecords(cached.data);
          setTotalItems(cached.totalItems);
          setSearchInsight(cached.searchInsight);
        }
        // Prefetch next page after cache hit
        if (shouldPrefetch) {
          prefetchNextPage(params);
        }
        return;
      }

      // Abort previous request if filter params changed
      if (abortControllerRef.current && !isOnlyPaginationChange) {
        abortControllerRef.current.abort();
      }

      lastParamsRef.current = paramsKey;
      const requestId = ++requestIdRef.current;
      abortControllerRef.current = new AbortController();

      // Set loading state
      if (isOnlyPaginationChange) {
        setPaginationLoading(true);
      } else {
        setLoading(true);
        setPaginationLoading(false);
      }
      setError(null);

      try {
        const response = await fetch("/api/mht-cet/state-cutoffs", {
          method: "POST",
          signal: abortControllerRef.current.signal,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=300",
          },
          body: JSON.stringify(params),
        });

        if (requestId !== requestIdRef.current) return;

        const result = await response.json();

        if (requestId !== requestIdRef.current) return;

        if (!response.ok) {
          if (result?.loginRequired) {
            const userMessage =
              result.message || "Please login to continue using state cutoffs.";
            if (isMountedRef.current) {
              setSearchInsight(null);
              setError(userMessage);
            }
            toast.error(userMessage);
            return;
          }

          throw new Error(
            result?.message ||
              result?.error ||
              `HTTP error! status: ${response.status}`,
          );
        }

        if (!result.success) {
          const isAuthError =
            result.error === "Authentication required" || result.loginRequired;
          const userMessage = isAuthError
            ? result.message || "Please login to continue using state cutoffs."
            : result.message || result.error || "Failed to fetch data";

          if (isMountedRef.current) {
            setSearchInsight(null);
            setError(userMessage);
          }

          if (result.error === "Data not available") {
            toast.error(
              `${getDisplayNameForRound(params.round)} data is not available yet.`,
            );
          } else {
            toast.error(userMessage);
          }

          return;
        }

        // Cache the result with timestamp
        if (cacheRef.current.size >= MAX_CACHE_SIZE) {
          // Remove oldest entries (LRU-style eviction)
          const entries = Array.from(cacheRef.current.entries()).sort(
            (a, b) => a[1].timestamp - b[1].timestamp,
          );
          for (let i = 0; i < 10; i++) {
            cacheRef.current.delete(entries[i][0]);
          }
        }
        cacheRef.current.set(cacheKey, {
          data: result.data,
          totalItems: result.totalItems,
          searchInsight: result.searchInsight ?? null,
          timestamp: Date.now(),
        });

        // Only update if mounted and data changed
        if (isMountedRef.current) {
          lastRecordsRef.current = result.data;
          lastTotalItemsRef.current = result.totalItems;
          setRecords(result.data);
          setTotalItems(result.totalItems);
          setSearchInsight(result.searchInsight ?? null);
          setHasFetched(true);
        }

        // Prefetch next page after successful fetch
        if (shouldPrefetch) {
          prefetchNextPage(params);
        }
      } catch (err: any) {
        if (requestId !== requestIdRef.current) return;
        if (err.name === "AbortError") return;

        const errorMessage = err?.message || "Something went wrong";

        if (
          errorMessage.includes("Authentication required") ||
          errorMessage.toLowerCase().includes("log in")
        ) {
          console.info("Cutoff fetch blocked by authentication");
        } else {
          console.error("Fetch error:", err);
        }
        setError(errorMessage);
        setSearchInsight(null);

        if (
          errorMessage.includes("network") ||
          errorMessage.includes("fetch")
        ) {
          toast.error("Network error. Please check your connection.");
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setPaginationLoading(false);
        }
      }
    },
    [prefetchNextPage],
  );

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (prefetchControllerRef.current) {
        prefetchControllerRef.current.abort();
      }
    };
  }, []);

  return {
    records,
    totalItems,
    loading,
    paginationLoading,
    hasFetched,
    searchInsight,
    error,
    fetchData,
    prefetchNextPage,
    clearCache,
  };
}
