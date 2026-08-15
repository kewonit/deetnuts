"use client";

import { quotaRequiresHomeState } from "@ejam/predictors/shared/quota-input";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  createContext,
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RankInputHandle } from "@/components/predictor/rank-input";
import {
  EMPTY_RESULTS_FILTERS,
  type ResultsFilterState,
} from "@/components/predictor/results-filter-logic";
import {
  DEFAULT_RESULTS_SORT,
  type ResultsSortKey,
} from "@/components/predictor/results-sort-logic";
import { usePredictorQuery } from "@/hooks/use-predictor-query";
import {
  counsellingToPredictorExam,
  type ExamType,
  type PredictorStateReturn,
  parseCounsellingBody,
  predictorUsesQuotaHomeState,
  usePredictorState,
} from "@/hooks/use-predictor-state";
import { validatePredictorRank } from "@/lib/rank-validation";

type PredictorQueryReturn = ReturnType<typeof usePredictorQuery>;

interface PredictorContextValue {
  state: PredictorStateReturn;
  query: PredictorQueryReturn;
  onPredict: () => void;
  rankInputRef: React.RefObject<RankInputHandle | null>;
  filters: ResultsFilterState;
  setFilters: (next: ResultsFilterState) => void;
  sortBy: ResultsSortKey;
  setSortBy: (next: ResultsSortKey) => void;
  searchQuery: string;
  setSearchQuery: (next: string) => void;
  hasResults: boolean;
  mhtCetEnabled: boolean;
}

const PredictorContext = createContext<PredictorContextValue | null>(null);

function captureInitialUrlParams(): URLSearchParams | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search);
}

function shareLinkReadyToPredict(
  params: URLSearchParams,
  mhtCetEnabled: boolean,
): boolean {
  if (!params.get("rank")?.trim()) return false;
  const rawExam = params.get("exam");
  const exam: ExamType =
    rawExam === "jee-advanced" || rawExam === "mht-cet" ? rawExam : "jee-main";
  if (exam === "mht-cet" && !mhtCetEnabled) return false;
  if (
    exam === "mht-cet" &&
    (params.get("mht_candidature") ?? "type-a") !== "type-e" &&
    !params.get("mht_home_university")?.trim()
  ) {
    return false;
  }
  const counselling = parseCounsellingBody(params.get("counselling"));
  const predictorExamId = counsellingToPredictorExam(exam, counselling);
  const quota = params.get("quota") ?? "os";
  if (
    predictorUsesQuotaHomeState(predictorExamId) &&
    quotaRequiresHomeState(quota) &&
    !params.get("state")?.trim()
  ) {
    return false;
  }
  return true;
}

export function PredictorProvider({
  children,
  mhtCetEnabled = false,
}: {
  children: React.ReactNode;
  mhtCetEnabled?: boolean;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <PredictorProviderInner mhtCetEnabled={mhtCetEnabled}>
          {children}
        </PredictorProviderInner>
      </Suspense>
    </QueryClientProvider>
  );
}

function PredictorProviderInner({
  children,
  mhtCetEnabled,
}: {
  children: React.ReactNode;
  mhtCetEnabled: boolean;
}) {
  const params = useSearchParams();
  const requestedState = usePredictorState(params);
  const state: PredictorStateReturn =
    !mhtCetEnabled && requestedState.exam === "mht-cet"
      ? {
          ...requestedState,
          exam: "jee-main",
          predictorExamId: counsellingToPredictorExam(
            "jee-main",
            requestedState.counselling,
          ),
        }
      : requestedState;
  const [filters, setFilters] = useState<ResultsFilterState>(
    EMPTY_RESULTS_FILTERS,
  );
  const [sortBy, setSortBy] = useState<ResultsSortKey>(DEFAULT_RESULTS_SORT);
  const [searchQuery, setSearchQuery] = useState("");
  const query = usePredictorQuery({
    predictorExamId: state.predictorExamId,
    rank: state.rank,
    apiSeatType: state.apiSeatType,
    apiGender: state.apiGender,
    quota: state.quota,
    homeState: state.homeState,
    has_ews_certificate: state.has_ews_certificate,
    include_all: state.include_all,
    mhtCandidatureType: state.mhtCandidatureType,
    mhtCategory: state.mhtCategory,
    mhtLadiesSeatEligible: state.mhtLadiesSeatEligible,
    mhtHomeUniversity: state.mhtHomeUniversity,
    mhtTfwsEligible: state.mhtTfwsEligible,
    mhtPwdCategory: state.mhtPwdCategory,
    mhtOrphanCertificate: state.mhtOrphanCertificate,
    mhtMinorityCommunity: state.mhtMinorityCommunity,
    filters,
    sortBy,
    searchQuery,
  });
  const rankInputRef = useRef<RankInputHandle>(null);
  const initialUrlParamsRef = useRef<URLSearchParams | null | undefined>(
    undefined,
  );
  if (initialUrlParamsRef.current === undefined) {
    initialUrlParamsRef.current = captureInitialUrlParams();
  }
  const shareLinkAutoPredictDone = useRef(false);
  const hasResults =
    query.data?.resultMode === "server-paged"
      ? query.data !== null
      : (query.data?.programs.length ?? 0) > 0;

  useEffect(() => {
    if (!mhtCetEnabled && requestedState.exam === "mht-cet") {
      requestedState.setExam("jee-main");
    }
  }, [mhtCetEnabled, requestedState.exam, requestedState.setExam]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset filters when exam or counselling changes
  useEffect(() => {
    setFilters(EMPTY_RESULTS_FILTERS);
    setSortBy(
      state.predictorExamId === "mht-cet" ? "chance" : DEFAULT_RESULTS_SORT,
    );
    setSearchQuery("");
  }, [state.exam, state.counselling]);

  const onPredict = useCallback(async () => {
    const flushedRank = rankInputRef.current?.flush() ?? state.rank;
    const validationError = validatePredictorRank(
      flushedRank,
      state.predictorExamId,
    );
    if (validationError) {
      rankInputRef.current?.showValidationError(validationError);
      return;
    }

    const fromCache = await query.trigger(
      flushedRank,
      state.include_all ? { include_all: true } : undefined,
    );
    if (!fromCache && state.predictorExamId !== "mht-cet") {
      setFilters(EMPTY_RESULTS_FILTERS);
      setSortBy(DEFAULT_RESULTS_SORT);
      setSearchQuery("");
    }
  }, [query, state.rank, state.predictorExamId, state.include_all]);

  useEffect(() => {
    if (shareLinkAutoPredictDone.current) return;
    const initialParams = initialUrlParamsRef.current;
    if (
      !initialParams ||
      !shareLinkReadyToPredict(initialParams, mhtCetEnabled)
    ) {
      return;
    }

    shareLinkAutoPredictDone.current = true;
    void onPredict();
  }, [mhtCetEnabled, onPredict]);

  const contextValue = useMemo(
    () => ({
      state,
      query,
      onPredict,
      rankInputRef,
      filters,
      setFilters,
      sortBy,
      setSortBy,
      searchQuery,
      setSearchQuery,
      hasResults,
      mhtCetEnabled,
    }),
    [
      state,
      query,
      onPredict,
      filters,
      sortBy,
      searchQuery,
      hasResults,
      mhtCetEnabled,
    ],
  );

  return (
    <PredictorContext.Provider value={contextValue}>
      {children}
    </PredictorContext.Provider>
  );
}

export function usePredictor(): PredictorContextValue {
  const ctx = use(PredictorContext);
  if (!ctx) {
    throw new Error("usePredictor must be used within PredictorProvider");
  }
  return ctx;
}
