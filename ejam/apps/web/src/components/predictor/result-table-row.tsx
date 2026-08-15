"use client";

import { ChevronRight } from "lucide-react";
import type { CSSProperties, KeyboardEvent } from "react";
import { formatInteger } from "@/components/formatter";
import { BandBadge } from "@/components/predictor/band-badge";
import { InstituteTypeBadge } from "@/components/predictor/institute-type-badge";
import { programKey } from "@/components/predictor/program-key";
import { RoundProbabilityBars } from "@/components/predictor/round-probability-bars";
import { TableCell, TableRow } from "@/components/ui/table";
import type { PredictorDisplayProgram } from "@/lib/predictor-adapters";
import { cn } from "@/lib/utils";

export const RESULT_TABLE_COLUMNS =
  "minmax(15rem,1.15fr) minmax(16rem,1.25fr) minmax(6rem,.55fr) minmax(6rem,.55fr) minmax(7rem,.55fr) minmax(7rem,.6fr) 2.5rem";

export function ResultTableRow({
  row,
  selectedId,
  onSelect,
  style,
  virtual,
  ariaRowIndex,
}: {
  row: PredictorDisplayProgram;
  selectedId: string | null;
  onSelect: (program: PredictorDisplayProgram) => void;
  style?: CSSProperties;
  virtual?: boolean;
  ariaRowIndex?: number;
}) {
  const id = programKey(row);
  const isSelected = id === selectedId;
  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(row);
    }
  };

  return (
    <TableRow
      data-state={isSelected ? "selected" : undefined}
      tabIndex={0}
      role={virtual ? "row" : "button"}
      aria-rowindex={ariaRowIndex}
      aria-label={`${row.instituteName}, ${row.programName}`}
      onClick={() => onSelect(row)}
      onKeyDown={handleKeyDown}
      style={
        virtual
          ? {
              ...style,
              display: "grid",
              gridTemplateColumns: RESULT_TABLE_COLUMNS,
            }
          : style
      }
      className={cn(
        "h-12 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        virtual && "absolute top-0 left-0 w-full",
      )}
    >
      <TableCell className="min-w-0 overflow-hidden ps-6">
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <InstituteTypeBadge type={row.instituteType} />
          <span className="min-w-0 flex-1 truncate font-medium">
            {row.instituteName}
          </span>
        </div>
      </TableCell>
      <TableCell className="min-w-0 overflow-hidden truncate">
        <span>{row.programName}</span>
        {row.degree ? (
          <span className="ms-1.5 text-[10px] text-muted-foreground uppercase">
            {row.degree}
          </span>
        ) : null}
        {row.choiceCode ? (
          <span className="ms-1.5 text-[10px] text-muted-foreground">
            {row.choiceCode}
          </span>
        ) : null}
      </TableCell>
      <TableCell className="min-w-24">
        <BandBadge band={row.band} />
      </TableCell>
      <TableCell className="min-w-24">
        <RoundProbabilityBars
          className="shrink-0"
          roundProbs={row.roundProbabilities}
          overallProbability={row.overallProbability}
          roundDetails={row.roundDetails}
          roundAvailability={row.roundAvailability}
          roundCount={row.roundCount}
        />
      </TableCell>
      <TableCell className="pe-6 whitespace-nowrap tabular-nums">
        {formatInteger(row.predictedClosingRank)}
      </TableCell>
      <TableCell className="min-w-28 truncate text-muted-foreground">
        {row.seatPoolLabel}
      </TableCell>
      <TableCell className="pe-6 text-right">
        <ChevronRight
          className={cn(
            "size-4 text-muted-foreground/70 transition-transform duration-150 ease-out",
            isSelected && "translate-x-0.5 text-foreground",
          )}
          aria-hidden
        />
      </TableCell>
    </TableRow>
  );
}
