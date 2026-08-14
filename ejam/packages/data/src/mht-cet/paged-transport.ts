import { z } from "zod4";
import {
  MhtCetPredictionMetadata,
  MhtCetPredictionResult,
  type MhtCetPredictionResult as MhtCetPredictionResultType,
  MhtCetProgramPredictionBase,
  type MhtCetRoundMatch,
} from "./result-schema";
import { mhtCetRoundAvailabilityReason } from "./round-availability";
import type { MhtCetAllocationScope } from "./schema";
import {
  mhtCetEffectiveEligibilityDescription,
  mhtCetStageDescription,
} from "./stage-descriptions";
import { MhtCetStageSemanticsId } from "./stage-schema";

const TRANSPORT_ENCODING = "mht-cet-page-v3" as const;
const ROUNDS = [1, 2, 3, 4] as const;
const ALLOCATION_SCOPES = [
  "home-university",
  "other-university",
  "state-level",
  "maharashtra-state",
] as const satisfies readonly MhtCetAllocationScope[];
const AVAILABILITY_STATUSES = [
  "available",
  "offering-not-published-for-maharashtra-cap",
  "no-eligible-stage-for-profile",
  "percentile-only-rank-zero",
] as const;

const PoolDictionaryEntry = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  source_code: z.string().min(1),
});
const StageDictionaryEntry = z
  .object({
    source_stage_label: z.string().min(1),
    stage_semantics_id: MhtCetStageSemanticsId,
    active_rule_id: z
      .string()
      .regex(/^stage-[ivx]+$/)
      .nullable(),
    active_rule_label: z.string().min(1).nullable(),
    active_rules_year: z.number().int().min(2025).max(2100).nullable(),
  })
  .superRefine((value, ctx) => {
    const populated = [
      value.active_rule_id,
      value.active_rule_label,
      value.active_rules_year,
    ].map((field) => field !== null);
    if (!populated.every(Boolean) && populated.some(Boolean)) {
      ctx.addIssue({
        code: "custom",
        path: ["active_rule_id"],
        message: "active-rule dictionary fields must be jointly populated",
      });
    }
  });
const ScopeIndex = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
const EligibilityBit = z.union([z.literal(0), z.literal(1)]);
const QualityBit = z.union([z.literal(0), z.literal(1)]);
const AvailabilityIndex = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
const CompactSeatPool = z.tuple([
  z.number().int().min(0),
  z.number().int().min(0),
  ScopeIndex,
  ScopeIndex,
  EligibilityBit,
  z.number().int().min(1).max(15),
]);
const CompactRoundMatch = z.tuple([
  z.number().int().positive(),
  z.number().min(0).max(100).nullable(),
  z.number().int().min(0),
  z.number().int().min(0),
  ScopeIndex,
  ScopeIndex,
  QualityBit,
  z.number().int().min(2024).max(2100),
]);
const CompactRoundMatches = z.tuple([
  CompactRoundMatch.nullable(),
  CompactRoundMatch.nullable(),
  CompactRoundMatch.nullable(),
  CompactRoundMatch.nullable(),
]);
const CompactAvailability = z.tuple([
  AvailabilityIndex,
  AvailabilityIndex,
  AvailabilityIndex,
  AvailabilityIndex,
]);
const CompactProgram = MhtCetProgramPredictionBase.omit({
  best_eligible_seat_pool: true,
  seat_pools_considered: true,
  round_matches: true,
  round_availability: true,
}).extend({
  best_pool_label: z.string().min(1),
  seat_pools_considered: z.array(CompactSeatPool).min(1),
  round_matches: CompactRoundMatches,
  round_availability: CompactAvailability,
});

function dictionaryIssues(
  values: Array<{ key: string; path: Array<string | number> }>,
  ctx: z.core.$RefinementCtx<unknown>,
): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value.key)) {
      ctx.addIssue({
        code: "custom",
        path: value.path,
        message: "compact dictionary entries must be unique",
      });
    }
    seen.add(value.key);
  }
}

export const MhtCetPagedPredictionTransport = z
  .object({
    transport_encoding: z.literal(TRANSPORT_ENCODING),
    seat_pool_dictionary: z.array(PoolDictionaryEntry),
    stage_dictionary: z.array(StageDictionaryEntry),
    programs: z.array(CompactProgram),
    metadata: MhtCetPredictionMetadata,
  })
  .superRefine((value, ctx) => {
    if (value.metadata.pagination.limit === null) {
      ctx.addIssue({
        code: "custom",
        path: ["metadata", "pagination", "limit"],
        message: "compact transport is only valid for paginated results",
      });
    }
    if (value.programs.length !== value.metadata.pagination.returned) {
      ctx.addIssue({
        code: "custom",
        path: ["metadata", "pagination", "returned"],
        message: "pagination returned count must match programs length",
      });
    }
    dictionaryIssues(
      value.seat_pool_dictionary.map((entry, index) => ({
        key: entry.id,
        path: ["seat_pool_dictionary", index],
      })),
      ctx,
    );
    dictionaryIssues(
      value.stage_dictionary.map((entry, index) => ({
        key: stageKey({
          ...entry,
          active_rule_id: entry.active_rule_id ?? undefined,
        }),
        path: ["stage_dictionary", index],
      })),
      ctx,
    );
    for (const [programIndex, program] of value.programs.entries()) {
      const seen = new Set<string>();
      const references = [
        ...program.seat_pools_considered.map((tuple) => [tuple[0], tuple[1]]),
        ...program.round_matches.flatMap((tuple) =>
          tuple ? [[tuple[2], tuple[3]]] : [],
        ),
      ];
      for (const [poolIndex, stageIndex] of references) {
        if (poolIndex >= value.seat_pool_dictionary.length) {
          ctx.addIssue({
            code: "custom",
            path: ["programs", programIndex],
            message: "seat-pool dictionary index is out of range",
          });
        }
        if (stageIndex >= value.stage_dictionary.length) {
          ctx.addIssue({
            code: "custom",
            path: ["programs", programIndex],
            message: "stage dictionary index is out of range",
          });
        }
      }
      for (const tuple of program.seat_pools_considered) {
        const key = `${tuple[0]}:${tuple[1]}:${tuple[2]}:${tuple[3]}`;
        if (seen.has(key)) {
          ctx.addIssue({
            code: "custom",
            path: ["programs", programIndex, "seat_pools_considered"],
            message: "program stage references must be unique",
          });
        }
        seen.add(key);
      }
    }
  });
export type MhtCetPagedPredictionTransport = z.infer<
  typeof MhtCetPagedPredictionTransport
>;

function stageKey(value: {
  source_stage_label: string;
  stage_semantics_id: string;
  active_rule_id?: string | null;
}): string {
  return [
    value.source_stage_label,
    value.stage_semantics_id,
    value.active_rule_id ?? "",
  ].join(":");
}

function roundsBitmask(rounds: Array<1 | 2 | 3 | 4>): number {
  return rounds.reduce((mask, round) => mask | (1 << (round - 1)), 0);
}

function roundsFromBitmask(mask: number): Array<1 | 2 | 3 | 4> {
  return ROUNDS.filter((round) => (mask & (1 << (round - 1))) !== 0);
}

function dictionaryIndex(
  indexes: Map<string, number>,
  key: string,
  label: string,
): number {
  const index = indexes.get(key);
  if (index === undefined) {
    throw new Error(`MHT-CET ${label} dictionary mapping failed`);
  }
  return index;
}

function scopeIndex(scope: MhtCetAllocationScope): 0 | 1 | 2 | 3 {
  const index = ALLOCATION_SCOPES.indexOf(scope);
  if (index < 0) throw new Error("MHT-CET scope mapping failed");
  return index as 0 | 1 | 2 | 3;
}

export function encodeMhtCetPagedPredictionResult(
  value: MhtCetPredictionResultType,
): MhtCetPagedPredictionTransport {
  const result = MhtCetPredictionResult.parse(value);
  if (result.metadata.pagination.limit === null) {
    throw new Error("cannot compact a non-paginated MHT-CET result");
  }
  const pools = new Map<string, z.infer<typeof PoolDictionaryEntry>>();
  const stages = new Map<string, z.infer<typeof StageDictionaryEntry>>();
  for (const program of result.programs) {
    for (const pool of program.seat_pools_considered) {
      const existing = pools.get(pool.id);
      if (existing && existing.source_code !== pool.source_code) {
        throw new Error(
          `MHT-CET seat pool ${pool.id} has conflicting source codes`,
        );
      }
      pools.set(pool.id, { id: pool.id, source_code: pool.source_code });
      stages.set(stageKey(pool), {
        source_stage_label: pool.source_stage_label,
        stage_semantics_id: pool.stage_semantics_id,
        active_rule_id: null,
        active_rule_label: null,
        active_rules_year: null,
      });
    }
    for (const match of Object.values(program.round_matches)) {
      if (!match) continue;
      stages.set(
        stageKey({
          source_stage_label: match.stage.source_label,
          stage_semantics_id: match.stage.semantics_id,
          active_rule_id: match.stage.active_rule.stage_id,
        }),
        {
          source_stage_label: match.stage.source_label,
          stage_semantics_id: match.stage.semantics_id,
          active_rule_id: match.stage.active_rule.stage_id,
          active_rule_label: match.stage.active_rule.stage_label,
          active_rules_year: match.stage.active_rule.rules_year,
        },
      );
    }
  }
  const poolDictionary = Array.from(pools.values()).sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  const stageDictionary = Array.from(stages.values()).sort((left, right) =>
    stageKey(left).localeCompare(stageKey(right)),
  );
  const poolIndexes = new Map(
    poolDictionary.map((entry, index) => [entry.id, index]),
  );
  const stageIndexes = new Map(
    stageDictionary.map((entry, index) => [stageKey(entry), index]),
  );
  const compactMatch = (
    match: MhtCetRoundMatch | null,
  ): z.infer<typeof CompactRoundMatch> | null => {
    if (!match) return null;
    return [
      match.predicted_closing_rank,
      match.latest_historical_percentile,
      dictionaryIndex(poolIndexes, match.seat_pool_id, "seat-pool"),
      dictionaryIndex(
        stageIndexes,
        stageKey({
          source_stage_label: match.stage.source_label,
          stage_semantics_id: match.stage.semantics_id,
          active_rule_id: match.stage.active_rule.stage_id,
        }),
        "stage",
      ),
      scopeIndex(match.source_seat_scope_id),
      scopeIndex(match.effective_allocation_scope_id),
      match.data_quality === "inferred" ? 0 : 1,
      match.stage.source_year,
    ];
  };

  return MhtCetPagedPredictionTransport.parse({
    transport_encoding: TRANSPORT_ENCODING,
    seat_pool_dictionary: poolDictionary,
    stage_dictionary: stageDictionary,
    programs: result.programs.map((program) => ({
      ...program,
      best_eligible_seat_pool: undefined,
      best_pool_label: program.best_eligible_seat_pool.label,
      seat_pools_considered: program.seat_pools_considered.map((pool) => [
        dictionaryIndex(poolIndexes, pool.id, "seat-pool"),
        dictionaryIndex(stageIndexes, stageKey(pool), "stage"),
        scopeIndex(pool.source_seat_scope_id),
        scopeIndex(pool.effective_allocation_scope_id),
        pool.eligible ? 1 : 0,
        roundsBitmask(pool.rounds),
      ]),
      round_matches: ROUNDS.map((round) =>
        compactMatch(program.round_matches[String(round) as "1"]),
      ),
      round_availability: ROUNDS.map((round) =>
        AVAILABILITY_STATUSES.indexOf(
          program.round_availability[String(round) as "1"].status,
        ),
      ),
    })),
    metadata: result.metadata,
  });
}

function decodedMatch(options: {
  tuple: z.infer<typeof CompactRoundMatch> | null;
  probability: number | null;
  pools: Array<z.infer<typeof PoolDictionaryEntry>>;
  stages: Array<z.infer<typeof StageDictionaryEntry>>;
}): MhtCetRoundMatch | null {
  if (!options.tuple || options.probability === null) return null;
  const [rank, percentile, poolIndex, stageIndex, sourceScope, effectiveScope] =
    options.tuple;
  const pool = options.pools[poolIndex];
  const stage = options.stages[stageIndex];
  const scope = ALLOCATION_SCOPES[effectiveScope];
  if (
    stage.active_rule_id === null ||
    stage.active_rule_label === null ||
    stage.active_rules_year === null
  ) {
    throw new Error("MHT-CET compact round match is missing active-rule data");
  }
  return {
    probability: options.probability,
    predicted_closing_rank: rank,
    latest_historical_percentile: percentile,
    seat_pool_id: pool.id,
    source_code: pool.source_code,
    source_seat_scope_id: ALLOCATION_SCOPES[sourceScope],
    effective_allocation_scope_id: scope,
    allocation_scope_id: scope,
    stage: {
      source_label: stage.source_stage_label,
      source_year: options.tuple[7],
      semantics_id: stage.stage_semantics_id,
      conversion_applied: stage.stage_semantics_id !== "standard",
      description: mhtCetStageDescription(stage.stage_semantics_id),
      active_rule: {
        rules_year: stage.active_rules_year,
        stage_id: stage.active_rule_id,
        stage_label: stage.active_rule_label,
      },
    },
    effective_eligibility_description: mhtCetEffectiveEligibilityDescription(
      stage.stage_semantics_id,
      scope,
    ),
    data_quality: options.tuple[6] === 0 ? "inferred" : "pooled",
  };
}

export function decodeMhtCetPredictionResult(
  value: unknown,
): MhtCetPredictionResultType | null {
  const legacy = MhtCetPredictionResult.safeParse(value);
  if (legacy.success) return legacy.data;
  const compact = MhtCetPagedPredictionTransport.safeParse(value);
  if (!compact.success) return null;
  const decoded = MhtCetPredictionResult.safeParse({
    programs: compact.data.programs.map((program) => {
      const matches = ROUNDS.map((round, index) =>
        decodedMatch({
          tuple: program.round_matches[index],
          probability: program.round_probabilities[String(round) as "1"],
          pools: compact.data.seat_pool_dictionary,
          stages: compact.data.stage_dictionary,
        }),
      );
      const best = matches[program.best_round - 1];
      return {
        ...program,
        best_pool_label: undefined,
        best_eligible_seat_pool: best
          ? {
              id: best.seat_pool_id,
              source_code: best.source_code,
              label: program.best_pool_label,
              source_stage_label: best.stage.source_label,
              stage_semantics_id: best.stage.semantics_id,
              source_seat_scope_id: best.source_seat_scope_id,
              effective_allocation_scope_id: best.effective_allocation_scope_id,
              allocation_scope_id: best.allocation_scope_id,
              effective_eligibility_description:
                best.effective_eligibility_description,
              round: program.best_round,
            }
          : null,
        seat_pools_considered: program.seat_pools_considered.map(
          ([
            poolIndex,
            stageIndex,
            sourceScope,
            effectiveScope,
            eligible,
            roundMask,
          ]) => ({
            ...compact.data.seat_pool_dictionary[poolIndex],
            ...compact.data.stage_dictionary[stageIndex],
            source_seat_scope_id: ALLOCATION_SCOPES[sourceScope],
            effective_allocation_scope_id: ALLOCATION_SCOPES[effectiveScope],
            allocation_scope_id: ALLOCATION_SCOPES[effectiveScope],
            eligible: eligible === 1,
            rounds: roundsFromBitmask(roundMask),
          }),
        ),
        round_matches: Object.fromEntries(
          ROUNDS.map((round, index) => [String(round), matches[index]]),
        ),
        round_availability: Object.fromEntries(
          ROUNDS.map((round, index) => {
            const status =
              AVAILABILITY_STATUSES[program.round_availability[index]];
            return [
              String(round),
              {
                status,
                reason: mhtCetRoundAvailabilityReason(round, status),
              },
            ];
          }),
        ),
      };
    }),
    metadata: compact.data.metadata,
  });
  return decoded.success ? decoded.data : null;
}
