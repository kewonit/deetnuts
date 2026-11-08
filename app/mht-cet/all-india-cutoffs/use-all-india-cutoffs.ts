import { useCallback, useEffect, useRef, useState } from "react";
import { allIndiaQueryString, type AllIndiaInitialPage, type AllIndiaQuery } from "./query";
import type { ApiResponse } from "./types";

/**
 * Loads one page of All India cutoffs. The first page arrives server-rendered;
 * later queries hit the cached GET API. The caller debounces filter typing.
 */
export function useAllIndiaCutoffs(query: AllIndiaQuery, initial: AllIndiaInitialPage | null) {
  const key = allIndiaQueryString(query);
  const [state, setState] = useState(() => ({
    key: initial?.key ?? "",
    data: initial?.data ?? [],
    pagination: initial?.pagination ?? { page: 1, perPage: query.perPage, totalPages: 0, totalItems: 0 },
    error: null as string | null,
  }));
  const [loading, setLoading] = useState(!initial);
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(key);
  const loadedKey = useRef(state.key);

  useEffect(() => {
    latest.current = key;
    if (loadedKey.current === key && attempt === 0) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/mht-cet/all-india-cutoffs?${key}`, { signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as ApiResponse | null;
        if (!response.ok || !result?.success) throw new Error(result?.error || `HTTP ${response.status}`);
        if (latest.current !== key) return;
        loadedKey.current = key;
        setState({ key, data: result.data, pagination: result.pagination, error: null });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        if (latest.current !== key) return;
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      })
      .finally(() => {
        if (latest.current === key) setLoading(false);
      });
    return () => controller.abort();
  }, [key, attempt]);

  const refetch = useCallback(() => setAttempt((value) => value + 1), []);
  return {
    data: state.data,
    pagination: state.pagination,
    error: state.error,
    loading,
    refetch,
  };
}
