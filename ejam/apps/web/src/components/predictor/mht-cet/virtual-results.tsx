"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import { ResultsLoadMore } from "@/components/predictor/mht-cet/pagination-controls";
import { programKey } from "@/components/predictor/program-key";
import { ResultCard } from "@/components/predictor/result-card";
import {
  RESULT_TABLE_COLUMNS,
  ResultTableRow,
} from "@/components/predictor/result-table-row";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PredictorDisplayProgram } from "@/lib/predictor-adapters";

interface MhtCetVirtualResultsProps {
  rows: PredictorDisplayProgram[];
  total: number;
  selectedId: string | null;
  resultKey: string;
  hasMore: boolean;
  loadingMore: boolean;
  pageError: string | null;
  onSelect: (program: PredictorDisplayProgram) => void;
  onLoadMore: () => void;
}

export function MhtCetVirtualResults(props: MhtCetVirtualResultsProps) {
  return (
    <>
      <MhtVirtualCards {...props} />
      <MhtVirtualTable {...props} />
    </>
  );
}

function MhtVirtualTable({
  rows,
  total,
  selectedId,
  resultKey,
  hasMore,
  loadingMore,
  pageError,
  onSelect,
  onLoadMore,
}: MhtCetVirtualResultsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 48,
    getItemKey: (index) => programKey(rows[index]),
    overscan: 10,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: result identity resets the scroll position
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [resultKey]);

  return (
    <div
      ref={scrollRef}
      className="theme-scrollbar hidden min-h-0 flex-1 overflow-auto lg:block"
      aria-busy={loadingMore}
    >
      <table
        className="w-full min-w-[72rem] caption-bottom text-sm"
        aria-rowcount={total}
      >
        <TableHeader className="sticky top-0 z-10 grid bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50">
          <TableRow
            className="grid hover:bg-transparent"
            style={{ gridTemplateColumns: RESULT_TABLE_COLUMNS }}
          >
            <TableHead className="ps-6">Institute</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>Band</TableHead>
            <TableHead>Chance</TableHead>
            <TableHead>Closing rank</TableHead>
            <TableHead>Seat pool</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <tbody
          className="relative grid [&_tr:first-child]:border-t-0"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <ResultTableRow
                key={virtualRow.key}
                row={row}
                selectedId={selectedId}
                onSelect={onSelect}
                virtual
                ariaRowIndex={virtualRow.index + 1}
                style={{
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              />
            );
          })}
        </tbody>
      </table>
      <ResultsLoadMore
        loaded={rows.length}
        total={total}
        hasMore={hasMore}
        loading={loadingMore}
        error={pageError}
        onLoadMore={onLoadMore}
      />
    </div>
  );
}

function MhtVirtualCards({
  rows,
  total,
  selectedId,
  resultKey,
  hasMore,
  loadingMore,
  pageError,
  onSelect,
  onLoadMore,
}: MhtCetVirtualResultsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 132,
    getItemKey: (index) => programKey(rows[index]),
    overscan: 10,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: result identity resets scroll and measurements
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    virtualizer.measure();
  }, [resultKey, virtualizer]);

  return (
    <div
      ref={scrollRef}
      className="theme-scrollbar min-h-0 flex-1 overflow-y-auto lg:hidden"
      aria-busy={loadingMore}
    >
      <ul
        className="relative w-full"
        aria-label="MHT-CET prediction results"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <li
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              aria-setsize={total}
              aria-posinset={virtualRow.index + 1}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <ResultCard
                row={row}
                selected={programKey(row) === selectedId}
                onSelect={onSelect}
              />
            </li>
          );
        })}
      </ul>
      <ResultsLoadMore
        loaded={rows.length}
        total={total}
        hasMore={hasMore}
        loading={loadingMore}
        error={pageError}
        onLoadMore={onLoadMore}
      />
    </div>
  );
}
