import { describe, expect, it } from "vitest";
import {
  decodeMhtCetPredictionResult,
  encodeMhtCetPagedPredictionResult,
  MhtCetPredictionResult,
  type MhtCetPredictionResult as MhtCetPredictionResultType,
} from "../../mht-cet";

function result(): MhtCetPredictionResultType {
  return MhtCetPredictionResult.parse({
    programs: [
      {
        institute_id: "mht-institute-01234",
        institute_code: "01234",
        institute_name: "Official Institute",
        institute_type: "Government",
        district: "Pune",
        offering_id: "mht-choice-0123412345",
        choice_code: "0123412345",
        program_id: "computer-engineering",
        program_name: "Computer Engineering",
        best_round: 1,
        best_eligible_seat_pool: {
          id: "mht-gopenh",
          source_code: "GOPENH",
          label: "Open home-university seat",
          source_stage_label: "I",
          stage_semantics_id: "standard",
          source_seat_scope_id: "home-university",
          effective_allocation_scope_id: "home-university",
          allocation_scope_id: "home-university",
          effective_eligibility_description:
            "Original seat-pool eligibility; effective candidate scope: home-university",
          round: 1,
        },
        seat_pools_considered: [
          {
            id: "mht-gopenh",
            source_code: "GOPENH",
            source_stage_label: "I",
            stage_semantics_id: "standard",
            source_seat_scope_id: "home-university",
            effective_allocation_scope_id: "home-university",
            allocation_scope_id: "home-university",
            eligible: true,
            rounds: [1],
          },
          {
            id: "mht-lopeno",
            source_code: "LOPENO",
            source_stage_label: "I",
            stage_semantics_id: "standard",
            source_seat_scope_id: "other-university",
            effective_allocation_scope_id: "other-university",
            allocation_scope_id: "other-university",
            eligible: false,
            rounds: [1],
          },
        ],
        round_probabilities: {
          "1": 0.9,
          "2": null,
          "3": null,
          "4": null,
        },
        round_matches: {
          "1": {
            probability: 0.9,
            predicted_closing_rank: 5_500,
            latest_historical_percentile: 97.5,
            seat_pool_id: "mht-gopenh",
            source_code: "GOPENH",
            source_seat_scope_id: "home-university",
            effective_allocation_scope_id: "home-university",
            allocation_scope_id: "home-university",
            stage: {
              source_label: "I",
              source_year: 2025,
              semantics_id: "standard",
              conversion_applied: false,
              description: "Original seat-pool eligibility",
              active_rule: {
                rules_year: 2026,
                stage_id: "stage-i",
                stage_label: "I",
              },
            },
            effective_eligibility_description:
              "Original seat-pool eligibility; effective candidate scope: home-university",
            data_quality: "inferred",
          },
          "2": null,
          "3": null,
          "4": null,
        },
        round_availability: {
          "1": {
            status: "available",
            reason:
              "Official Maharashtra CAP rank cutoff is available for round 1.",
          },
          "2": {
            status: "offering-not-published-for-maharashtra-cap",
            reason:
              "This offering was not published in the official Maharashtra CAP round 2 cutoff inventory.",
          },
          "3": {
            status: "offering-not-published-for-maharashtra-cap",
            reason:
              "This offering was not published in the official Maharashtra CAP round 3 cutoff inventory.",
          },
          "4": {
            status: "offering-not-published-for-maharashtra-cap",
            reason:
              "This offering was not published in the official Maharashtra CAP round 4 cutoff inventory.",
          },
        },
        overall_probability: 0.9,
        band: "safe",
        predicted_closing_rank: 5_500,
        latest_historical_percentile: 97.5,
        data_quality: "inferred",
      },
    ],
    metadata: {
      model_id: "mht-cap-empirical-v3",
      target_year: 2026,
      rules_year: 2026,
      source_years: [2024, 2025],
      total_matching_offerings: 1,
      displayed_offerings: 1,
      hidden_offerings: 0,
      warnings: ["Limited history."],
      pagination: {
        returned: 1,
        limit: 100,
        next_cursor: null,
        has_more: false,
      },
      facets: {
        institute_types: [{ value: "Government", count: 1 }],
        bands: { safe: 1, iffy: 0, delulu: 0, "doesnt-matter": 0 },
      },
    },
  });
}

describe("MHT-CET paged response transport", () => {
  it("round-trips complete seat-pool details losslessly", () => {
    const original = result();
    const compact = encodeMhtCetPagedPredictionResult(original);

    expect(compact.transport_encoding).toBe("mht-cet-page-v3");
    expect(compact.programs[0].seat_pools_considered).toEqual([
      [0, 0, 0, 0, 1, 1],
      [1, 0, 1, 1, 0, 1],
    ]);
    expect(decodeMhtCetPredictionResult(compact)).toEqual(original);
  });

  it("continues to decode the legacy full result shape", () => {
    const original = result();
    expect(decodeMhtCetPredictionResult(original)).toEqual(original);
  });

  it("rejects malformed dictionary references", () => {
    const compact = encodeMhtCetPagedPredictionResult(result());
    const malformed = structuredClone(compact);
    malformed.programs[0].seat_pools_considered[0][0] = 99;

    expect(decodeMhtCetPredictionResult(malformed)).toBeNull();
  });

  it("rejects partially populated active-rule dictionary entries", () => {
    const compact = encodeMhtCetPagedPredictionResult(result());
    const malformed = structuredClone(compact);
    const activeStage = malformed.stage_dictionary.find(
      (stage) => stage.active_rule_id !== null,
    );
    if (!activeStage) throw new Error("fixture is missing an active stage");
    activeStage.active_rule_label = null;

    expect(decodeMhtCetPredictionResult(malformed)).toBeNull();
  });

  it("never applies compact encoding to legacy non-paginated results", () => {
    const legacy = result();
    legacy.metadata.pagination.limit = null;

    expect(() => encodeMhtCetPagedPredictionResult(legacy)).toThrow(
      "cannot compact a non-paginated MHT-CET result",
    );
  });
});
