"use client";

import type { ProbabilityBand } from "@ejam/data/college-predictor";
import { FilterChip, FilterGroup } from "@/components/predictor/filter-chips";
import type { ResultsFilterState } from "@/components/predictor/results-filter-logic";
import type { ExamType } from "@/hooks/use-predictor-state";
import { isJeeMainCounselling } from "@/hooks/use-predictor-state";
import { BAND_FILTER_OPTIONS } from "@/lib/bands";
import type { PredictorDisplayProgram } from "@/lib/predictor-adapters";
import { deferAfterPress, pressableClass } from "@/lib/pressable";
import { cn } from "@/lib/utils";

const JEE_MAIN_INSTITUTE_ORDER = ["NIT", "IIIT", "CFI"] as const;

function singleActiveSlidingIndex<T>(
  items: readonly T[],
  isActive: (item: T) => boolean,
): number | null {
  let found = -1;
  let count = 0;

  for (let i = 0; i < items.length; i++) {
    if (!isActive(items[i])) continue;
    count += 1;
    found = i;
    if (count > 1) return null;
  }

  return count === 1 ? found : null;
}

function availableInstituteTypes(
  programs: PredictorDisplayProgram[],
  exam: ExamType,
): string[] {
  const present = new Set(programs.map((p) => p.instituteType));
  if (isJeeMainCounselling(exam)) {
    return JEE_MAIN_INSTITUTE_ORDER.filter((type) => present.has(type));
  }
  return Array.from(present).sort();
}

interface ResultsFiltersProps {
  exam: ExamType;
  programs: PredictorDisplayProgram[];
  filters: ResultsFilterState;
  onChange: (next: ResultsFilterState) => void;
  enabled: boolean;
  includeAll: boolean;
  onToggleLongShots: () => void;
  instituteTypeFacets?: Array<{ value: string; count: number }>;
  bandFacets?: Record<ProbabilityBand, number>;
}

export function ResultsFilters({
  exam,
  programs,
  filters,
  onChange,
  enabled,
  includeAll,
  onToggleLongShots,
  instituteTypeFacets,
  bandFacets,
}: ResultsFiltersProps) {
  const instituteFacetCounts = new Map(
    instituteTypeFacets?.map((facet) => [facet.value, facet.count]),
  );
  const instituteTypes = instituteTypeFacets
    ? Array.from(
        new Set([
          ...instituteTypeFacets.map((facet) => facet.value),
          ...filters.instituteTypes,
        ]),
      ).sort()
    : availableInstituteTypes(programs, exam);
  const showInstituteGroup = instituteTypes.length > 0;

  function toggleInstitute(type: string) {
    const next = new Set(filters.instituteTypes);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    onChange({ ...filters, instituteTypes: next });
  }

  function toggleBand(band: ProbabilityBand) {
    const next = new Set(filters.bands);
    if (next.has(band)) next.delete(band);
    else next.add(band);
    onChange({ ...filters, bands: next });
  }

  const instituteSlidingIndex = singleActiveSlidingIndex(
    instituteTypes,
    (type) => filters.instituteTypes.has(type),
  );
  const chanceSlidingIndex = singleActiveSlidingIndex(
    BAND_FILTER_OPTIONS,
    (option) => filters.bands.has(option.id),
  );

  const instituteGroup = showInstituteGroup ? (
    <FilterGroup
      label="Institute"
      vertical
      grid={2}
      slidingIndex={instituteSlidingIndex}
    >
      {instituteTypes.map((type) => (
        <FilterChip
          key={type}
          label={
            instituteTypeFacets
              ? `${type} · ${instituteFacetCounts.get(type) ?? 0}`
              : type
          }
          active={filters.instituteTypes.has(type)}
          disabled={
            !enabled ||
            (instituteTypeFacets !== undefined &&
              (instituteFacetCounts.get(type) ?? 0) === 0 &&
              !filters.instituteTypes.has(type))
          }
          fullWidth
          onClick={() => toggleInstitute(type)}
        />
      ))}
    </FilterGroup>
  ) : null;

  const chanceGroup = (
    <FilterGroup
      label="Chance"
      vertical
      grid={2}
      slidingIndex={chanceSlidingIndex}
    >
      {BAND_FILTER_OPTIONS.map(({ id, label, color }) => (
        <FilterChip
          key={id}
          label={bandFacets ? `${label} · ${bandFacets[id]}` : label}
          active={filters.bands.has(id)}
          disabled={
            !enabled ||
            (bandFacets !== undefined &&
              bandFacets[id] === 0 &&
              !filters.bands.has(id))
          }
          fullWidth
          accentColor={color}
          onClick={() => toggleBand(id)}
        />
      ))}
    </FilterGroup>
  );

  const longShotsGroup = (
    <fieldset className="min-w-0 border-0 p-0">
      <div className="mb-1.5 flex items-center justify-between">
        <legend className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Doesn't matter yaar
        </legend>
      </div>
      <div className="sliding-toggle-track" data-gap="1">
        <span
          aria-hidden
          className="sliding-toggle-indicator"
          data-cols="2"
          data-gap="1"
          data-index={includeAll ? "0" : "1"}
        />
        <div className="sliding-toggle-grid grid grid-cols-2">
          <button
            type="button"
            aria-pressed={includeAll}
            disabled={!enabled}
            onClick={() => {
              if (enabled && !includeAll) deferAfterPress(onToggleLongShots);
            }}
            className={cn(
              "sliding-toggle-tile flex h-8 items-center justify-center rounded-none text-xs font-medium text-muted-foreground outline-none transition-colors",
              pressableClass,
              enabled && "hover:text-foreground",
              "focus-visible:ring-3 focus-visible:ring-ring/50",
              includeAll && "text-foreground",
              !enabled && "cursor-not-allowed opacity-40 grayscale",
            )}
          >
            Show
          </button>
          <button
            type="button"
            aria-pressed={!includeAll}
            disabled={!enabled}
            onClick={() => {
              if (enabled && includeAll) deferAfterPress(onToggleLongShots);
            }}
            className={cn(
              "sliding-toggle-tile flex h-8 items-center justify-center rounded-none text-xs font-medium text-muted-foreground outline-none transition-colors",
              pressableClass,
              enabled && "hover:text-foreground",
              "focus-visible:ring-3 focus-visible:ring-ring/50",
              !includeAll && "text-foreground",
              !enabled && "cursor-not-allowed opacity-40 grayscale",
            )}
          >
            Hide
          </button>
        </div>
      </div>
    </fieldset>
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        !enabled && "pointer-events-none opacity-50",
      )}
      aria-disabled={!enabled}
    >
      {instituteGroup}
      {chanceGroup}
      {longShotsGroup}
    </div>
  );
}
