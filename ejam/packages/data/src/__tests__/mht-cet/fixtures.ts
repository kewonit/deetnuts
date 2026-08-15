import {
  loadMhtCetSeatPoolRegistry,
  type MhtCetPredictorIndexRow,
  type MhtCetStageSemanticsId,
} from "../../mht-cet";

export function indexRow(
  seatPoolId: string,
  ranks: Partial<Record<1 | 2 | 3 | 4, number | null>>,
  options: {
    sourceStageLabel?: string;
    stageSemanticsId?: MhtCetStageSemanticsId;
    percentileOnlyRounds?: Array<1 | 2 | 3 | 4>;
  } = {},
): MhtCetPredictorIndexRow {
  const pool = loadMhtCetSeatPoolRegistry().entries.find(
    (entry) => entry.id === seatPoolId,
  );
  if (!pool) throw new Error(`unknown test pool ${seatPoolId}`);
  return {
    schema_version: 3,
    model_id: "mht-cap-empirical-v3",
    target_year: 2026,
    rules_year: 2026,
    institute_id: "mht-institute-01234",
    institute_code: "01234",
    institute_name: "Official Institute",
    institute_type: "Government",
    district: "Pune",
    home_university_id: "savitribai-phule-pune-university",
    minority_community_id: null,
    offering_id: "mht-choice-0123412345",
    choice_code: "0123412345",
    program_id: "computer-engineering",
    program_name: "Computer Engineering",
    seat_pool_id: seatPoolId,
    source_stage_label: options.sourceStageLabel ?? "I",
    stage_semantics_id: options.stageSemanticsId ?? "standard",
    source_seat_scope_id: pool.allocation_scope,
    allocation_scope_id: pool.allocation_scope,
    latest_year: 2025,
    years_of_data: 2,
    data_quality: "inferred",
    round1_rank: ranks[1] ?? null,
    round2_rank: ranks[2] ?? null,
    round3_rank: ranks[3] ?? null,
    round4_rank: ranks[4] ?? null,
    round1_status: ranks[1]
      ? "rank"
      : options.percentileOnlyRounds?.includes(1)
        ? "percentile-only"
        : "not-published",
    round2_status: ranks[2]
      ? "rank"
      : options.percentileOnlyRounds?.includes(2)
        ? "percentile-only"
        : "not-published",
    round3_status: ranks[3]
      ? "rank"
      : options.percentileOnlyRounds?.includes(3)
        ? "percentile-only"
        : "not-published",
    round4_status: ranks[4]
      ? "rank"
      : options.percentileOnlyRounds?.includes(4)
        ? "percentile-only"
        : "not-published",
    round1_percentile:
      ranks[1] || options.percentileOnlyRounds?.includes(1) ? 95.1234567 : null,
    round2_percentile:
      ranks[2] || options.percentileOnlyRounds?.includes(2) ? 94.5 : null,
    round3_percentile:
      ranks[3] || options.percentileOnlyRounds?.includes(3) ? 93.5 : null,
    round4_percentile:
      ranks[4] || options.percentileOnlyRounds?.includes(4) ? 92.5 : null,
    round1_relative_residuals: ranks[1] ? [0, 0, 0] : null,
    round2_relative_residuals: ranks[2] ? [0, 0, 0] : null,
    round3_relative_residuals: ranks[3] ? [0, 0, 0] : null,
    round4_relative_residuals: ranks[4] ? [0, 0, 0] : null,
    round1_uncertainty_source: ranks[1] ? "global" : null,
    round2_uncertainty_source: ranks[2] ? "global" : null,
    round3_uncertainty_source: ranks[3] ? "global" : null,
    round4_uncertainty_source: ranks[4] ? "round4-pooled" : null,
    round1_data_quality: ranks[1] ? "inferred" : null,
    round2_data_quality: ranks[2] ? "inferred" : null,
    round3_data_quality: ranks[3] ? "inferred" : null,
    round4_data_quality: ranks[4] ? "pooled" : null,
  };
}

export const BASE_INPUT = {
  rank: 1_200,
  candidature_type_id: "type-a" as const,
  category_id: "sc" as const,
  ladies_seat_eligible: false,
  home_university_id: "savitribai-phule-pune-university" as const,
  eligibilities: {
    ews_certificate: false,
    tfws_eligible: false,
    orphan_certificate: false,
  },
  include_all: true,
};
