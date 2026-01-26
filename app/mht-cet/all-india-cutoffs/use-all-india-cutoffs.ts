import { useState, useEffect, useCallback, useRef } from "react";
import { SortingState } from "@tanstack/react-table";
import {
  CutoffRecord,
  PaginationInfo,
  ApiResponse,
  FilterState,
  RoundType,
  ROUND_ENDPOINTS,
} from "./types";

interface UseAllIndiaCutoffsProps {
  round: RoundType;
  filters: FilterState;
  sorting: SortingState;
  page: number;
  perPage?: number;
  debounceMs?: number;
}

interface UseAllIndiaCutoffsReturn {
  data: CutoffRecord[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAllIndiaCutoffs({
  round,
  filters,
  sorting,
  page,
  perPage = 50,
  debounceMs = 300,
}: UseAllIndiaCutoffsProps): UseAllIndiaCutoffsReturn {
  const [data, setData] = useState<CutoffRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    perPage: 50,
    totalPages: 0,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use a ref to hold the latest props and state, making fetchData stable
  const stateRef = useRef({ round, filters, sorting, page, perPage });
  useEffect(() => {
    stateRef.current = { round, filters, sorting, page, perPage };
  }, [round, filters, sorting, page, perPage]);

  const buildQueryParams = useCallback(
    (
      currentFilters: FilterState,
      currentSorting: SortingState,
      currentPage: number,
      currentPerPage: number,
    ) => {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("perPage", currentPerPage.toString());

      if (currentSorting.length > 0) {
        const sortField = currentSorting[0].id;
        const sortDirection = currentSorting[0].desc ? "-" : "";
        params.set("sort", `${sortDirection}${sortField}`);
      }

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          params.set(key, value.join(","));
        } else if (typeof value === "string" && value.trim()) {
          params.set(key, value.trim());
        }
      });

      return params.toString();
    },
    [],
  );

  const fetchData = useCallback(
    async (immediate = false) => {
      const { round, filters, sorting, page, perPage } = stateRef.current;

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      const executeFetch = async () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        if (isMountedRef.current) {
          setLoading(true);
          setError(null);
        }

        try {
          const queryParams = buildQueryParams(filters, sorting, page, perPage);
          const url = `${ROUND_ENDPOINTS[round]}?${queryParams}`;

          const response = await fetch(url, {
            signal: abortControllerRef.current.signal,
            cache: "no-store",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.details || `HTTP error! status: ${response.status}`,
            );
          }

          const result: ApiResponse = await response.json();

          if (isMountedRef.current) {
            if (result.success) {
              setData(result.data);
              setPagination(result.pagination);
            } else {
              throw new Error(result.error || "API returned an error");
            }
          }
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            return;
          }

          console.error(`Error fetching ${round} data:`, err);
          if (isMountedRef.current) {
            setError(
              err instanceof Error ? err.message : "An unknown error occurred",
            );
            setData([]);
            setPagination({ page: 1, perPage, totalPages: 0, totalItems: 0 });
          }
        } finally {
          if (isMountedRef.current) {
            setLoading(false);
          }
        }
      };

      if (immediate) {
        executeFetch();
      } else {
        debounceTimeoutRef.current = setTimeout(executeFetch, debounceMs);
      }
    },
    [buildQueryParams, debounceMs],
  );

  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    pagination,
    loading,
    error,
    refetch,
  };
}
