/**
 * result shell shared by the unchanged JEE renderer and paged MHT renderer
 **/

"use client";

import type { PredictionProvenance } from "@ejam/data";
import { useMemo } from "react";
import {
  resultsTableScrollClass,
  stickyGlassTableHeaderClass,
} from "@/components/app-layout";
import { DataVersionFooter } from "@/components/predictor/data-version-footer";
import { MhtCetVirtualResults } from "@/components/predictor/mht-cet/virtual-results";
import { ResultTableRow } from "@/components/predictor/result-table-row";
import {
  ResultsCardList,
  ResultsEmptyState,
} from "@/components/predictor/results-card-list";
import { ResultsCardShell } from "@/components/predictor/results-card-shell";
import { ResultsSearch } from "@/components/predictor/results-search";
import { ResultsSort } from "@/components/predictor/results-sort";
import type { ResultsSortKey } from "@/components/predictor/results-sort-logic";
import { DigitGroup } from "@/components/transitions/digit-group";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PredictorDisplayProgram } from "@/lib/predictor-adapters";

interface ResultsTableProps {
  rows: PredictorDisplayProgram[];
  allRows: PredictorDisplayProgram[];
  totalRows?: number;
  serverManaged?: boolean;
  isUpdating?: boolean;
  resultKey?: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  nextPageError?: string | null;
  onLoadMore?: () => void;
  sortBy: ResultsSortKey;
  onSortChange: (next: ResultsSortKey) => void;
  searchQuery: string;
  onSearchChange: (next: string) => void;
  selectedId: string | null;
  onSelect: (program: PredictorDisplayProgram) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  hiddenRows?: number;
  onShowLongShots?: () => void;
  provenance?: PredictionProvenance | null;
  supportedSortModes?: readonly ResultsSortKey[];
  warnings?: string[];
}

export function ResultsTable({
  rows,
  allRows,
  totalRows = allRows.length,
  serverManaged = false,
  isUpdating = false,
  resultKey = "",
  hasNextPage = false,
  isFetchingNextPage = false,
  nextPageError = null,
  onLoadMore,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  selectedId,
  onSelect,
  onClearFilters,
  hasActiveFilters,
  hiddenRows = 0,
  onShowLongShots,
  provenance,
  supportedSortModes,
  warnings = [],
}: ResultsTableProps) {
  const isFiltered =
    hasActiveFilters ??
    (serverManaged
      ? rows.length === 0 || totalRows !== allRows.length
      : rows.length !== allRows.length);
  const headerExtra = useMemo(
    () => (
      <span className="shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
        {serverManaged ? (
          <>
            <span>{rows.length.toLocaleString("en-IN")}</span>
            <span> of </span>
            <span>{totalRows.toLocaleString("en-IN")}</span>
            <span> programs</span>
          </>
        ) : isFiltered ? (
          <>
            <DigitGroup value={String(rows.length)} />
            <span> of </span>
            <DigitGroup value={String(allRows.length)} />
          </>
        ) : (
          <>
            <DigitGroup value={String(rows.length)} />
            <span> program{rows.length === 1 ? "" : "s"}</span>
          </>
        )}
      </span>
    ),
    [rows.length, allRows.length, totalRows, isFiltered, serverManaged],
  );

  return (
    <ResultsCardShell
      contentClassName={
        serverManaged
          ? "relative min-h-0 flex-1 overflow-hidden"
          : resultsTableScrollClass
      }
      toolbar={
        <div className="flex min-w-0 flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
          <ResultsSort
            sortBy={sortBy}
            onChange={onSortChange}
            supportedModes={supportedSortModes}
            compactMobile={serverManaged}
          />
          <div className="w-full sm:w-auto">
            <ResultsSearch
              value={searchQuery}
              onChange={onSearchChange}
              maxLength={serverManaged ? 120 : undefined}
            />
          </div>
        </div>
      }
      footer={<DataVersionFooter provenance={provenance} />}
      headerExtra={headerExtra}
    >
      {warnings.length > 0 ? (
        <div
          role="status"
          className="shrink-0 border-b border-border bg-muted/30 px-4 py-2 text-xs leading-relaxed text-muted-foreground"
        >
          {warnings.join(" ")}
        </div>
      ) : null}
      {rows.length === 0 ? (
        <ResultsEmptyState
          isFiltered={isFiltered}
          onClearFilters={onClearFilters}
          hiddenByThreshold={hiddenRows}
          onShowLongShots={onShowLongShots}
        />
      ) : serverManaged ? (
        <MhtCetVirtualResults
          rows={rows}
          total={totalRows}
          selectedId={selectedId}
          resultKey={resultKey}
          hasMore={hasNextPage}
          loadingMore={isFetchingNextPage}
          pageError={nextPageError}
          onSelect={onSelect}
          onLoadMore={() => onLoadMore?.()}
        />
      ) : (
        <JeeResults rows={rows} selectedId={selectedId} onSelect={onSelect} />
      )}
      {isUpdating ? (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-x-0 bottom-0 z-20 flex h-10 items-center justify-center border-t border-border bg-background/90 text-xs text-muted-foreground backdrop-blur-sm"
        >
          Updating results…
        </div>
      ) : null}
    </ResultsCardShell>
  );
}

function JeeResults({
  rows,
  selectedId,
  onSelect,
}: {
  rows: PredictorDisplayProgram[];
  selectedId: string | null;
  onSelect: (program: PredictorDisplayProgram) => void;
}) {
  return (
    <>
      <ResultsCardList
        className="lg:hidden"
        rows={rows}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <div className="hidden lg:contents">
        <Table>
          <TableHeader className={stickyGlassTableHeaderClass}>
            <TableRow className="hover:bg-transparent">
              <TableHead className="ps-6">Institute</TableHead>
              <TableHead>Program</TableHead>
              <TableHead className="min-w-24">Band</TableHead>
              <TableHead className="min-w-24">Chance</TableHead>
              <TableHead className="w-0 pe-6 whitespace-nowrap tabular-nums">
                Closing rank
              </TableHead>
              <TableHead className="min-w-[7rem]">Seat pool</TableHead>
              <TableHead className="w-10 pe-6 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:first-child]:border-t-0">
            {rows.map((row) => (
              <ResultTableRow
                key={row.key}
                row={row}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
