import {
  encodeMhtCetPagedPredictionResult,
  MhtCetPredictionResult,
} from "@ejam/data/mht-cet/browser";
import { describe, expect, it } from "vitest";
import {
  buildJeePredictionRequest,
  buildMhtCetPredictionRequest,
  decodePredictionSuccess,
  supportedSortModes,
} from "@/lib/predictor-adapters";

const PROVENANCE = {
  exam_id: "mht-cet",
  manifest_version: "1.0.0",
  datasets_used: [
    {
      dataset: "predictor_index",
      path: "data/tools/college-predictor/maharashtra-cap/predictor-index.parquet",
      sha256: "a".repeat(64),
      role: "loaded",
    },
  ],
  generated_at: "2026-07-26T00:00:00.000Z",
};

describe("predictor request adapters", () => {
  it("keeps JEE Main and CSAB serialization unchanged", () => {
    expect(
      buildJeePredictionRequest({
        rank: "12345",
        apiSeatType: "OPEN",
        apiGender: "Gender-Neutral",
        quota: "hs",
        homeState: "Maharashtra",
        hasEwsCertificate: false,
        usesQuotaHomeState: true,
      }),
    ).toEqual({
      rank: 12345,
      seat_type: "OPEN",
      gender: "Gender-Neutral",
      has_ews_certificate: false,
      include_all: true,
      quota: "HS",
      state: "Maharashtra",
    });
  });

  it("keeps JEE Advanced free of quota and state fields", () => {
    expect(
      buildJeePredictionRequest({
        rank: "2000",
        apiSeatType: "SC",
        apiGender: "Female-only (including Supernumerary)",
        quota: "os",
        homeState: "Maharashtra",
        hasEwsCertificate: false,
        usesQuotaHomeState: false,
      }),
    ).toEqual({
      rank: 2000,
      seat_type: "SC",
      gender: "Female-only (including Supernumerary)",
      has_ews_certificate: false,
      include_all: true,
    });
  });

  it("builds the structured MHT-CET eligibility request", () => {
    expect(
      buildMhtCetPredictionRequest({
        rank: "5000",
        candidatureTypeId: "type-a",
        categoryId: "open",
        ladiesSeatEligible: true,
        homeUniversityId: "mumbai-university",
        ewsCertificate: true,
        tfwsEligible: false,
        pwdCategoryId: "",
        orphanCertificate: false,
        minorityCommunityId: "",
        includeAll: false,
      }),
    ).toEqual({
      rank: 5000,
      candidature_type_id: "type-a",
      category_id: "open",
      ladies_seat_eligible: true,
      home_university_id: "mumbai-university",
      eligibilities: {
        ews_certificate: true,
        tfws_eligible: false,
        orphan_certificate: false,
      },
      include_all: false,
    });
  });
});

describe("predictor response adapters", () => {
  it("runtime-validates MHT results and preserves four nullable rounds", () => {
    const result = {
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
          best_round: 3,
          best_eligible_seat_pool: {
            id: "mht-gopenh",
            source_code: "GOPENH",
            label: "GOPENH",
            source_stage_label: "I",
            stage_semantics_id: "standard",
            source_seat_scope_id: "home-university",
            effective_allocation_scope_id: "home-university",
            allocation_scope_id: "home-university",
            effective_eligibility_description:
              "Original seat-pool eligibility; effective candidate scope: home-university",
            round: 3,
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
              rounds: [1, 3],
            },
          ],
          round_probabilities: {
            "1": 0.8,
            "2": null,
            "3": 0.9,
            "4": null,
          },
          round_matches: {
            "1": {
              probability: 0.8,
              predicted_closing_rank: 5500,
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
            "3": {
              probability: 0.9,
              predicted_closing_rank: 6000,
              latest_historical_percentile: 97.12345,
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
            "4": null,
          },
          round_availability: {
            "1": { status: "available", reason: "Available." },
            "2": {
              status: "offering-not-published-for-maharashtra-cap",
              reason: "Not published.",
            },
            "3": { status: "available", reason: "Available." },
            "4": {
              status: "offering-not-published-for-maharashtra-cap",
              reason: "Not published.",
            },
          },
          overall_probability: 0.9,
          band: "safe",
          predicted_closing_rank: 6000,
          latest_historical_percentile: 97.12345,
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
          bands: {
            safe: 1,
            iffy: 0,
            delulu: 0,
            "doesnt-matter": 0,
          },
        },
      },
    };
    const decoded = decodePredictionSuccess("mht-cet", {
      ok: true,
      exam_id: "mht-cet",
      provenance: PROVENANCE,
      result,
    });
    expect(decoded?.result.programs[0].roundProbabilities).toEqual([
      0.8,
      null,
      0.9,
      null,
    ]);
    expect(decoded?.result.programs[0].roundDetails?.[1]).toBeNull();
    expect(decoded?.result.programs[0].roundDetails?.[2]?.sourceCode).toBe(
      "GOPENH",
    );
    expect(
      decoded?.result.programs[0].roundDetails?.[2]?.stageSemanticsId,
    ).toBe("standard");
    expect(decoded?.result.programs[0].roundAvailability?.[1]?.status).toBe(
      "offering-not-published-for-maharashtra-cap",
    );
    expect(decoded?.result.programs[0].choiceCode).toBe("0123412345");

    const compactDecoded = decodePredictionSuccess("mht-cet", {
      ok: true,
      exam_id: "mht-cet",
      provenance: PROVENANCE,
      result: encodeMhtCetPagedPredictionResult(
        MhtCetPredictionResult.parse(result),
      ),
    });
    expect(compactDecoded?.result.programs[0].seatPoolsConsidered).toEqual(
      decoded?.result.programs[0].seatPoolsConsidered,
    );
  });

  it("rejects an exam-mismatched success envelope", () => {
    expect(
      decodePredictionSuccess("jee-main", {
        ok: true,
        exam_id: "mht-cet",
        provenance: PROVENANCE,
        result: {},
      }),
    ).toBeNull();
  });

  it("does not expose balanced ranking for MHT-CET", () => {
    expect(supportedSortModes("mht-cet")).toEqual([
      "chance",
      "closing-rank",
      "institute",
    ]);
    expect(supportedSortModes("jee-main")).toContain("balanced");
  });
});
