"use client";

import { formatInteger } from "@/components/formatter";
import { BandBadge } from "@/components/predictor/band-badge";
import { InstituteTypeBadge } from "@/components/predictor/institute-type-badge";
import { RoundProbabilityBars } from "@/components/predictor/round-probability-bars";
import type { PredictorDisplayProgram } from "@/lib/predictor-adapters";
import { cn } from "@/lib/utils";

export function ResultCard({
  row,
  selected,
  onSelect,
  animationDelay,
}: {
  row: PredictorDisplayProgram;
  selected: boolean;
  onSelect: (program: PredictorDisplayProgram) => void;
  animationDelay?: string;
}) {
  return (
    <button
      type="button"
      data-state={selected ? "selected" : undefined}
      aria-label={`${row.instituteName}, ${row.programName}`}
      onClick={() => onSelect(row)}
      style={animationDelay ? { animationDelay } : undefined}
      className={cn(
        "results-card-enter flex w-full flex-col gap-2 border-b border-border px-4 py-3.5 text-left",
        "transition-colors hover:bg-muted/50 active:bg-muted data-[state=selected]:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <InstituteTypeBadge type={row.instituteType} />
          <span className="truncate font-medium">{row.instituteName}</span>
        </div>
        <BandBadge band={row.band} />
      </div>

      <div className="min-w-0 text-sm text-muted-foreground">
        <span className="line-clamp-1">
          {row.programName}
          {row.degree ? (
            <span className="ms-1.5 text-[10px] uppercase text-muted-foreground/80">
              {row.degree}
            </span>
          ) : null}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3 pt-0.5">
        <RoundProbabilityBars
          interactive={false}
          roundProbs={row.roundProbabilities}
          overallProbability={row.overallProbability}
          roundDetails={row.roundDetails}
          roundAvailability={row.roundAvailability}
          roundCount={row.roundCount}
        />
        <div className="flex shrink-0 flex-col items-end leading-tight">
          <span className="text-sm font-medium tabular-nums text-foreground">
            {formatInteger(row.predictedClosingRank)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {row.seatPoolLabel}
          </span>
        </div>
      </div>
    </button>
  );
}
