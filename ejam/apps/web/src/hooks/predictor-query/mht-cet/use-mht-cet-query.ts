"use client";

import { PredictionErrorResponse, type PredictionProvenance } from "@ejam/data";
import type { MhtCetPredictionInput } from "@ejam/data/mht-cet/browser";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildMhtCetPredictionRequest,
  decodePredictionSuccess,
  type PredictorDisplayResult,
} from "@/lib/predictor-adapters";
import type { PredictorQueryOptions, PredictorQueryResult } from "../types";

const QUERY_PREFIX = "mht-cet-prediction";
const PAGE_SIZE = 100;

type MhtCetPage = {
  result: PredictorDisplayResult;
  provenance: PredictionProvenance;
};

class PredictionRequestError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "PredictionRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}

function baseRequest(
  options: PredictorQueryOptions,
  rank: string,
  includeAll: boolean,
): MhtCetPredictionInput {
  return buildMhtCetPredictionRequest({
    rank,
    candidatureTypeId: options.mhtCandidatureType,
    categoryId: options.mhtCategory,
    ladiesSeatEligible: options.mhtLadiesSeatEligible,
    homeUniversityId: options.mhtHomeUniversity,
    ewsCertificate: options.has_ews_certificate,
    tfwsEligible: options.mhtTfwsEligible,
    pwdCategoryId: options.mhtPwdCategory,
    orphanCertificate: options.mhtOrphanCertificate,
    minorityCommunityId: options.mhtMinorityCommunity,
    includeAll,
  });
}

function profileKey(
  options: PredictorQueryOptions,
  rank = options.rank,
): string {
  return JSON.stringify({
    ...baseRequest(options, rank, false),
    include_all: undefined,
  });
}

function nonRankProfileKeyFromInput(input: MhtCetPredictionInput): string {
  return JSON.stringify({
    candidature_type_id: input.candidature_type_id,
    category_id: input.category_id,
    ladies_seat_eligible: input.ladies_seat_eligible,
    home_university_id: input.home_university_id ?? null,
    eligibilities: input.eligibilities,
  });
}

function resultFilters(options: PredictorQueryOptions) {
  const instituteTypes = Array.from(options.filters.instituteTypes).sort();
  const bands = Array.from(options.filters.bands).sort();
  return {
    ...(instituteTypes.length ? { institute_type: instituteTypes } : {}),
    ...(bands.length ? { band: bands } : {}),
  };
}

function resultKey(options: {
  submitted: MhtCetPredictionInput | null;
  filters: ReturnType<typeof resultFilters>;
  search: string;
  sort: string;
}): string {
  return JSON.stringify(options);
}

async function fetchMhtPage(options: {
  input: MhtCetPredictionInput;
  cursor: string | null;
  signal: AbortSignal;
}): Promise<MhtCetPage> {
  const response = await fetch("/api/predict/mht-cet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...options.input,
      result_options: {
        ...options.input.result_options,
        ...(options.cursor ? { cursor: options.cursor } : {}),
      },
    }),
    signal: options.signal,
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new PredictionRequestError(
      "Network error — please try again",
      response.status,
    );
  }
  if (!response.ok) {
    const parsed = PredictionErrorResponse.safeParse(body);
    throw new PredictionRequestError(
      parsed.success ? parsed.data.error.message : "Prediction failed",
      response.status,
      parsed.success ? (parsed.data.error.field_errors ?? {}) : {},
    );
  }
  const decoded = decodePredictionSuccess("mht-cet", body);
  if (!decoded || decoded.result.resultMode !== "server-paged") {
    throw new PredictionRequestError(
      "MHT-CET returned an invalid paginated response",
      500,
    );
  }
  return decoded;
}

function aggregatePages(pages: MhtCetPage[]): MhtCetPage {
  const first = pages[0];
  if (!first) throw new Error("MHT-CET page collection is empty");
  const programs: PredictorDisplayResult["programs"] = [];
  const keys = new Set<string>();
  const cursors = new Set<string>();
  const stableMetadata = JSON.stringify({
    totalMatching: first.result.metadata.totalMatching,
    displayedPrograms: first.result.metadata.displayedPrograms,
    hiddenPrograms: first.result.metadata.hiddenPrograms,
    warnings: first.result.metadata.warnings,
    facets: first.result.metadata.facets,
  });
  const stableProvenance = JSON.stringify({
    exam: first.provenance.exam_id,
    manifest: first.provenance.manifest_version,
    datasets: first.provenance.datasets_used,
    lineage: first.provenance.index_lineage,
  });
  for (const page of pages) {
    const pageMetadata = JSON.stringify({
      totalMatching: page.result.metadata.totalMatching,
      displayedPrograms: page.result.metadata.displayedPrograms,
      hiddenPrograms: page.result.metadata.hiddenPrograms,
      warnings: page.result.metadata.warnings,
      facets: page.result.metadata.facets,
    });
    const pageProvenance = JSON.stringify({
      exam: page.provenance.exam_id,
      manifest: page.provenance.manifest_version,
      datasets: page.provenance.datasets_used,
      lineage: page.provenance.index_lineage,
    });
    if (
      pageMetadata !== stableMetadata ||
      pageProvenance !== stableProvenance
    ) {
      throw new Error("MHT-CET result metadata changed between pages");
    }
    const nextCursor = page.result.metadata.pagination?.nextCursor;
    if (nextCursor && cursors.has(nextCursor)) {
      throw new Error("MHT-CET returned a repeated result cursor");
    }
    if (nextCursor) cursors.add(nextCursor);
    for (const program of page.result.programs) {
      if (keys.has(program.key)) {
        throw new Error("MHT-CET returned a duplicate program");
      }
      keys.add(program.key);
      programs.push(program);
    }
  }
  const last = pages.at(-1) ?? first;
  return {
    provenance: first.provenance,
    result: {
      ...first.result,
      programs,
      metadata: {
        ...first.result.metadata,
        pagination: last.result.metadata.pagination
          ? {
              ...last.result.metadata.pagination,
              returned: programs.length,
            }
          : undefined,
      },
    },
  };
}

export function useMhtCetPagedQuery(
  options: PredictorQueryOptions,
): PredictorQueryResult {
  const enabled = options.predictorExamId === "mht-cet";
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState<MhtCetPredictionInput | null>(
    null,
  );
  const [submittedProfileKey, setSubmittedProfileKey] = useState<string | null>(
    null,
  );
  const currentProfileKey = profileKey(options);
  const recoveryAttemptedRef = useRef(false);
  const debouncedSearch = useDebouncedValue(options.searchQuery, 250);
  const searchPending = options.searchQuery !== debouncedSearch;
  const filters = resultFilters(options);
  const sort =
    options.sortBy === "closing-rank" || options.sortBy === "institute"
      ? options.sortBy
      : "chance";
  const key = resultKey({
    submitted,
    filters,
    search: debouncedSearch.trim(),
    sort,
  });
  const queryKey = [QUERY_PREFIX, key] as const;
  const optionsNonRankKey = nonRankProfileKeyFromInput(
    baseRequest(options, "0", false),
  );
  const optionsRank = options.rank;
  const hasActiveSubmission =
    enabled &&
    submitted !== null &&
    submittedProfileKey !== null &&
    (submittedProfileKey === currentProfileKey ||
      (nonRankProfileKeyFromInput(submitted) === optionsNonRankKey &&
        (!optionsRank || Number(optionsRank) === submitted.rank)));

  useEffect(() => {
    if (!enabled) {
      setSubmitted(null);
      setSubmittedProfileKey(null);
      void queryClient.cancelQueries({ queryKey: [QUERY_PREFIX] });
      queryClient.removeQueries({ queryKey: [QUERY_PREFIX] });
      return;
    }
    if (submitted === null || submittedProfileKey === null) return;
    if (
      submittedProfileKey === currentProfileKey ||
      (nonRankProfileKeyFromInput(submitted) === optionsNonRankKey &&
        (!optionsRank || Number(optionsRank) === submitted.rank))
    ) {
      return;
    }
    setSubmitted(null);
    setSubmittedProfileKey(null);
    void queryClient.cancelQueries({ queryKey: [QUERY_PREFIX] });
    queryClient.removeQueries({ queryKey: [QUERY_PREFIX] });
  }, [
    currentProfileKey,
    enabled,
    optionsNonRankKey,
    optionsRank,
    queryClient,
    submitted,
    submittedProfileKey,
  ]);

  const query = useInfiniteQuery({
    queryKey,
    enabled: hasActiveSubmission,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => {
      if (!submitted) {
        throw new PredictionRequestError(
          "Submit an MHT-CET profile before requesting results",
          400,
        );
      }
      return fetchMhtPage({
        input: {
          ...submitted,
          filters,
          result_options: {
            limit: PAGE_SIZE,
            search: debouncedSearch.trim(),
            sort_by: sort,
          },
        },
        cursor: pageParam,
        signal,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.result.metadata.pagination?.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) =>
      failureCount < 1 &&
      error instanceof PredictionRequestError &&
      (error.status === 0 || error.status >= 500) &&
      error.status !== 503,
  });

  useEffect(() => {
    queryClient.removeQueries({
      predicate: (cachedQuery) =>
        cachedQuery.queryKey[0] === QUERY_PREFIX &&
        cachedQuery.queryKey[1] !== key &&
        cachedQuery.getObserversCount() === 0,
    });
  }, [key, queryClient]);

  const aggregate = useMemo(() => {
    if (!query.data?.pages.length) return { page: null, error: null };
    try {
      return { page: aggregatePages(query.data.pages), error: null };
    } catch (error) {
      return {
        page: null,
        error: error instanceof Error ? error.message : "Prediction failed",
      };
    }
  }, [query.data]);

  const trigger = useCallback(
    async (
      rankOverride?: string,
      requestOverrides?: { include_all?: boolean },
    ): Promise<boolean> => {
      const rank = rankOverride ?? options.rank;
      if (!enabled || !rank || Number.isNaN(Number(rank))) return false;
      const includeAll = requestOverrides?.include_all ?? options.include_all;
      setSubmitted(baseRequest(options, rank, includeAll));
      setSubmittedProfileKey(profileKey(options, rank));
      recoveryAttemptedRef.current = false;
      return false;
    },
    [enabled, options],
  );

  const loadMore = useCallback(async () => {
    const result = await query.fetchNextPage();
    const requestError = result.error;
    if (
      requestError instanceof PredictionRequestError &&
      requestError.fieldErrors["result_options.cursor"] &&
      !recoveryAttemptedRef.current
    ) {
      recoveryAttemptedRef.current = true;
      queryClient.removeQueries({ queryKey, exact: true });
      await query.refetch();
    }
  }, [query, queryClient, queryKey]);

  const queryError = query.error instanceof Error ? query.error.message : null;
  const hasLoadedPages = (query.data?.pages.length ?? 0) > 0;
  return {
    data: hasActiveSubmission ? (aggregate.page?.result ?? null) : null,
    provenance: hasActiveSubmission
      ? (aggregate.page?.provenance ?? null)
      : null,
    isLoading:
      hasActiveSubmission &&
      (query.isPending || (!hasLoadedPages && query.isFetching)),
    isUpdating:
      hasActiveSubmission &&
      (searchPending ||
        query.isPlaceholderData ||
        (query.isFetching && !query.isFetchingNextPage && hasLoadedPages)),
    isFetchingNextPage: hasActiveSubmission && query.isFetchingNextPage,
    hasNextPage: hasActiveSubmission && query.hasNextPage,
    error: hasActiveSubmission
      ? (aggregate.error ?? (!hasLoadedPages ? queryError : null))
      : null,
    nextPageError: hasActiveSubmission && hasLoadedPages ? queryError : null,
    resultKey: key,
    trigger,
    loadMore,
  };
}
