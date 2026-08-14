import { z } from "zod4";
import {
  MHT_CET_HOME_UNIVERSITIES_2026,
  MHT_CET_MINORITY_COMMUNITIES_2026,
  MHT_CET_MINORITY_INSTITUTE_RULES_2026,
  MHT_CET_PWD_CATEGORIES_2026,
} from "./eligibility-rules";
import { MhtCetStageSemanticsId } from "./stage-schema";

const Slug = z.string().regex(/^[a-z0-9-]+$/);
const MhtCetHomeUniversityId = z.enum(
  MHT_CET_HOME_UNIVERSITIES_2026.map((entry) => entry.id),
);
const MhtCetPwdCategoryId = z.enum(
  MHT_CET_PWD_CATEGORIES_2026.map((entry) => entry.id),
);
const MhtCetMinorityCommunityId = z.enum(
  MHT_CET_MINORITY_COMMUNITIES_2026.map((entry) => entry.id),
);
const MhtCetMinorityInstituteStatusId = z.enum(
  MHT_CET_MINORITY_INSTITUTE_RULES_2026.map((entry) => entry.id),
);

function parquetInteger(schema: z.ZodNumber) {
  return z.preprocess((value) => {
    if (typeof value === "bigint") {
      const numberValue = Number(value);
      return Number.isSafeInteger(numberValue) ? numberValue : value;
    }
    return value;
  }, schema);
}

export const MhtCetProbabilityBand = z.enum([
  "safe",
  "iffy",
  "delulu",
  "doesnt-matter",
]);
export type MhtCetProbabilityBand = z.infer<typeof MhtCetProbabilityBand>;

export const MhtCetCandidatureType = z.enum([
  "type-a",
  "type-b",
  "type-c",
  "type-d",
  "type-e",
]);
export type MhtCetCandidatureType = z.infer<typeof MhtCetCandidatureType>;

export const MhtCetCategoryId = z.enum([
  "open",
  "sc",
  "st",
  "vj-dt",
  "nt-b",
  "nt-c",
  "nt-d",
  "obc",
  "sebc",
]);
export type MhtCetCategoryId = z.infer<typeof MhtCetCategoryId>;

export const MhtCetAllocationScope = z.enum([
  "home-university",
  "other-university",
  "state-level",
  "maharashtra-state",
]);
export type MhtCetAllocationScope = z.infer<typeof MhtCetAllocationScope>;

export const MhtCetSpecialEligibility = z.enum([
  "none",
  "ews",
  "tfws",
  "pwd",
  "defence",
  "orphan",
  "minority",
]);
export type MhtCetSpecialEligibility = z.infer<typeof MhtCetSpecialEligibility>;

export const MhtCetRoundDataStatus = z.enum([
  "rank",
  "percentile-only",
  "not-published",
]);
export type MhtCetRoundDataStatus = z.infer<typeof MhtCetRoundDataStatus>;

export const MhtCetSeatPoolDefinition = z
  .object({
    id: Slug,
    source_code: z.string().min(1),
    label: z.string().min(1),
    category_id: MhtCetCategoryId.nullable(),
    ladies_seat: z.boolean(),
    allocation_scope: MhtCetAllocationScope,
    special_eligibility: MhtCetSpecialEligibility,
    predictable: z.boolean(),
    exclusion_reason: z.string().min(1).optional(),
    observed_years: z.array(z.number().int().min(2024).max(2100)).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.predictable && !value.exclusion_reason) {
      ctx.addIssue({
        code: "custom",
        path: ["exclusion_reason"],
        message: "non-predictable seat pools require an exclusion reason",
      });
    }
  });
export type MhtCetSeatPoolDefinition = z.infer<typeof MhtCetSeatPoolDefinition>;

export const MhtCetSeatPoolGroup = z
  .object({
    category_id: MhtCetCategoryId.nullable(),
    ladies_seat: z.boolean(),
    special_eligibility: MhtCetSpecialEligibility,
    predictable: z.boolean(),
    exclusion_reason: z.string().min(1).optional(),
    codes: z.object({
      "home-university": z.array(z.string().min(1)).default([]),
      "other-university": z.array(z.string().min(1)).default([]),
      "state-level": z.array(z.string().min(1)).default([]),
      "maharashtra-state": z.array(z.string().min(1)).default([]),
    }),
  })
  .superRefine((value, ctx) => {
    if (!value.predictable && !value.exclusion_reason) {
      ctx.addIssue({
        code: "custom",
        path: ["exclusion_reason"],
        message: "non-predictable seat-pool groups require an exclusion reason",
      });
    }
  });
export type MhtCetSeatPoolGroup = z.infer<typeof MhtCetSeatPoolGroup>;

export const MhtCetHistoricalSeatPoolAlias = z.object({
  source_code: z.string().min(1),
  observed_years: z.array(z.number().int().min(2024).max(2100)).min(1),
  category_id: MhtCetCategoryId.nullable(),
  ladies_seat: z.boolean(),
  allocation_scope: MhtCetAllocationScope,
  special_eligibility: MhtCetSpecialEligibility,
  predictable: z.literal(true),
});
export type MhtCetHistoricalSeatPoolAlias = z.infer<
  typeof MhtCetHistoricalSeatPoolAlias
>;

export const MhtCetSeatPoolRegistryFile = z.object({
  schema_version: z.literal(1),
  rules_year: z.number().int().min(2024).max(2100),
  source_id: z.string().min(1),
  groups: z.array(MhtCetSeatPoolGroup).min(1),
  historical_aliases: z.array(MhtCetHistoricalSeatPoolAlias).default([]),
});
export type MhtCetSeatPoolRegistryFile = z.infer<
  typeof MhtCetSeatPoolRegistryFile
>;

export const MhtCetSeatPoolRegistry = z.object({
  schema_version: z.literal(1),
  rules_year: z.number().int().min(2024).max(2100),
  source_id: z.string().min(1),
  entries: z.array(MhtCetSeatPoolDefinition).min(1),
});
export type MhtCetSeatPoolRegistry = z.infer<typeof MhtCetSeatPoolRegistry>;

export const MhtCetCutoffRow = z.object({
  schema_version: z.literal(3),
  exam_id: z.literal("mht-cet"),
  counselling_id: z.literal("maharashtra-cap"),
  year: z.number().int().min(2024).max(2100),
  round: z.number().int().min(1).max(4),
  institute_id: Slug,
  institute_code: z.string().regex(/^\d{5}$/),
  source_institute_name: z.string().min(1),
  offering_id: Slug,
  choice_code: z.string().regex(/^\d{10}[A-Z]{0,2}$/),
  program_id: Slug,
  program_name: z.string().min(1),
  source_program_name: z.string().min(1),
  seat_pool_id: Slug,
  source_category_code: z.string().min(1),
  source_stage_label: z.string().min(1),
  source_stage_sequence: parquetInteger(z.number().int().positive()),
  stage_semantics_id: MhtCetStageSemanticsId,
  source_seat_scope_id: MhtCetAllocationScope,
  effective_allocation_scope_id: MhtCetAllocationScope,
  source_allocation_section: z.enum([
    "HOME_TO_HOME",
    "HOME_TO_OTHER",
    "OTHER_TO_OTHER",
    "OTHER_TO_HOME",
    "STATE_LEVEL",
    "MAHARASHTRA_STATE",
  ]),
  closing_rank: parquetInteger(z.number().int().positive()).nullable(),
  closing_percentile: z.number().min(0).max(100).nullable(),
  total_admitted: parquetInteger(z.number().int().min(0)).nullable(),
  source_id: z.string().min(1),
  source_locator: z.string().min(1),
  source_table: z.string().min(1),
  source_row_id: z.string().min(1),
  snapshot_sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
export type MhtCetCutoffRow = z.infer<typeof MhtCetCutoffRow>;

export const MhtCetInstituteReference = z.object({
  schema_version: z.literal(1),
  year: z.number().int().min(2024).max(2100),
  institute_id: Slug,
  institute_code: z.string().regex(/^\d{5}$/),
  institute_name: z.string().min(1),
  institute_type: z.string().min(1),
  district: z.string().min(1),
  home_university_id: MhtCetHomeUniversityId,
  affiliating_university_id: Slug,
  minority_community_id: MhtCetMinorityInstituteStatusId.nullable(),
  source_id: z.string().min(1),
  source_locator: z.string().min(1),
});
export type MhtCetInstituteReference = z.infer<typeof MhtCetInstituteReference>;

export const MhtCetModelConfiguration = z.object({
  schema_version: z.literal(1),
  model_id: z.string().min(1),
  target_year: z.number().int().min(2025).max(2100),
  rules_year: z.number().int().min(2025).max(2100),
  source_years: z.tuple([z.number().int(), z.number().int()]),
  minimum_stratum_size: z.number().int().min(2),
  band_thresholds: z.object({
    safe: z.literal(0.85),
    iffy: z.literal(0.4),
    delulu: z.literal(0.1),
  }),
  release_gates: z.object({
    within_20_percent_minimum: z.number().min(0).max(1),
    interval_80_coverage_minimum: z.number().min(0).max(1),
    interval_80_coverage_maximum: z.number().min(0).max(1),
    interval_95_coverage_minimum: z.number().min(0).max(1),
  }),
});
export type MhtCetModelConfiguration = z.infer<typeof MhtCetModelConfiguration>;

const MhtCetEligibilities = z
  .object({
    ews_certificate: z.boolean(),
    tfws_eligible: z.boolean(),
    pwd_category_id: MhtCetPwdCategoryId.optional(),
    orphan_certificate: z.boolean(),
    minority_community_id: MhtCetMinorityCommunityId.optional(),
  })
  .strict();

export const MhtCetPredictionInput = z
  .object({
    rank: z.number().int().min(1).max(1_000_000),
    candidature_type_id: MhtCetCandidatureType,
    category_id: MhtCetCategoryId,
    ladies_seat_eligible: z.boolean(),
    home_university_id: MhtCetHomeUniversityId.optional(),
    eligibilities: MhtCetEligibilities,
    filters: z
      .object({
        institute_type: z.array(z.string()).optional(),
        district: z.array(z.string()).optional(),
        program_id: z.array(Slug).optional(),
        band: z.array(MhtCetProbabilityBand).optional(),
      })
      .optional(),
    include_all: z.boolean().optional(),
    result_options: z
      .object({
        limit: z.number().int().min(1).max(100).default(100),
        cursor: z
          .string()
          .min(1)
          .max(2048)
          .regex(/^[A-Za-z0-9_-]+$/, "cursor must be base64url encoded")
          .optional(),
        search: z.string().trim().max(120).optional(),
        sort_by: z
          .enum(["chance", "closing-rank", "institute"])
          .default("chance"),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.candidature_type_id !== "type-e" && !value.home_university_id) {
      ctx.addIssue({
        code: "custom",
        path: ["home_university_id"],
        message:
          "home university is required for Maharashtra candidature types A-D",
      });
    }
    if (value.eligibilities.ews_certificate && value.category_id !== "open") {
      ctx.addIssue({
        code: "custom",
        path: ["eligibilities", "ews_certificate"],
        message:
          "EWS eligibility can only be combined with the open base category",
      });
    }
    if (value.candidature_type_id === "type-e" && value.home_university_id) {
      ctx.addIssue({
        code: "custom",
        path: ["home_university_id"],
        message: "type E candidature does not use a home university",
      });
    }
    if (
      value.candidature_type_id === "type-e" &&
      value.eligibilities.pwd_category_id
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["eligibilities", "pwd_category_id"],
        message:
          "PwD reservation requires Maharashtra domicile and is unavailable to type E candidature",
      });
    }
    if (
      value.candidature_type_id !== "type-a" &&
      value.candidature_type_id !== "type-b" &&
      value.eligibilities.minority_community_id
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["eligibilities", "minority_community_id"],
        message:
          "Minority reservation requires Type A or Type B Maharashtra candidature",
      });
    }
  });
export type MhtCetPredictionInput = z.infer<typeof MhtCetPredictionInput>;

const NullablePositiveInteger = parquetInteger(
  z.number().int().positive(),
).nullable();
const ResidualSamples = z.array(z.number().finite()).min(1);
const UncertaintySource = z.enum([
  "round-stage-category-scope",
  "round-stage-category",
  "round-stage",
  "round",
  "global",
  "round4-pooled",
]);

export const MhtCetPredictorIndexRow = z
  .object({
    schema_version: z.literal(3),
    model_id: z.string().min(1),
    target_year: z.number().int().min(2025).max(2100),
    rules_year: z.number().int().min(2025).max(2100),
    institute_id: Slug,
    institute_code: z.string().regex(/^\d{5}$/),
    institute_name: z.string().min(1),
    institute_type: z.string().min(1),
    district: z.string().min(1),
    home_university_id: MhtCetHomeUniversityId,
    minority_community_id: MhtCetMinorityInstituteStatusId.nullable(),
    offering_id: Slug,
    choice_code: z.string().regex(/^\d{10}[A-Z]{0,2}$/),
    program_id: Slug,
    program_name: z.string().min(1),
    seat_pool_id: Slug,
    source_stage_label: z.string().min(1),
    stage_semantics_id: MhtCetStageSemanticsId,
    source_seat_scope_id: MhtCetAllocationScope,
    allocation_scope_id: MhtCetAllocationScope,
    latest_year: z.number().int().min(2024).max(2100),
    years_of_data: z.number().int().min(1).max(2),
    data_quality: z.enum(["inferred", "pooled"]),
    round1_rank: NullablePositiveInteger,
    round2_rank: NullablePositiveInteger,
    round3_rank: NullablePositiveInteger,
    round4_rank: NullablePositiveInteger,
    round1_status: MhtCetRoundDataStatus,
    round2_status: MhtCetRoundDataStatus,
    round3_status: MhtCetRoundDataStatus,
    round4_status: MhtCetRoundDataStatus,
    round1_percentile: z.number().min(0).max(100).nullable(),
    round2_percentile: z.number().min(0).max(100).nullable(),
    round3_percentile: z.number().min(0).max(100).nullable(),
    round4_percentile: z.number().min(0).max(100).nullable(),
    round1_relative_residuals: ResidualSamples.nullable(),
    round2_relative_residuals: ResidualSamples.nullable(),
    round3_relative_residuals: ResidualSamples.nullable(),
    round4_relative_residuals: ResidualSamples.nullable(),
    round1_uncertainty_source: UncertaintySource.nullable(),
    round2_uncertainty_source: UncertaintySource.nullable(),
    round3_uncertainty_source: UncertaintySource.nullable(),
    round4_uncertainty_source: z.literal("round4-pooled").nullable(),
    round1_data_quality: z.enum(["inferred", "pooled"]).nullable(),
    round2_data_quality: z.enum(["inferred", "pooled"]).nullable(),
    round3_data_quality: z.enum(["inferred", "pooled"]).nullable(),
    round4_data_quality: z.enum(["inferred", "pooled"]).nullable(),
  })
  .superRefine((value, ctx) => {
    if ((value.years_of_data === 2) !== (value.data_quality === "inferred")) {
      ctx.addIssue({
        code: "custom",
        path: ["data_quality"],
        message: "top-level data quality must match years_of_data",
      });
    }
    for (const round of [1, 2, 3, 4] as const) {
      const status = value[`round${round}_status`];
      const rank = value[`round${round}_rank`];
      const percentile = value[`round${round}_percentile`];
      const fields = [
        rank,
        value[`round${round}_relative_residuals`],
        value[`round${round}_uncertainty_source`],
        value[`round${round}_data_quality`],
      ];
      const populated = fields.map((field) => field !== null);
      if (status === "rank" && !populated.every(Boolean)) {
        ctx.addIssue({
          code: "custom",
          path: [`round${round}_rank`],
          message: `round ${round} rank status requires rank, residuals, uncertainty source, and quality`,
        });
      }
      if (status !== "rank" && populated.some(Boolean)) {
        ctx.addIssue({
          code: "custom",
          path: [`round${round}_status`],
          message: `round ${round} ${status} status cannot contain rank model fields`,
        });
      }
      if (status === "percentile-only" && percentile === null) {
        ctx.addIssue({
          code: "custom",
          path: [`round${round}_percentile`],
          message: `round ${round} percentile-only status requires a percentile`,
        });
      }
      if (status === "not-published" && percentile !== null) {
        ctx.addIssue({
          code: "custom",
          path: [`round${round}_percentile`],
          message: `round ${round} not-published status cannot contain a percentile`,
        });
      }
      if (
        value[`round${round}_data_quality`] === "inferred" &&
        value.years_of_data !== 2
      ) {
        ctx.addIssue({
          code: "custom",
          path: [`round${round}_data_quality`],
          message: `round ${round} cannot be inferred from a one-cycle row`,
        });
      }
    }
    if (
      value.round4_data_quality !== null &&
      value.round4_data_quality !== "pooled"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["round4_data_quality"],
        message: "round four must use pooled data quality",
      });
    }
  });
export type MhtCetPredictorIndexRow = z.infer<typeof MhtCetPredictorIndexRow>;
