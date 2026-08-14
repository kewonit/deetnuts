/**
 * JEE Main college predictor — NIT/IIIT/CFI with HS/OS/special-state quota resolution
 * uses the shared JoSAA index loader; filters to non-IIT rows in JS after load
 * quota filtering happens in JS after loading the shared index; state must be a canonical
 * value from institutes.json — validated at the Zod schema layer before predict() is called
 */

import type { ExamPredictor } from "@ejam/data";
import {
  type CollegePredictionResult,
  type CollegePredictorFilters,
  type CollegePredictorIndexRow,
  getPredictorIndexFromDeps,
  loadCanonicalStates,
  predictPrograms,
} from "@ejam/data/college-predictor";
import { z } from "zod4";
import {
  finalizePredictionResult,
  resultFromCacheEntry,
} from "../shared/finalize-prediction";
import {
  createServerCacheKey,
  getServerCacheEntry,
  indexShaFromDeps,
  type ServerCacheEntry,
  setServerCacheEntry,
} from "../shared/predictor-cache";
import { QuotaApi, refineQuotaRequiresState } from "../shared/quota-input";

const JeeMainInput = z
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
type JeeMainInput = z.infer<typeof JeeMainInput>;

// values must match the corresponding state strings in data/reference/engineering/institutes.json
// exactly — HS/OS/special-state quota matching does string equality on row.state
// Ladakh has no institutes in the registry today; keep the entry so a future
// Ladakh institute (e.g. an upcoming NIT/IIIT) is recognised the moment its row is added
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

// in-memory server cache — keyed by a canonical digest of input + index version
// sessionStorage is a no-op on the server; this Map persists for the process lifetime
// predictions are deterministic for a given index version, so no TTL is needed
const _serverCache = new Map<string, ServerCacheEntry>();

let _cachedRegistry: RegistryMaps | null = null;

async function loadRegistryMaps(): Promise<RegistryMaps> {
  if (_cachedRegistry) return _cachedRegistry;

  const { readFileSync } = await import("node:fs");
  const { resolve } = await import("node:path");
  const { resolveRegistryRoot } = await import("@ejam/data");
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

export const predictor: ExamPredictor<JeeMainInput, CollegePredictionResult> = {
  inputSchema: JeeMainInput,

  async predict(input, deps) {
    const cacheInput = { exam_id: deps.examId, ...input };
    const cacheKey = createServerCacheKey({
      index_sha: indexShaFromDeps(deps),
      ...cacheInput,
    });
    const cached = getServerCacheEntry(_serverCache, cacheKey);
    if (cached) {
      return { result: resultFromCachedPrograms(cached, input.filters) };
    }

    const [allRows, registry] = await Promise.all([
      getPredictorIndexFromDeps(deps),
      loadRegistryMaps(),
    ]);
    // filter to non-IIT rows in JS — shared loader returns all instype values
    const nonIitRows = allRows.filter((row) => row.instype !== "IIT");
    const enrichedRows = enrichRows(nonIitRows, registry);
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

    setServerCacheEntry(_serverCache, cacheKey, {
      programs: result.programs,
      metadata: result.metadata,
      ews_comparison: result.ews_comparison,
    });
    return { result };
  },
};
