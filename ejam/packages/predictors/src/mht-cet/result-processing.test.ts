import { PredictionInputError } from "@ejam/data";
import {
  type MhtCetPredictionInput,
  MhtCetPredictionInput as MhtCetPredictionInputSchema,
  type MhtCetPredictionResult,
  MhtCetPredictionResult as MhtCetPredictionResultSchema,
  type MhtCetProgramPrediction,
} from "@ejam/data/mht-cet";
import { describe, expect, it } from "vitest";
import { processMhtCetResult } from "./result-processing";

const INDEX_SHA = "a".repeat(64);
const BASE_INPUT: MhtCetPredictionInput = MhtCetPredictionInputSchema.parse({
  rank: 10_000,
  candidature_type_id: "type-a",
  category_id: "open",
  ladies_seat_eligible: false,
  home_university_id: "mumbai-university",
  eligibilities: {
    ews_certificate: false,
    tfws_eligible: false,
    orphan_certificate: false,
  },
  include_all: true,
});

function program(index: number): MhtCetProgramPrediction {
  const instituteCode = String((index % 99_999) + 1).padStart(5, "0");
  const choiceCode = String(index + 1).padStart(10, "0");
  const probability = ((index % 91) + 5) / 100;
  const band =
    probability >= 0.85
      ? "safe"
      : probability >= 0.4
        ? "iffy"
        : probability >= 0.1
          ? "delulu"
          : "doesnt-matter";
  return {
    institute_id: `mht-institute-${instituteCode}`,
    institute_code: instituteCode,
    institute_name: `${index % 2 ? "Government" : "Private"} Institute ${index}`,
    institute_type: index % 2 ? "Government" : "Private",
    district: index % 3 ? "Pune" : "Mumbai",
    offering_id: `mht-choice-${choiceCode}`,
    choice_code: choiceCode,
    program_id: index % 2 ? "computer-engineering" : "civil-engineering",
    program_name: index % 2 ? "Computer Engineering" : "Civil Engineering",
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
        rounds: [1, 2],
      },
      {
        id: "mht-lopenh",
        source_code: "LOPENH",
        source_stage_label: "I",
        stage_semantics_id: "standard",
        source_seat_scope_id: "home-university",
        effective_allocation_scope_id: "home-university",
        allocation_scope_id: "home-university",
        eligible: false,
        rounds: [1, 2],
      },
    ],
    round_probabilities: {
      "1": probability,
      "2": probability,
      "3": null,
      "4": null,
    },
    round_matches: {
      "1": {
        probability,
        predicted_closing_rank: 1_000 + index,
        latest_historical_percentile: 99 - index / 100,
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
      "2": {
        probability,
        predicted_closing_rank: 1_000 + index,
        latest_historical_percentile: 99 - index / 100,
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
      "3": null,
      "4": null,
    },
    round_availability: {
      "1": { status: "available", reason: "Available." },
      "2": { status: "available", reason: "Available." },
      "3": {
        status: "offering-not-published-for-maharashtra-cap",
        reason: "Not published.",
      },
      "4": {
        status: "offering-not-published-for-maharashtra-cap",
        reason: "Not published.",
      },
    },
    overall_probability: probability,
    band,
    predicted_closing_rank: 1_000 + index,
    latest_historical_percentile: 99 - index / 100,
    data_quality: "inferred",
  };
}

function fullResult(count: number): MhtCetPredictionResult {
  const programs = Array.from({ length: count }, (_, index) => program(index));
  return MhtCetPredictionResultSchema.parse({
    programs,
    metadata: {
      model_id: "mht-cap-empirical-v3",
      target_year: 2026,
      rules_year: 2026,
      source_years: [2024, 2025],
      total_matching_offerings: programs.length,
      displayed_offerings: programs.length,
      hidden_offerings: 0,
      warnings: ["Limited history."],
      pagination: {
        returned: programs.length,
        limit: null,
        next_cursor: null,
        has_more: false,
      },
      facets: {
        institute_types: [],
        bands: { safe: 0, iffy: 0, delulu: 0, "doesnt-matter": 0 },
      },
    },
  });
}

function process(result: MhtCetPredictionResult, input: MhtCetPredictionInput) {
  return processMhtCetResult({
    fullResult: result,
    input,
    indexSha256: INDEX_SHA,
  });
}

describe("MHT-CET result pagination", () => {
  it("preserves the complete legacy response when options are omitted", () => {
    const result = process(fullResult(205), BASE_INPUT);
    expect(result.programs).toHaveLength(205);
    expect(result.metadata.pagination).toEqual({
      returned: 205,
      limit: null,
      next_cursor: null,
      has_more: false,
    });
    expect(result.programs[0].overall_probability).toBeGreaterThanOrEqual(
      result.programs[1].overall_probability,
    );
  });

  it("walks every deterministic cursor without gaps or duplicates", () => {
    const source = fullResult(205);
    const collected: string[] = [];
    let cursor: string | undefined;
    const cursors: string[] = [];
    do {
      const result = process(source, {
        ...BASE_INPUT,
        result_options: {
          limit: 100,
          sort_by: "closing-rank",
          ...(cursor ? { cursor } : {}),
        },
      });
      expect(result.programs.length).toBeLessThanOrEqual(100);
      collected.push(...result.programs.map((item) => item.offering_id));
      cursor = result.metadata.pagination.next_cursor ?? undefined;
      if (cursor) cursors.push(cursor);
    } while (cursor);

    expect(collected).toHaveLength(205);
    expect(new Set(collected).size).toBe(205);
    expect(cursors).toHaveLength(2);
    const firstAgain = process(source, {
      ...BASE_INPUT,
      result_options: { limit: 100, sort_by: "closing-rank" },
    });
    expect(firstAgain.metadata.pagination.next_cursor).toBe(cursors[0]);
  });

  it("rejects malformed and request-mismatched cursors", () => {
    const source = fullResult(120);
    const first = process(source, {
      ...BASE_INPUT,
      result_options: { limit: 100, sort_by: "chance" },
    });
    const cursor = first.metadata.pagination.next_cursor;
    expect(cursor).not.toBeNull();
    expect(() =>
      process(source, {
        ...BASE_INPUT,
        rank: BASE_INPUT.rank + 1,
        result_options: {
          limit: 100,
          sort_by: "chance",
          cursor: cursor ?? undefined,
        },
      }),
    ).toThrow(PredictionInputError);
    expect(() =>
      process(source, {
        ...BASE_INPUT,
        result_options: {
          limit: 100,
          sort_by: "chance",
          cursor: "not-a-valid-cursor",
        },
      }),
    ).toThrow(PredictionInputError);
  });

  it("searches and facets the complete result before pagination", () => {
    const result = process(fullResult(205), {
      ...BASE_INPUT,
      filters: { institute_type: ["Government"] },
      result_options: {
        limit: 100,
        search: "engineering",
        sort_by: "institute",
      },
    });
    expect(
      result.programs.every((item) => item.institute_type === "Government"),
    ).toBe(true);
    expect(result.metadata.displayed_offerings).toBeGreaterThan(100);
    expect(result.metadata.facets.institute_types).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "Private" }),
        expect.objectContaining({ value: "Government" }),
      ]),
    );
    expect(result.programs[0].seat_pools_considered).toHaveLength(2);
  });

  it("matches full numeric codes exactly without fuzzy neighbours", () => {
    const result = process(fullResult(205), {
      ...BASE_INPUT,
      result_options: {
        limit: 100,
        search: "0000000100",
        sort_by: "chance",
      },
    });

    expect(result.programs.map((item) => item.choice_code)).toEqual([
      "0000000100",
    ]);
  });
});
