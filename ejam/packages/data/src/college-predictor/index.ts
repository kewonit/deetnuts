/**
 * college predictor module barrel export
 * uses extension-less imports — moduleResolution: bundler does not require .js extensions
 * and Turbopack cannot resolve .js to .ts for uncompiled workspace packages
 **/

export {
  applyBalancedRanking,
  type BalancedRankingOptions,
  branchFilterActive,
  computeBalancedScore,
  computeBranchScore,
  computeInstituteScore,
  type InstituteRankingMeta,
  instituteMetaFromPrograms,
  sortByBalancedScore,
} from "./balanced-ranking";
export type {
  BrowserCacheEnvironment,
  IndexBufferCacheSource,
  LoadCollegePredictorIndexBufferOptions,
  LoadCollegePredictorIndexBufferResult,
} from "./browser-cache-manager";
export {
  clearPredictionResultCache,
  createIndexCacheKey,
  createPredictionResultCacheKey,
  getCachedCollegePredictorIndex,
  loadCollegePredictorIndexBuffer,
  readPredictionResultCache,
  storeCollegePredictorIndex,
  writePredictionResultCache,
} from "./browser-cache-manager";
export { readParquetRows } from "./duckdb-parquet";
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
export {
  _resetPredictorIndexCache,
  getPredictorIndexFromDeps,
  type PredictorIndexDeps,
} from "./index-loader";
export {
  _resetCanonicalStatesCache,
  loadCanonicalStates,
} from "./state-registry";
export type { CollegePredictorUrlInput } from "./url-params";
export {
  buildCollegePredictorSharePath,
  decodeCollegePredictorUrlParams,
  encodeCollegePredictorUrlParams,
} from "./url-params";
