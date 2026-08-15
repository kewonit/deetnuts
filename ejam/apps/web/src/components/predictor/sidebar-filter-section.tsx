"use client";

import type { ProbabilityBand } from "@ejam/data/college-predictor";
import { SlidersHorizontal } from "lucide-react";
import type { ResultsFilterState } from "@/components/predictor/results-filter-logic";
import { ResultsFilters } from "@/components/predictor/results-filters";
import type { ExamType } from "@/hooks/use-predictor-state";
import type { PredictorDisplayProgram } from "@/lib/predictor-adapters";

interface SidebarFilterSectionProps {
  exam: ExamType;
  programs: PredictorDisplayProgram[];
  filters: ResultsFilterState;
  onChange: (next: ResultsFilterState) => void;
  includeAll: boolean;
  onToggleLongShots: () => void;
  instituteTypeFacets?: Array<{ value: string; count: number }>;
  bandFacets?: Record<ProbabilityBand, number>;
}

export function SidebarFilterSection({
  exam,
  programs,
  filters,
  onChange,
  includeAll,
  onToggleLongShots,
  instituteTypeFacets,
  bandFacets,
}: SidebarFilterSectionProps) {
  const activeCount =
    filters.instituteTypes.size + filters.bands.size + (includeAll ? 1 : 0);

  return (
    <section
      className="flex flex-col gap-3 border-t border-border px-2 py-3"
      aria-labelledby="sidebar-filters-heading"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <SlidersHorizontal
            className="size-3.5 shrink-0 text-foreground"
            aria-hidden
          />
          <h2
            id="sidebar-filters-heading"
            className="text-xs font-medium text-foreground"
          >
            Filters
          </h2>
        </div>
        {activeCount > 0 ? (
          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
            {activeCount} active
          </span>
        ) : null}
      </div>

      <ResultsFilters
        exam={exam}
        programs={programs}
        filters={filters}
        onChange={onChange}
        enabled
        includeAll={includeAll}
        onToggleLongShots={onToggleLongShots}
        instituteTypeFacets={instituteTypeFacets}
        bandFacets={bandFacets}
      />
    </section>
  );
}
