import { describe, expect, it } from "vitest";
import {
  computeMhtCetRoundProbabilities,
  loadMhtCetSeatPoolRegistry,
  maxSupportedRoundProbability,
  predictMhtCetPrograms,
} from "../../mht-cet";
import { BASE_INPUT, indexRow } from "./fixtures";

describe("MHT-CET probability engine", () => {
  it("uses the maximum supported round probability without adding rounds", () => {
    const probabilities = computeMhtCetRoundProbabilities(
      1_200,
      indexRow("mht-gopenh", { 1: 1_000, 2: 1_300, 4: 1_500 }),
    );
    expect(probabilities["3"]).toBeNull();
    expect(maxSupportedRoundProbability(probabilities)).toBe(1);
  });

  it("evaluates pools separately and returns every considered pool", () => {
    const result = predictMhtCetPrograms({
      input: BASE_INPUT,
      indexRows: [
        indexRow("mht-gopenh", { 1: 1_000 }),
        indexRow("mht-gsch", { 1: 1_500 }),
      ],
      seatPoolRegistry: loadMhtCetSeatPoolRegistry(),
    });
    expect(result.programs).toHaveLength(1);
    expect(result.programs[0].best_eligible_seat_pool.source_code).toBe("GSCH");
    expect(result.programs[0].seat_pools_considered).toEqual([
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
        id: "mht-gsch",
        source_code: "GSCH",
        source_stage_label: "I",
        stage_semantics_id: "standard",
        source_seat_scope_id: "home-university",
        effective_allocation_scope_id: "home-university",
        allocation_scope_id: "home-university",
        eligible: true,
        rounds: [1],
      },
    ]);
    expect(result.programs[0].overall_probability).toBe(1);
  });

  it("limits Type E candidature to OHU and state-level pools", () => {
    const result = predictMhtCetPrograms({
      input: {
        ...BASE_INPUT,
        candidature_type_id: "type-e",
        category_id: "open",
        home_university_id: undefined,
      },
      indexRows: [
        indexRow("mht-gopenh", { 1: 1_500 }),
        indexRow("mht-gopeno", { 1: 1_400 }),
      ],
      seatPoolRegistry: loadMhtCetSeatPoolRegistry(),
    });
    expect(result.programs[0].best_eligible_seat_pool.source_code).toBe(
      "GOPENO",
    );
    expect(result.programs[0].seat_pools_considered).toContainEqual({
      id: "mht-gopenh",
      source_code: "GOPENH",
      source_stage_label: "I",
      stage_semantics_id: "standard",
      source_seat_scope_id: "home-university",
      effective_allocation_scope_id: "home-university",
      allocation_scope_id: "home-university",
      eligible: false,
      rounds: [1],
    });
  });

  it("selects the best eligible seat pool independently for each round", () => {
    const result = predictMhtCetPrograms({
      input: BASE_INPUT,
      indexRows: [
        indexRow("mht-gopenh", { 1: 1_500 }),
        indexRow("mht-gsch", { 2: 1_600 }),
      ],
      seatPoolRegistry: loadMhtCetSeatPoolRegistry(),
    });
    expect(result.programs[0].round_matches["1"]?.source_code).toBe("GOPENH");
    expect(result.programs[0].round_matches["2"]?.source_code).toBe("GSCH");
    expect(result.programs[0].round_matches["3"]).toBeNull();
    expect(result.programs[0].best_round).toBe(2);
  });

  it("makes Stage VII available without the source special certificate", () => {
    const result = predictMhtCetPrograms({
      input: {
        ...BASE_INPUT,
        category_id: "open",
      },
      indexRows: [
        indexRow("mht-orphan", { 2: 2_000 }),
        indexRow(
          "mht-orphan",
          { 2: 2_000 },
          {
            sourceStageLabel: "VII",
            stageSemanticsId: "unrestricted-maharashtra-merit",
          },
        ),
      ],
      seatPoolRegistry: loadMhtCetSeatPoolRegistry(),
    });
    expect(result.programs[0].round_matches["2"]?.stage.semantics_id).toBe(
      "unrestricted-maharashtra-merit",
    );
    expect(
      result.programs[0].round_matches["2"]?.stage.conversion_applied,
    ).toBe(true);
    expect(result.programs[0].round_matches["2"]?.stage).toMatchObject({
      source_label: "VII",
      source_year: 2025,
      active_rule: {
        rules_year: 2026,
        stage_id: "stage-iv",
        stage_label: "IV",
      },
    });
  });

  it("excludes standard Defence pools but keeps converted Non-Defence stages", () => {
    const standard = predictMhtCetPrograms({
      input: { ...BASE_INPUT, category_id: "open" },
      indexRows: [indexRow("mht-defopens", { 1: 1_500 })],
      seatPoolRegistry: loadMhtCetSeatPoolRegistry(),
    });
    expect(standard.programs).toEqual([]);

    const converted = predictMhtCetPrograms({
      input: { ...BASE_INPUT, category_id: "open" },
      indexRows: [
        indexRow(
          "mht-defopens",
          { 1: 1_500 },
          {
            sourceStageLabel: "I-Non Defence",
            stageSemanticsId: "defence-released-to-base-category",
          },
        ),
      ],
      seatPoolRegistry: loadMhtCetSeatPoolRegistry(),
    });
    expect(converted.programs[0].round_matches["1"]?.stage).toMatchObject({
      source_label: "I-Non Defence",
      semantics_id: "defence-released-to-base-category",
      active_rule: { stage_id: "stage-i" },
    });
  });

  it("rejects an invalid historical source-label and semantic pairing", () => {
    expect(() =>
      predictMhtCetPrograms({
        input: { ...BASE_INPUT, category_id: "open" },
        indexRows: [
          indexRow(
            "mht-gopenh",
            { 1: 1_500 },
            {
              sourceStageLabel: "VII",
              stageSemanticsId: "standard",
            },
          ),
        ],
        seatPoolRegistry: loadMhtCetSeatPoolRegistry(),
      }),
    ).toThrow(/stage mismatch/);
  });

  it("keeps ladies Stage I and Stage II eligibility separate", () => {
    const rows = [
      indexRow("mht-lopenh", { 1: 1_500 }),
      indexRow(
        "mht-lopenh",
        { 1: 1_600 },
        {
          sourceStageLabel: "II",
          stageSemanticsId: "ladies-to-male-same-category",
        },
      ),
    ];
    const nonLadies = predictMhtCetPrograms({
      input: {
        ...BASE_INPUT,
        category_id: "open",
      },
      indexRows: rows,
      seatPoolRegistry: loadMhtCetSeatPoolRegistry(),
    });
    expect(nonLadies.programs[0].round_matches["1"]?.stage.semantics_id).toBe(
      "ladies-to-male-same-category",
    );

    const ladies = predictMhtCetPrograms({
      input: {
        ...BASE_INPUT,
        category_id: "open",
        ladies_seat_eligible: true,
      },
      indexRows: rows,
      seatPoolRegistry: loadMhtCetSeatPoolRegistry(),
    });
    expect(ladies.programs[0].round_matches["1"]?.stage.semantics_id).toBe(
      "standard",
    );
  });

  it("keeps minority Stage I separate from the Maharashtra conversion", () => {
    const result = predictMhtCetPrograms({
      input: BASE_INPUT,
      indexRows: [
        indexRow("mht-mi", { 2: 1_500 }),
        indexRow(
          "mht-mi",
          { 2: 1_600 },
          {
            sourceStageLabel: "MH",
            stageSemanticsId: "minority-to-maharashtra",
          },
        ),
      ],
      seatPoolRegistry: loadMhtCetSeatPoolRegistry(),
    });
    expect(result.programs[0].round_matches["2"]?.stage.semantics_id).toBe(
      "minority-to-maharashtra",
    );
    expect(result.programs[0].seat_pools_considered).toHaveLength(2);
  });

  it("releases a Non-PwD stage to its retained base category", () => {
    const result = predictMhtCetPrograms({
      input: {
        ...BASE_INPUT,
        category_id: "open",
      },
      indexRows: [
        indexRow(
          "mht-pwdopenh",
          { 1: 1_500 },
          {
            sourceStageLabel: "I-Non PWD",
            stageSemanticsId: "pwd-released-to-base-category",
          },
        ),
      ],
      seatPoolRegistry: loadMhtCetSeatPoolRegistry(),
    });
    expect(result.programs[0].round_matches["1"]?.stage.semantics_id).toBe(
      "pwd-released-to-base-category",
    );
  });

  it("explains every unavailable round from the official inventory", () => {
    const result = predictMhtCetPrograms({
      input: BASE_INPUT,
      indexRows: [
        indexRow("mht-gopenh", { 1: 1_500 }, { percentileOnlyRounds: [2] }),
        indexRow("mht-gobch", { 3: 1_600 }),
      ],
      seatPoolRegistry: loadMhtCetSeatPoolRegistry(),
    });
    expect(result.programs[0].round_availability).toMatchObject({
      "1": { status: "available" },
      "2": { status: "percentile-only-rank-zero" },
      "3": { status: "no-eligible-stage-for-profile" },
      "4": { status: "offering-not-published-for-maharashtra-cap" },
    });
  });
});
