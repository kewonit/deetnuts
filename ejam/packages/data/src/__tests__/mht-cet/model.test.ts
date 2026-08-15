import { describe, expect, it } from "vitest";
import {
  buildMhtCetPredictorIndex,
  loadMhtCetSeatPoolRegistry,
  type MhtCetCutoffRow,
  type MhtCetInstituteReference,
  type MhtCetModelConfiguration,
} from "../../mht-cet";

function cutoff(options: {
  year: 2024 | 2025;
  round: 1 | 2 | 3 | 4;
  rank: number;
  instituteCode?: string;
  choiceCode?: string;
  allocationScopeId?:
    | "home-university"
    | "other-university"
    | "state-level"
    | "maharashtra-state";
  sourceSeatScopeId?:
    | "home-university"
    | "other-university"
    | "state-level"
    | "maharashtra-state";
  sourceAllocationSection?:
    | "HOME_TO_HOME"
    | "HOME_TO_OTHER"
    | "OTHER_TO_OTHER"
    | "OTHER_TO_HOME"
    | "STATE_LEVEL"
    | "MAHARASHTRA_STATE";
}): MhtCetCutoffRow {
  const instituteCode = options.instituteCode ?? "01234";
  const choiceCode = options.choiceCode ?? "0123412345";
  return {
    schema_version: 3,
    exam_id: "mht-cet",
    counselling_id: "maharashtra-cap",
    year: options.year,
    round: options.round,
    institute_id: `mht-institute-${instituteCode}`,
    institute_code: instituteCode,
    source_institute_name: "Source Institute",
    offering_id: `mht-choice-${choiceCode.toLowerCase()}`,
    choice_code: choiceCode,
    program_id: "computer-engineering",
    program_name: "Computer Engineering",
    source_program_name: "Computer Engineering",
    seat_pool_id: "mht-gopenh",
    source_category_code: "GOPENH",
    source_stage_label: "I",
    source_stage_sequence: 1,
    stage_semantics_id: "standard",
    source_seat_scope_id:
      options.sourceSeatScopeId ??
      options.allocationScopeId ??
      "home-university",
    effective_allocation_scope_id:
      options.allocationScopeId ?? "home-university",
    source_allocation_section:
      options.sourceAllocationSection ?? "HOME_TO_HOME",
    closing_rank: options.rank,
    closing_percentile: 95.1234567,
    total_admitted: 1,
    source_id: `mht-cet.${options.year}.cap${options.round}`,
    source_locator: `official-${options.year}-${options.round}.pdf`,
    source_table: `source-${options.year}-${options.round}`,
    source_row_id: `${instituteCode}-${choiceCode}-${options.round}`,
    snapshot_sha256: "a".repeat(64),
  };
}

const MODEL_CONFIG: MhtCetModelConfiguration = {
  schema_version: 1,
  model_id: "mht-cap-empirical-v3",
  target_year: 2026,
  rules_year: 2026,
  source_years: [2024, 2025],
  minimum_stratum_size: 3,
  band_thresholds: {
    safe: 0.85,
    iffy: 0.4,
    delulu: 0.1,
  },
  release_gates: {
    within_20_percent_minimum: 0.3,
    interval_80_coverage_minimum: 0.7,
    interval_80_coverage_maximum: 0.9,
    interval_95_coverage_minimum: 0.9,
  },
};

function instituteReference(code: string): MhtCetInstituteReference {
  return {
    schema_version: 1,
    year: 2025,
    institute_id: `mht-institute-${code}`,
    institute_code: code,
    institute_name: `Official Institute ${code}`,
    institute_type: "Government",
    district: "Pune",
    home_university_id: "savitribai-phule-pune-university",
    affiliating_university_id: "official-affiliating-university",
    minority_community_id: null,
    source_id: "mht-cet.2025.institute-list",
    source_locator: "official-institutes-2025.pdf",
  };
}

describe("MHT-CET model construction", () => {
  it("falls back deterministically and pools round four separately", () => {
    const rows = [
      cutoff({ year: 2024, round: 1, rank: 1_000 }),
      cutoff({ year: 2025, round: 1, rank: 1_100 }),
      cutoff({ year: 2025, round: 3, rank: 1_200 }),
      cutoff({ year: 2025, round: 4, rank: 1_800 }),
      cutoff({
        year: 2024,
        round: 1,
        rank: 2_000,
        instituteCode: "05678",
        choiceCode: "0567812345",
      }),
      cutoff({
        year: 2025,
        round: 1,
        rank: 1_800,
        instituteCode: "05678",
        choiceCode: "0567812345",
      }),
      cutoff({
        year: 2025,
        round: 3,
        rank: 2_000,
        instituteCode: "05678",
        choiceCode: "0567812345",
      }),
      cutoff({
        year: 2025,
        round: 4,
        rank: 1_000,
        instituteCode: "05678",
        choiceCode: "0567812345",
      }),
    ];
    const index = buildMhtCetPredictorIndex({
      cutoffRows: rows,
      instituteReferences: [
        instituteReference("01234"),
        instituteReference("05678"),
      ],
      seatPools: loadMhtCetSeatPoolRegistry().entries,
      config: MODEL_CONFIG,
    });
    expect(index[0].round1_uncertainty_source).toBe("global");
    expect(index[0].round4_uncertainty_source).toBe("round4-pooled");
    expect(index[0].round4_relative_residuals).toEqual([-0.5, 0.5]);
    expect(index[0].round1_data_quality).toBe("inferred");
    expect(index[0].round3_data_quality).toBe("pooled");
    expect(index[0].round4_data_quality).toBe("pooled");
    expect(index.every((row) => row.data_quality === "inferred")).toBe(true);
  });

  it("keeps the same seat-pool code separate across effective scopes", () => {
    const rows = [
      cutoff({ year: 2024, round: 1, rank: 1_000 }),
      cutoff({ year: 2025, round: 1, rank: 1_100 }),
      cutoff({
        year: 2024,
        round: 1,
        rank: 2_000,
        allocationScopeId: "other-university",
        sourceSeatScopeId: "home-university",
        sourceAllocationSection: "HOME_TO_OTHER",
      }),
      cutoff({
        year: 2025,
        round: 1,
        rank: 2_200,
        allocationScopeId: "other-university",
        sourceSeatScopeId: "home-university",
        sourceAllocationSection: "HOME_TO_OTHER",
      }),
    ];
    const index = buildMhtCetPredictorIndex({
      cutoffRows: rows,
      instituteReferences: [instituteReference("01234")],
      seatPools: loadMhtCetSeatPoolRegistry().entries,
      config: MODEL_CONFIG,
    });

    expect(index).toHaveLength(2);
    expect(
      index.map((row) => [row.allocation_scope_id, row.round1_rank]),
    ).toEqual([
      ["home-university", 1_100],
      ["other-university", 2_200],
    ]);
  });
});
