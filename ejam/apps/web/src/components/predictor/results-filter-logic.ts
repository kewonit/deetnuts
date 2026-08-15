import type { ProbabilityBand } from "@ejam/data/college-predictor";
import type { PredictorDisplayProgram } from "@/lib/predictor-adapters";

export interface ResultsFilterState {
  instituteTypes: Set<string>;
  bands: Set<ProbabilityBand>;
}

export const EMPTY_RESULTS_FILTERS: ResultsFilterState = {
  instituteTypes: new Set(),
  bands: new Set(),
};

export function applyResultsFilters(
  programs: PredictorDisplayProgram[],
  filters: ResultsFilterState,
  includeAll: boolean = true,
): PredictorDisplayProgram[] {
  return programs.filter((program) => {
    if (!includeAll && program.band === "doesnt-matter") {
      return false;
    }
    if (
      filters.instituteTypes.size > 0 &&
      !filters.instituteTypes.has(program.instituteType)
    ) {
      return false;
    }
    if (filters.bands.size > 0 && !filters.bands.has(program.band)) {
      return false;
    }
    return true;
  });
}
