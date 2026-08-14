import type {
  MhtCetPredictionMetadata,
  MhtCetProgramPrediction,
} from "./result-schema";
import type { MhtCetPredictorIndexRow, MhtCetProbabilityBand } from "./schema";

export function buildMhtCetPredictionMetadata(options: {
  indexRows: MhtCetPredictorIndexRow[];
  programs: MhtCetProgramPrediction[];
  totalMatching: number;
}): MhtCetPredictionMetadata {
  const indexMetadata = options.indexRows[0];
  if (!indexMetadata) throw new Error("MHT-CET predictor index is empty");
  const sourceYears = Array.from(
    new Set(
      options.indexRows.flatMap((row) =>
        row.years_of_data === 2
          ? [row.latest_year - 1, row.latest_year]
          : [row.latest_year],
      ),
    ),
  ).sort();
  const instituteTypeCounts = new Map<string, number>();
  const bandCounts: Record<MhtCetProbabilityBand, number> = {
    safe: 0,
    iffy: 0,
    delulu: 0,
    "doesnt-matter": 0,
  };
  for (const program of options.programs) {
    instituteTypeCounts.set(
      program.institute_type,
      (instituteTypeCounts.get(program.institute_type) ?? 0) + 1,
    );
    bandCounts[program.band] += 1;
  }
  return {
    model_id: indexMetadata.model_id,
    target_year: indexMetadata.target_year,
    rules_year: indexMetadata.rules_year,
    source_years: sourceYears,
    total_matching_offerings: options.totalMatching,
    displayed_offerings: options.programs.length,
    hidden_offerings: options.totalMatching - options.programs.length,
    warnings: [
      "MHT-CET estimates use two historical cycles; one-cycle and round-four rows use pooled uncertainty.",
      "Official conversion stages are evaluated independently for every round and candidate profile.",
      "Probabilities are empirical estimates, not official CAP allotment decisions.",
    ],
    pagination: {
      returned: options.programs.length,
      limit: null,
      next_cursor: null,
      has_more: false,
    },
    facets: {
      institute_types: Array.from(instituteTypeCounts, ([value, count]) => ({
        value,
        count,
      })).sort((left, right) => left.value.localeCompare(right.value)),
      bands: bandCounts,
    },
  };
}
