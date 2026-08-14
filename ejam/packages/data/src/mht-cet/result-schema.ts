import { z } from "zod4";
import { MhtCetAllocationScope, MhtCetProbabilityBand } from "./schema";
import { MhtCetStageSemanticsId } from "./stage-schema";

const Slug = z.string().regex(/^[a-z0-9-]+$/);
const RoundNumber = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
const DataQuality = z.enum(["inferred", "pooled"]);

export const MhtCetRoundProbabilities = z.object({
  "1": z.number().min(0).max(1).nullable(),
  "2": z.number().min(0).max(1).nullable(),
  "3": z.number().min(0).max(1).nullable(),
  "4": z.number().min(0).max(1).nullable(),
});
export type MhtCetRoundProbabilities = z.infer<typeof MhtCetRoundProbabilities>;

const StageDetails = z
  .object({
    source_label: z.string().min(1),
    source_year: z.number().int().min(2024).max(2100),
    semantics_id: MhtCetStageSemanticsId,
    conversion_applied: z.boolean(),
    description: z.string().min(1),
    active_rule: z.object({
      rules_year: z.number().int().min(2025).max(2100),
      stage_id: z.string().regex(/^stage-[ivx]+$/),
      stage_label: z.string().min(1),
    }),
  })
  .superRefine((value, ctx) => {
    if (value.conversion_applied !== (value.semantics_id !== "standard")) {
      ctx.addIssue({
        code: "custom",
        path: ["conversion_applied"],
        message: "conversion flag must agree with stage semantics",
      });
    }
  });

export const MhtCetRoundMatch = z.object({
  probability: z.number().min(0).max(1),
  predicted_closing_rank: z.number().int().positive(),
  latest_historical_percentile: z.number().min(0).max(100).nullable(),
  seat_pool_id: Slug,
  source_code: z.string().min(1),
  source_seat_scope_id: MhtCetAllocationScope,
  effective_allocation_scope_id: MhtCetAllocationScope,
  allocation_scope_id: MhtCetAllocationScope,
  stage: StageDetails,
  effective_eligibility_description: z.string().min(1),
  data_quality: DataQuality,
});
export type MhtCetRoundMatch = z.infer<typeof MhtCetRoundMatch>;

export const MhtCetRoundMatches = z.object({
  "1": MhtCetRoundMatch.nullable(),
  "2": MhtCetRoundMatch.nullable(),
  "3": MhtCetRoundMatch.nullable(),
  "4": MhtCetRoundMatch.nullable(),
});
export type MhtCetRoundMatches = z.infer<typeof MhtCetRoundMatches>;

export const MhtCetRoundAvailabilityStatus = z.enum([
  "available",
  "offering-not-published-for-maharashtra-cap",
  "no-eligible-stage-for-profile",
  "percentile-only-rank-zero",
]);
export type MhtCetRoundAvailabilityStatus = z.infer<
  typeof MhtCetRoundAvailabilityStatus
>;

const RoundAvailabilityEntry = z.object({
  status: MhtCetRoundAvailabilityStatus,
  reason: z.string().min(1),
});

export const MhtCetRoundAvailability = z.object({
  "1": RoundAvailabilityEntry,
  "2": RoundAvailabilityEntry,
  "3": RoundAvailabilityEntry,
  "4": RoundAvailabilityEntry,
});
export type MhtCetRoundAvailability = z.infer<typeof MhtCetRoundAvailability>;

const ConsideredStage = z.object({
  id: Slug,
  source_code: z.string().min(1),
  source_stage_label: z.string().min(1),
  stage_semantics_id: MhtCetStageSemanticsId,
  source_seat_scope_id: MhtCetAllocationScope,
  effective_allocation_scope_id: MhtCetAllocationScope,
  allocation_scope_id: MhtCetAllocationScope,
  eligible: z.boolean(),
  rounds: z.array(RoundNumber).min(1),
});

export const MhtCetProgramPredictionBase = z.object({
  institute_id: Slug,
  institute_code: z.string().regex(/^\d{5}$/),
  institute_name: z.string().min(1),
  institute_type: z.string().min(1),
  district: z.string().min(1),
  offering_id: Slug,
  choice_code: z.string().regex(/^\d{10}[A-Z]{0,2}$/),
  program_id: Slug,
  program_name: z.string().min(1),
  best_round: RoundNumber,
  best_eligible_seat_pool: z.object({
    id: Slug,
    source_code: z.string().min(1),
    label: z.string().min(1),
    source_stage_label: z.string().min(1),
    stage_semantics_id: MhtCetStageSemanticsId,
    source_seat_scope_id: MhtCetAllocationScope,
    effective_allocation_scope_id: MhtCetAllocationScope,
    allocation_scope_id: MhtCetAllocationScope,
    effective_eligibility_description: z.string().min(1),
    round: RoundNumber,
  }),
  seat_pools_considered: z.array(ConsideredStage).min(1),
  round_probabilities: MhtCetRoundProbabilities,
  round_matches: MhtCetRoundMatches,
  round_availability: MhtCetRoundAvailability,
  overall_probability: z.number().min(0).max(1),
  band: MhtCetProbabilityBand,
  predicted_closing_rank: z.number().int().positive(),
  latest_historical_percentile: z.number().min(0).max(100).nullable(),
  data_quality: DataQuality,
});

export const MhtCetProgramPrediction = MhtCetProgramPredictionBase.superRefine(
  (value, ctx) => {
    for (const [index, considered] of value.seat_pools_considered.entries()) {
      if (
        considered.allocation_scope_id !==
        considered.effective_allocation_scope_id
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["seat_pools_considered", index, "allocation_scope_id"],
          message:
            "allocation scope alias must equal effective candidate scope",
        });
      }
      if (new Set(considered.rounds).size !== considered.rounds.length) {
        ctx.addIssue({
          code: "custom",
          path: ["seat_pools_considered", index, "rounds"],
          message: "considered-stage rounds must be unique",
        });
      }
    }
    for (const round of ["1", "2", "3", "4"] as const) {
      const probability = value.round_probabilities[round];
      const match = value.round_matches[round];
      const availability = value.round_availability[round];
      if ((probability !== null) !== (match !== null)) {
        ctx.addIssue({
          code: "custom",
          path: ["round_matches", round],
          message: "round probability and match must be jointly available",
        });
      }
      if (match && match.probability !== probability) {
        ctx.addIssue({
          code: "custom",
          path: ["round_probabilities", round],
          message: "round probability must equal the selected match",
        });
      }
      if (
        (availability.status === "available") !==
        (match !== null && probability !== null)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["round_availability", round],
          message: "round availability must agree with probability and match",
        });
      }
      if (
        match &&
        match.allocation_scope_id !== match.effective_allocation_scope_id
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["round_matches", round, "allocation_scope_id"],
          message:
            "allocation scope alias must equal effective candidate scope",
        });
      }
      if (
        match &&
        !value.seat_pools_considered.some(
          (considered) =>
            considered.eligible &&
            considered.id === match.seat_pool_id &&
            considered.stage_semantics_id === match.stage.semantics_id &&
            considered.source_stage_label === match.stage.source_label &&
            considered.source_seat_scope_id === match.source_seat_scope_id &&
            considered.effective_allocation_scope_id ===
              match.effective_allocation_scope_id &&
            considered.rounds.includes(Number(round) as 1 | 2 | 3 | 4),
        )
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["round_matches", round],
          message: "round match must reference an eligible considered stage",
        });
      }
    }
    const bestRoundKey = String(value.best_round) as "1" | "2" | "3" | "4";
    const best = value.round_matches[bestRoundKey];
    const supportedProbabilities = Object.values(
      value.round_probabilities,
    ).filter((probability): probability is number => probability !== null);
    if (
      !best ||
      best.probability !== value.overall_probability ||
      best.predicted_closing_rank !== value.predicted_closing_rank ||
      best.latest_historical_percentile !==
        value.latest_historical_percentile ||
      best.data_quality !== value.data_quality
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["best_round"],
        message: "best-round summary must agree with the selected round match",
      });
    }
    if (
      supportedProbabilities.length === 0 ||
      Math.max(...supportedProbabilities) !== value.overall_probability
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["overall_probability"],
        message: "overall probability must be the maximum supported round",
      });
    }
    if (
      best &&
      (value.best_eligible_seat_pool.id !== best.seat_pool_id ||
        value.best_eligible_seat_pool.source_code !== best.source_code ||
        value.best_eligible_seat_pool.source_stage_label !==
          best.stage.source_label ||
        value.best_eligible_seat_pool.stage_semantics_id !==
          best.stage.semantics_id ||
        value.best_eligible_seat_pool.source_seat_scope_id !==
          best.source_seat_scope_id ||
        value.best_eligible_seat_pool.effective_allocation_scope_id !==
          best.effective_allocation_scope_id ||
        value.best_eligible_seat_pool.round !== value.best_round)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["best_eligible_seat_pool"],
        message: "best eligible seat pool must agree with the best-round match",
      });
    }
  },
);
export type MhtCetProgramPrediction = z.infer<typeof MhtCetProgramPrediction>;

export const MhtCetPredictionMetadata = z.object({
  model_id: z.string().min(1),
  target_year: z.number().int().min(2025).max(2100),
  rules_year: z.number().int().min(2025).max(2100),
  source_years: z.array(z.number().int()).min(1),
  total_matching_offerings: z.number().int().min(0),
  displayed_offerings: z.number().int().min(0),
  hidden_offerings: z.number().int().min(0),
  warnings: z.array(z.string()),
  pagination: z
    .object({
      returned: z.number().int().min(0),
      limit: z.number().int().min(1).max(100).nullable(),
      next_cursor: z.string().min(1).nullable(),
      has_more: z.boolean(),
    })
    .superRefine((value, ctx) => {
      if (value.has_more !== (value.next_cursor !== null)) {
        ctx.addIssue({
          code: "custom",
          path: ["has_more"],
          message: "has_more must match next_cursor availability",
        });
      }
    }),
  facets: z.object({
    institute_types: z.array(
      z.object({
        value: z.string().min(1),
        count: z.number().int().min(0),
      }),
    ),
    bands: z.object({
      safe: z.number().int().min(0),
      iffy: z.number().int().min(0),
      delulu: z.number().int().min(0),
      "doesnt-matter": z.number().int().min(0),
    }),
  }),
});
export type MhtCetPredictionMetadata = z.infer<typeof MhtCetPredictionMetadata>;

export const MhtCetPredictionResult = z
  .object({
    programs: z.array(MhtCetProgramPrediction),
    metadata: MhtCetPredictionMetadata,
  })
  .superRefine((value, ctx) => {
    if (value.programs.length !== value.metadata.pagination.returned) {
      ctx.addIssue({
        code: "custom",
        path: ["metadata", "pagination", "returned"],
        message: "pagination returned count must match programs length",
      });
    }
  });
export type MhtCetPredictionResult = z.infer<typeof MhtCetPredictionResult>;
