/**
 * Applies balanced ranking scores to a prediction result.
 */

import type {
  CollegePredictionResult,
  CollegePredictorFilters,
  ProgramPrediction,
} from "@ejam/data/college-predictor";
import {
  applyBalancedRanking,
  branchFilterActive,
  DEFAULT_PROBABILITY_DISPLAY_THRESHOLD,
  groupProgramsByBand,
  type InstituteRankingMeta,
} from "@ejam/data/college-predictor";
import type { ServerCacheEntry } from "./predictor-cache";

export function finalizePredictionResult(
  result: CollegePredictionResult,
  filters: CollegePredictorFilters | undefined,
  instituteNirf: Map<string, number | null | undefined>,
): CollegePredictionResult {
  const instituteMeta = new Map<string, InstituteRankingMeta>();
  for (const [id, nirf] of instituteNirf) {
    instituteMeta.set(id, { nirf_rank: nirf });
  }

  const programs = applyBalancedRanking(result.programs, {
    instituteMeta,
    branchFilterActive: branchFilterActive(filters),
  });
  return {
    ...result,
    programs,
    grouped_by_band: groupProgramsByBand(programs),
  };
}

export function resultFromRankedPrograms(
  programs: ProgramPrediction[],
  filters: CollegePredictorFilters | undefined,
): CollegePredictionResult {
  return {
    programs,
    metadata: {
      total_matching: programs.length,
      total_above_threshold: programs.length,
      threshold_used: DEFAULT_PROBABILITY_DISPLAY_THRESHOLD,
      hidden_count: 0,
      total_matching_programs: programs.length,
      displayed_programs: programs.length,
      hidden_programs: 0,
      active_filters: filters ?? {},
    },
    grouped_by_band: groupProgramsByBand(programs),
  };
}

export function resultFromCacheEntry(
  cached: ServerCacheEntry,
  filters: CollegePredictorFilters | undefined,
): CollegePredictionResult {
  return {
    programs: cached.programs,
    metadata: {
      ...cached.metadata,
      active_filters: filters ?? cached.metadata.active_filters,
    },
    grouped_by_band: groupProgramsByBand(cached.programs),
    ...(cached.ews_comparison ? { ews_comparison: cached.ews_comparison } : {}),
  };
}
