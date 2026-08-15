import type { CollegePredictorFilters } from "@ejam/data/college-predictor";
import type { PredictorDisplayProgram } from "@/lib/predictor-adapters";
import { applyJeeBalancedSort } from "./jee/balanced-sort";

export type ResultsSortKey =
  | "balanced"
  | "chance"
  | "closing-rank"
  | "institute";

export const DEFAULT_RESULTS_SORT: ResultsSortKey = "balanced";

export function applyResultsSort(
  programs: PredictorDisplayProgram[],
  sortBy: ResultsSortKey,
  apiFilters?: CollegePredictorFilters,
): PredictorDisplayProgram[] {
  const sorted = [...programs];

  switch (sortBy) {
    case "balanced":
      if (sorted.some((program) => !program.jeeProgram)) {
        return applyResultsSort(sorted, "chance", apiFilters);
      }
      return applyJeeBalancedSort(sorted, apiFilters);
    case "closing-rank":
      sorted.sort((a, b) => {
        const rank = a.predictedClosingRank - b.predictedClosingRank;
        return rank !== 0 ? rank : a.key.localeCompare(b.key);
      });
      return sorted;
    case "institute":
      sorted.sort((a, b) => {
        let cmp = a.instituteName.localeCompare(b.instituteName);
        if (cmp !== 0) return cmp;
        cmp = a.programName.localeCompare(b.programName);
        return cmp !== 0 ? cmp : a.key.localeCompare(b.key);
      });
      break;
    case "chance":
      sorted.sort((a, b) => {
        const probability = b.overallProbability - a.overallProbability;
        if (probability !== 0) return probability;
        const rank = a.predictedClosingRank - b.predictedClosingRank;
        return rank !== 0 ? rank : a.key.localeCompare(b.key);
      });
      return sorted;
  }

  return sorted;
}
