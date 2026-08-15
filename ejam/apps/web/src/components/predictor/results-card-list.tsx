"use client";

import { programKey } from "@/components/predictor/program-key";
import { ResultCard } from "@/components/predictor/result-card";
import { Button } from "@/components/ui/button";
import type { PredictorDisplayProgram } from "@/lib/predictor-adapters";
import { cn } from "@/lib/utils";

/** cap the enter stagger so long lists never wait on dozens of delays */
const MAX_STAGGERED_CARDS = 8;
const CARD_STAGGER_MS = 40;

interface ResultsCardListProps {
  rows: PredictorDisplayProgram[];
  selectedId: string | null;
  onSelect: (program: PredictorDisplayProgram) => void;
  className?: string;
}

export function ResultsCardList({
  rows,
  selectedId,
  onSelect,
  className,
}: ResultsCardListProps) {
  return (
    <ul className={cn("flex flex-col", className)}>
      {rows.map((row, index) => {
        const id = programKey(row);
        const delay =
          index < MAX_STAGGERED_CARDS ? `${index * CARD_STAGGER_MS}ms` : "0ms";

        return (
          <li key={id}>
            <ResultCard
              row={row}
              selected={id === selectedId}
              onSelect={onSelect}
              animationDelay={delay}
            />
          </li>
        );
      })}
    </ul>
  );
}

export function ResultsEmptyState({
  isFiltered,
  onClearFilters,
  hiddenByThreshold = 0,
  onShowLongShots,
}: {
  isFiltered: boolean;
  onClearFilters?: () => void;
  hiddenByThreshold?: number;
  onShowLongShots?: () => void;
}) {
  const hasHiddenLongShots = hiddenByThreshold > 0 && onShowLongShots;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-sm text-muted-foreground">
      <span className="text-pretty">
        {hasHiddenLongShots
          ? `${hiddenByThreshold.toLocaleString("en-IN")} lower-chance programs are hidden.`
          : isFiltered
            ? "No programs match the active filters."
            : "No eligible programs are available for this profile."}
      </span>
      {hasHiddenLongShots ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none border-border bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground dark:bg-transparent dark:hover:bg-transparent"
          onClick={onShowLongShots}
        >
          Show doesn't matter yaar
        </Button>
      ) : isFiltered && onClearFilters ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none border-border bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground dark:bg-transparent dark:hover:bg-transparent"
          onClick={onClearFilters}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
