/**
 * desktop predictor workspace — results table and selected-program drawer
 **/

"use client";

import { useEffect, useState } from "react";
import {
  countClientHiddenLongShots,
  hasOnlyClientHiddenLongShots,
  withClientHiddenLongShotMetadata,
} from "@/components/predictor/long-shot-visibility";
import { usePredictor } from "@/components/predictor/predictor-context";
import { programKey } from "@/components/predictor/program-key";
import {
  applyResultsFilters,
  EMPTY_RESULTS_FILTERS,
} from "@/components/predictor/results-filter-logic";
import { applyResultsSearch } from "@/components/predictor/results-search-logic";
import {
  applyResultsSort,
  type ResultsSortKey,
} from "@/components/predictor/results-sort-logic";
import { useSidebar } from "@/components/ui/sidebar";
import {
  type PredictorDisplayProgram,
  supportedSortModes,
} from "@/lib/predictor-adapters";
import { CollegeDetailSheet } from "./college-detail-sheet";
import { EmptyState, ErrorState, LoadingState } from "./empty-state";
import { ResultsTable } from "./results-table";

export function Dashboard() {
  const {
    state,
    query,
    rankInputRef,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
  } = usePredictor();
  const { isMobile, setOpenMobile } = useSidebar();
  const [selected, setSelected] = useState<PredictorDisplayProgram | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const programs = query.data?.programs ?? [];
  const serverManaged = query.data?.resultMode === "server-paged";
  const clientHiddenLongShots = serverManaged
    ? 0
    : countClientHiddenLongShots(programs, state.include_all);
  const hasResults =
    serverManaged ||
    (programs.length > 0 &&
      !hasOnlyClientHiddenLongShots(programs, state.include_all));
  const metadata = withClientHiddenLongShotMetadata(
    query.data?.jeeResult?.metadata,
    clientHiddenLongShots,
  );
  const filteredPrograms = serverManaged
    ? programs
    : applyResultsSort(
        applyResultsSearch(
          applyResultsFilters(programs, filters, state.include_all),
          searchQuery,
        ),
        sortBy,
        query.data?.jeeResult?.metadata.active_filters,
      );
  const hasActiveResultControls =
    searchQuery.trim().length > 0 ||
    filters.instituteTypes.size > 0 ||
    filters.bands.size > 0;

  const selectedId = selected ? programKey(selected) : null;

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset drawer when the result identity changes
  useEffect(() => {
    setSheetOpen(false);
    setSelected(null);
  }, [state.exam, state.counselling, query.resultKey]);

  const middle = renderMiddle({
    isLoading: query.isLoading,
    error: query.error,
    hasResults,
    hasPredicted: query.data !== null,
    exam: state.exam,
    metadata,
    includeAll: state.include_all,
    onShowLongShots: () => {
      state.setIncludeAll(true);
      const flushedRank = rankInputRef.current?.flush() ?? state.rank;
      void query.trigger(flushedRank, { include_all: true });
    },
    onOpenSetup:
      isMobile && query.data === null ? () => setOpenMobile(true) : undefined,
    programs,
    filteredPrograms,
    sortBy,
    onSortChange: setSortBy,
    searchQuery,
    onSearchChange: setSearchQuery,
    selectedId,
    provenance: query.provenance,
    warnings: query.data?.metadata.warnings ?? [],
    serverManaged,
    totalRows: query.data?.metadata.displayedPrograms ?? programs.length,
    isUpdating: query.isUpdating,
    resultKey: query.resultKey,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    nextPageError: query.nextPageError,
    onLoadMore: () => {
      void query.loadMore();
    },
    supportedSortModes: supportedSortModes(state.predictorExamId),
    onSelect: (p) => {
      setSelected(p);
      setSheetOpen(true);
    },
    onClearFilters: () => {
      setFilters(EMPTY_RESULTS_FILTERS);
      setSearchQuery("");
    },
    hasActiveFilters: hasActiveResultControls,
    hiddenRows: query.data?.metadata.hiddenPrograms ?? 0,
  });

  return (
    <div className="h-[calc(100dvh-7rem)] min-h-0 w-full min-w-0 bg-border p-px">
      <div className="h-full min-h-0 min-w-0">{middle}</div>

      <CollegeDetailSheet
        program={selected}
        open={sheetOpen}
        onOpenChange={(next) => {
          setSheetOpen(next);
          if (!next) {
            setTimeout(() => setSelected(null), 150);
          }
        }}
      />
    </div>
  );
}

function renderMiddle({
  isLoading,
  error,
  hasResults,
  hasPredicted,
  exam,
  metadata,
  includeAll,
  onShowLongShots,
  onOpenSetup,
  programs,
  filteredPrograms,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  selectedId,
  provenance,
  onSelect,
  onClearFilters,
  warnings,
  supportedSortModes,
  serverManaged,
  totalRows,
  isUpdating,
  resultKey,
  hasNextPage,
  isFetchingNextPage,
  nextPageError,
  onLoadMore,
  hasActiveFilters,
  hiddenRows,
}: {
  isLoading: boolean;
  error: string | null;
  hasResults: boolean;
  hasPredicted: boolean;
  exam: import("@/hooks/use-predictor-state").ExamType;
  metadata?: import("@ejam/data/college-predictor").CollegePredictionResult["metadata"];
  includeAll: boolean;
  onShowLongShots: () => void;
  onOpenSetup?: () => void;
  programs: PredictorDisplayProgram[];
  filteredPrograms: PredictorDisplayProgram[];
  sortBy: ResultsSortKey;
  onSortChange: (next: ResultsSortKey) => void;
  searchQuery: string;
  onSearchChange: (next: string) => void;
  selectedId: string | null;
  provenance: import("@ejam/data").PredictionProvenance | null;
  onSelect: (p: PredictorDisplayProgram) => void;
  onClearFilters: () => void;
  warnings: string[];
  supportedSortModes: readonly ResultsSortKey[];
  serverManaged: boolean;
  totalRows: number;
  isUpdating: boolean;
  resultKey: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  nextPageError: string | null;
  onLoadMore: () => void;
  hasActiveFilters: boolean;
  hiddenRows: number;
}) {
  if (error) return <ErrorState message={error} provenance={provenance} />;
  if (!hasResults) {
    if (isLoading) return <LoadingState provenance={provenance} />;
    return (
      <EmptyState
        exam={exam}
        hasPredicted={hasPredicted}
        metadata={metadata}
        includeAll={includeAll}
        onShowLongShots={onShowLongShots}
        onOpenSetup={onOpenSetup}
        provenance={provenance}
      />
    );
  }

  return (
    <ResultsTable
      rows={filteredPrograms}
      allRows={programs}
      sortBy={sortBy}
      onSortChange={onSortChange}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      selectedId={selectedId}
      onSelect={onSelect}
      onClearFilters={onClearFilters}
      hasActiveFilters={hasActiveFilters}
      hiddenRows={includeAll ? 0 : hiddenRows}
      onShowLongShots={onShowLongShots}
      provenance={provenance}
      warnings={warnings}
      supportedSortModes={supportedSortModes}
      serverManaged={serverManaged}
      totalRows={totalRows}
      isUpdating={isUpdating}
      resultKey={resultKey}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      nextPageError={nextPageError}
      onLoadMore={onLoadMore}
    />
  );
}
