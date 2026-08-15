import type { CollegePredictorFilters } from "@ejam/data/college-predictor";
import {
  applyBalancedRanking,
  branchFilterActive,
  instituteMetaFromPrograms,
} from "@ejam/data/college-predictor";
import {
  jeeProgramKey,
  type PredictorDisplayProgram,
} from "@/lib/predictor-adapters";

export function applyJeeBalancedSort(
  programs: PredictorDisplayProgram[],
  filters?: CollegePredictorFilters,
): PredictorDisplayProgram[] {
  const byKey = new Map<string, PredictorDisplayProgram>();
  const jeePrograms = programs.map((display) => {
    if (!display.jeeProgram) {
      throw new Error("balanced JEE sort received a non-JEE display program");
    }
    const key = jeeProgramKey(display.jeeProgram);
    if (byKey.has(key)) {
      throw new Error(
        `balanced JEE sort received duplicate program key ${key}`,
      );
    }
    byKey.set(key, display);
    return display.jeeProgram;
  });

  return applyBalancedRanking(jeePrograms, {
    instituteMeta: instituteMetaFromPrograms(jeePrograms),
    branchFilterActive: branchFilterActive(filters),
  }).map((program) => {
    const key = jeeProgramKey(program);
    const display = byKey.get(key);
    if (!display) {
      throw new Error(`balanced JEE result lost display program ${key}`);
    }
    return display;
  });
}
