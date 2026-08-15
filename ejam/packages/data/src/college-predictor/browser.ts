/** Browser-safe college predictor utilities and contracts. */

export {
  applyBalancedRanking,
  branchFilterActive,
  computeBalancedScore,
  computeBranchScore,
  computeInstituteScore,
  instituteMetaFromPrograms,
  sortByBalancedScore,
} from "./balanced-ranking";
export type {
  BalancedRankingOptions,
  InstituteRankingMeta,
} from "./balanced-ranking";
export type {
  CollegePredictionResult,
  CollegePredictorFilters,
  CollegePredictorIndexRow,
  ProbabilityBand,
  ProgramPrediction,
} from "./engine";
export {
  applyCollegePredictorFilters,
  classifyBand,
  computeProbability,
  DEFAULT_PROBABILITY_DISPLAY_THRESHOLD,
  DELULU_BAND_MIN_PROBABILITY,
  groupProgramsByBand,
  normalCDF,
  predictPrograms,
  sortByChance,
  sortByClosingRank,
} from "./engine";
export type { CollegePredictorUrlInput } from "./url-params";
export {
  buildCollegePredictorSharePath,
  decodeCollegePredictorUrlParams,
  encodeCollegePredictorUrlParams,
} from "./url-params";
