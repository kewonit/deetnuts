/**
 * CSAB college predictor — NIT/IIIT/CFI supplementary rounds
 * uses a separate index built from CSAB-only cutoff data so the candidate
 * pool (post-JoSAA students) is never blended with the JoSAA population
 *
 * quota resolution is identical to JEE Main: HS/OS/AI/special-state
 * state must be a canonical value from institutes.json — validated at the
 * Zod schema layer before predict() is called
 */

import {
  type CollegePredictionResult,
  type CollegePredictorFilters,
  type CollegePredictorIndexRow,
  getPredictorIndexFromDeps,
  loadCanonicalStates,
  predictPrograms,
} from "@ejam/data/college-predictor";
import type { ExamPredictor } from "@ejam/data/predictor-interface";
import { z } from "zod4";
import {
  finalizePredictionResult,
  resultFromCacheEntry,
  resultFromRankedPrograms,
} from "../shared/finalize-prediction";
import {
  createServerCacheKey,
  getServerCacheEntry,
  indexShaFromDeps,
  type ServerCacheEntry,
  setServerCacheEntry,
} from "../shared/predictor-cache";
import { QuotaApi, refineQuotaRequiresState } from "../shared/quota-input";

const CsabInput = z
  .object({
    rank: z.number().int().min(1).max(500000),
    seat_type: z.string().regex(/^[A-Za-z0-9 ()-]+$/),
    gender: z.string().regex(/^[A-Za-z0-9 ()-]+$/),
    quota: QuotaApi.default("OS"),
    state: z
      .string()
      .optional()
      .default("")
      .refine(
        (value) => value === "" || loadCanonicalStates().has(value),
        "state must be a canonical value from the institute registry",
      ),
    filters: z
      .object({
        institute_type: z.array(z.string()).optional(),
        state: z.array(z.string()).optional(),
        branch_name: z.union([z.string(), z.array(z.string())]).optional(),
        band: z
          .array(z.enum(["safe", "iffy", "delulu", "doesnt-matter"]))
          .optional(),
      })
      .optional(),
    has_ews_certificate: z.boolean().optional(),
    include_all: z.boolean().optional(),
  })
  .superRefine(refineQuotaRequiresState);
type CsabInput = z.infer<typeof CsabInput>;

// values must match the corresponding state strings in data/reference/engineering/institutes.json
// exactly — HS/OS/special-state quota matching does string equality on row.state
const SPECIAL_STATE_QUOTAS: Record<string, string> = {
  GO: "Goa",
  JK: "Jammu and Kashmir",
  LA: "Ladakh",
  AP: "Andhra Pradesh",
};

const EWS_SEAT_TYPE = "EWS";
const EWS_CAVEAT =
  "EWS seats are only available to candidates holding a valid EWS certificate issued by a competent authority. These results assume you are EWS-eligible.";

type RegistryMaps = {
  instituteStates: Map<string, string>;
  programNames: Map<string, string>;
  instituteNirf: Map<string, number | null | undefined>;
};

// module-level caches — populated on first request, cleared on process restart
let _cachedRegistry: RegistryMaps | null = null;

// in-memory prediction result cache — keyed by a canonical digest of input + index version
// avoids re-running the probability computation for identical requests, bounded for process health
const _resultCache = new Map<string, ServerCacheEntry>();

function cacheKey(input: unknown): string {
  return createServerCacheKey(input);
}

async function loadRegistryMaps(): Promise<RegistryMaps> {
  if (_cachedRegistry) return _cachedRegistry;

  const { readFileSync } = await import("node:fs");
  const { resolve } = await import("node:path");
  const { resolveRegistryRoot } = await import("@ejam/data/data-root");
  const registryRoot = resolveRegistryRoot();
  const institutes = JSON.parse(
    readFileSync(
      resolve(registryRoot, "engineering", "institutes.json"),
      "utf-8",
    ),
  ) as Array<{ id: string; state: string; nirf_rank?: number | null }>;
  const programs = JSON.parse(
    readFileSync(
      resolve(registryRoot, "engineering", "programs.json"),
      "utf-8",
    ),
  ) as Array<{ id: string; name: string }>;

  _cachedRegistry = {
    instituteStates: new Map(institutes.map((i) => [i.id, i.state])),
    programNames: new Map(programs.map((p) => [p.id, p.name])),
    instituteNirf: new Map(institutes.map((i) => [i.id, i.nirf_rank ?? null])),
  };
  return _cachedRegistry;
}

function enrichRows(
  rows: CollegePredictorIndexRow[],
  registry: RegistryMaps,
): CollegePredictorIndexRow[] {
  return rows.map((row) => ({
    ...row,
    state: registry.instituteStates.get(row.institute_id),
    program_name: registry.programNames.get(row.program_id),
  }));
}

function filterByQuota(
  rows: CollegePredictorIndexRow[],
  studentState: string,
  instituteStates: Map<string, string>,
): CollegePredictorIndexRow[] {
  return rows.filter((row) => {
    const q = row.quota;
    if (q === "AI") return true;
    if (q === "HS")
      return instituteStates.get(row.institute_id) === studentState;
    if (q === "OS")
      return instituteStates.get(row.institute_id) !== studentState;
    const specialState = SPECIAL_STATE_QUOTAS[q];
    if (specialState) return studentState === specialState;
    return false;
  });
}

function resultFromCachedPrograms(
  cached: ServerCacheEntry,
  filters: CollegePredictorFilters | undefined,
): CollegePredictionResult {
  return resultFromCacheEntry(cached, filters);
}

export const predictor: ExamPredictor<CsabInput, CollegePredictionResult> = {
  inputSchema: CsabInput,

  async predict(input, deps) {
    const key = cacheKey({
      index_sha: indexShaFromDeps(deps),
      exam_id: deps.examId,
      ...input,
    });
    const cached = getServerCacheEntry(_resultCache, key);
    if (cached) {
      return { result: resultFromCachedPrograms(cached, input.filters) };
    }

    const allRows = await getPredictorIndexFromDeps(deps);
    if (allRows.length === 0) {
      return { result: resultFromRankedPrograms([], input.filters) };
    }

    const registry = await loadRegistryMaps();

    const enrichedRows = enrichRows(allRows, registry);
    const quotaFiltered = filterByQuota(
      enrichedRows,
      input.state,
      registry.instituteStates,
    );

    let result = predictPrograms({
      indexRows: quotaFiltered,
      studentRank: input.rank,
      seatType: input.seat_type,
      quota: input.quota,
      gender: input.gender,
      includeAll: input.include_all,
      filters: input.filters,
    });
    result = finalizePredictionResult(
      result,
      input.filters,
      registry.instituteNirf,
    );

    if (input.has_ews_certificate) {
      const baseResult: CollegePredictionResult = {
        programs: result.programs,
        metadata: result.metadata,
        grouped_by_band: result.grouped_by_band,
      };
      let ews = predictPrograms({
        indexRows: quotaFiltered,
        studentRank: input.rank,
        seatType: EWS_SEAT_TYPE,
        quota: input.quota,
        gender: input.gender,
        includeAll: input.include_all,
        filters: input.filters,
      });
      ews = finalizePredictionResult(
        ews,
        input.filters,
        registry.instituteNirf,
      );
      result.ews_comparison = {
        base: baseResult,
        ews,
        caveat: EWS_CAVEAT,
      };
    }

    setServerCacheEntry(_resultCache, key, {
      programs: result.programs,
      metadata: result.metadata,
      ews_comparison: result.ews_comparison,
    });
    return { result };
  },
};
