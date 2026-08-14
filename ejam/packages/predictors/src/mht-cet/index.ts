import type { ExamPredictor } from "@ejam/data";
import {
  getMhtCetPredictorIndexFromDeps,
  loadMhtCetSeatPoolRegistry,
  MhtCetPredictionInput,
  MhtCetPredictionResult,
  type MhtCetPredictionResult as MhtCetPredictionResultType,
  predictMhtCetPrograms,
} from "@ejam/data/mht-cet";
import {
  createServerCacheKey,
  getServerCacheEntry,
  setServerCacheEntry,
} from "../shared/predictor-cache";
import { processMhtCetResult, unfilteredMhtInput } from "./result-processing";

const fullResultCache = new Map<string, MhtCetPredictionResultType>();
const FULL_RESULT_CACHE_MAX_ENTRIES = 1;

export function _resetMhtCetFullResultCache(): void {
  fullResultCache.clear();
}

export const predictor: ExamPredictor<
  MhtCetPredictionInput,
  MhtCetPredictionResultType
> = {
  inputSchema: MhtCetPredictionInput,

  async predict(input, deps) {
    const indexDataset = deps.resolvedDatasets.find(
      (dataset) => dataset.dataset === "predictor_index",
    );
    if (!indexDataset) {
      throw new Error("MHT-CET predictor index dependency is unavailable");
    }
    const pagedInput = {
      ...input,
      result_options: input.result_options ?? {
        limit: 100,
        sort_by: "chance" as const,
      },
    };
    const baseInput = unfilteredMhtInput(pagedInput);
    const cacheKey = createServerCacheKey({
      exam_id: "mht-cet",
      index_sha256: indexDataset.sha256,
      input: baseInput,
    });
    let fullResult = getServerCacheEntry(fullResultCache, cacheKey);
    if (!fullResult) {
      const indexRows = await getMhtCetPredictorIndexFromDeps(deps);
      fullResult = predictMhtCetPrograms({
        input: baseInput,
        indexRows,
        seatPoolRegistry: loadMhtCetSeatPoolRegistry(),
      });
      setServerCacheEntry(
        fullResultCache,
        cacheKey,
        fullResult,
        FULL_RESULT_CACHE_MAX_ENTRIES,
      );
    }
    const result = processMhtCetResult({
      fullResult,
      input: pagedInput,
      indexSha256: indexDataset.sha256,
    });
    return { result: MhtCetPredictionResult.parse(result) };
  },
};
