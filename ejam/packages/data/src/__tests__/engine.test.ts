/**
 * probability engine tests
 *
 * tests assert observable outputs for known inputs — not implementation details.
 * the normalCDF approximation (Abramowitz & Stegun 7.1.26) has a max error of
 * ~5e-5, so tolerances are set to 3 decimal places throughout.
 **/

import { describe, expect, it } from "vitest";
import {
  type CollegePredictorIndexRow,
  classifyBand,
  computeAverageRoundProbability,
  computeProbability,
  computeRoundProbs,
  DELULU_BAND_MIN_PROBABILITY,
  normalCDF,
  type ProgramPrediction,
  predictPrograms,
  sortByChance,
  sortByClosingRank,
} from "../college-predictor/engine";

describe("normalCDF", () => {
  it("returns 0.5 at x=0", () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 4);
  });

  it("returns ~0.8413 at x=1", () => {
    expect(normalCDF(1)).toBeCloseTo(0.8413, 3);
  });

  it("returns ~0.1587 at x=-1 (symmetry)", () => {
    expect(normalCDF(-1)).toBeCloseTo(0.1587, 3);
  });

  it("returns ~0.9750 at x=1.96 (95% CI boundary)", () => {
    expect(normalCDF(1.96)).toBeCloseTo(0.975, 3);
  });

  it("returns ~0.9987 at x=3", () => {
    expect(normalCDF(3)).toBeCloseTo(0.9987, 3);
  });

  it("returns ~0.0013 at x=-3 (symmetry)", () => {
    expect(normalCDF(-3)).toBeCloseTo(0.0013, 3);
  });

  it("satisfies Φ(x) + Φ(-x) = 1 for arbitrary x", () => {
    for (const x of [0.5, 1.2, 2.5, -0.8]) {
      expect(normalCDF(x) + normalCDF(-x)).toBeCloseTo(1, 10);
    }
  });

  it("is monotonically increasing", () => {
    const xs = [-3, -2, -1, 0, 1, 2, 3];
    for (let i = 0; i < xs.length - 1; i++) {
      const current = xs[i];
      const next = xs[i + 1];
      expect(current).toBeDefined();
      expect(next).toBeDefined();
      if (current === undefined || next === undefined) continue;
      expect(normalCDF(current)).toBeLessThan(normalCDF(next));
    }
  });
});

describe("computeProbability", () => {
  it("returns ~0.5 when student rank equals predicted closing rank", () => {
    // boundary student is 50/50 by definition — this is the calibration invariant
    expect(computeProbability(1000, 1000, 100)).toBeCloseTo(0.5, 2);
  });

  it("returns > 0.5 when student rank is better than predicted closing rank", () => {
    expect(computeProbability(800, 1000, 100)).toBeGreaterThan(0.5);
  });

  it("returns < 0.5 when student rank is worse than predicted closing rank", () => {
    expect(computeProbability(1200, 1000, 100)).toBeLessThan(0.5);
  });

  it("approaches 1 when student rank is far better than closing rank", () => {
    expect(computeProbability(100, 1000, 100)).toBeGreaterThan(0.99);
  });

  it("approaches 0 when student rank is far worse than closing rank", () => {
    expect(computeProbability(5000, 1000, 100)).toBeLessThan(0.01);
  });

  it("uses sigma floor of 1 to avoid division by zero", () => {
    // sigma=0 would produce NaN without the floor; this guards that invariant
    const p = computeProbability(1000, 1000, 0);
    expect(Number.isFinite(p)).toBe(true);
  });
});

describe("classifyBand", () => {
  it("classifies ≥ 0.85 as safe", () => {
    expect(classifyBand(0.85)).toBe("safe");
    expect(classifyBand(1.0)).toBe("safe");
  });

  it("classifies 0.40–0.84 as iffy", () => {
    expect(classifyBand(0.4)).toBe("iffy");
    expect(classifyBand(0.84)).toBe("iffy");
  });

  it("classifies 0.10–0.39 as delulu", () => {
    expect(classifyBand(0.1)).toBe("delulu");
    expect(classifyBand(0.39)).toBe("delulu");
  });

  it("classifies < 0.10 as doesnt-matter", () => {
    expect(classifyBand(0.09)).toBe("doesnt-matter");
    expect(classifyBand(0)).toBe("doesnt-matter");
  });
});

function makeRow(
  overrides: Partial<CollegePredictorIndexRow> = {},
): CollegePredictorIndexRow {
  return {
    institute_id: "test-inst",
    program_id: "test-prog",
    seat_type: "OPEN",
    quota: "AI",
    gender: "Gender-Neutral",
    instype: "NIT",
    degree: "B.Tech",
    duration_years: 4,
    weighted_mean: 1000,
    weighted_std: 100,
    trend_slope: 0,
    sigma_base: 100,
    sigma_effective: 100,
    predicted_closing_rank: 1000,
    data_quality: "sufficient",
    years_of_data: 4,
    last_data_year: 2024,
    min_closing_rank: 800,
    max_closing_rank: 1200,
    round1_mean: 900,
    round2_mean: 950,
    round3_mean: 980,
    round4_mean: 1000,
    round5_mean: 1010,
    round6_mean: 1020,
    fill_round: 6,
    ...overrides,
  };
}

describe("computeRoundProbs", () => {
  it("always returns an array of length 6", () => {
    expect(computeRoundProbs(1000, makeRow())).toHaveLength(6);
  });

  it("probabilities are non-decreasing across rounds (cumulative)", () => {
    const probs = computeRoundProbs(800, makeRow());
    for (let i = 0; i < probs.length - 1; i++) {
      const current = probs[i];
      const next = probs[i + 1];
      expect(current).toBeDefined();
      expect(next).toBeDefined();
      if (current === undefined || next === undefined) continue;
      expect(current).toBeLessThanOrEqual(next + 0.0001);
    }
  });

  it("freezes at fill_round value for subsequent rounds", () => {
    // fill_round=3 means rounds 4–6 must equal round 3's cumulative value
    const probs = computeRoundProbs(1000, makeRow({ fill_round: 3 }));
    const round3 = probs[2];
    expect(round3).toBeDefined();
    if (round3 === undefined) return;
    expect(probs[3]).toBeCloseTo(round3, 4);
    expect(probs[4]).toBeCloseTo(round3, 4);
    expect(probs[5]).toBeCloseTo(round3, 4);
  });

  it("all values are in [0, 1]", () => {
    for (const p of computeRoundProbs(1000, makeRow())) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it("handles null round means by freezing at the last known cumulative value", () => {
    const row = makeRow({
      round3_mean: null,
      round4_mean: null,
      round5_mean: null,
      round6_mean: null,
      fill_round: 2,
    });
    const probs = computeRoundProbs(1000, row);
    expect(probs).toHaveLength(6);
    const round2 = probs[1];
    expect(round2).toBeDefined();
    if (round2 === undefined) return;
    expect(probs[2]).toBeCloseTo(round2, 4);
  });
});

describe("computeAverageRoundProbability", () => {
  it("averages only active rounds up to fill_round", () => {
    const probs = [0.3, 0.5, 0.7, 0.7, 0.7, 0.7];
    expect(computeAverageRoundProbability(probs, 3)).toBeCloseTo(0.5, 4);
  });

  it("includes all rounds when fill_round is 6", () => {
    const probs = [0.2, 0.4, 0.5, 0.6, 0.65, 0.7];
    expect(computeAverageRoundProbability(probs, 6)).toBeCloseTo(0.5083, 3);
  });

  it("returns 0 for empty round probs", () => {
    expect(computeAverageRoundProbability([], 3)).toBe(0);
  });
});

function makePrediction(
  overrides: Partial<ProgramPrediction> = {},
): ProgramPrediction {
  return {
    institute_id: "nit-a",
    program_id: "cse",
    seat_type: "OPEN",
    quota: "AI",
    gender: "Gender-Neutral",
    instype: "NIT",
    degree: "B.Tech",
    duration_years: 4,
    weighted_mean: 2000,
    predicted_closing_rank: 2000,
    sigma_effective: 200,
    cumulative_probability: 0.5,
    band: "iffy",
    data_quality: "sufficient",
    years_of_data: 4,
    last_data_year: 2024,
    fill_round: 6,
    round_probs: [0.4, 0.5, 0.6],
    ...overrides,
  };
}

describe("sortByChance", () => {
  it("orders by cumulative_probability descending within the same band", () => {
    const sorted = sortByChance([
      makePrediction({
        institute_id: "nit-a",
        cumulative_probability: 0.45,
        band: "iffy",
        predicted_closing_rank: 1000,
      }),
      makePrediction({
        institute_id: "nit-b",
        cumulative_probability: 0.8,
        band: "iffy",
        predicted_closing_rank: 9000,
      }),
    ]);

    expect(sorted.map((p) => p.institute_id)).toEqual(["nit-b", "nit-a"]);
  });

  it("puts higher-chance bands before lower-chance bands", () => {
    const sorted = sortByChance([
      makePrediction({
        institute_id: "reach",
        cumulative_probability: 0.15,
        band: "delulu",
      }),
      makePrediction({
        institute_id: "safe",
        cumulative_probability: 0.9,
        band: "safe",
      }),
    ]);

    expect(sorted.map((p) => p.institute_id)).toEqual(["safe", "reach"]);
  });

  it("breaks equal probabilities by ascending closing rank", () => {
    const sorted = sortByChance([
      makePrediction({
        institute_id: "later",
        cumulative_probability: 0.6,
        predicted_closing_rank: 5000,
      }),
      makePrediction({
        institute_id: "earlier",
        cumulative_probability: 0.6,
        predicted_closing_rank: 3000,
      }),
    ]);

    expect(sorted.map((p) => p.institute_id)).toEqual(["earlier", "later"]);
  });
});

describe("sortByClosingRank", () => {
  it("orders by predicted_closing_rank ascending (lower rank is better)", () => {
    const sorted = sortByClosingRank([
      makePrediction({
        institute_id: "nit-b",
        predicted_closing_rank: 5000,
      }),
      makePrediction({
        institute_id: "iit-a",
        predicted_closing_rank: 300,
      }),
      makePrediction({
        institute_id: "nit-a",
        predicted_closing_rank: 2000,
      }),
    ]);

    expect(sorted.map((p) => p.institute_id)).toEqual([
      "iit-a",
      "nit-a",
      "nit-b",
    ]);
  });

  it("ignores band and cumulative_probability", () => {
    const sorted = sortByClosingRank([
      makePrediction({
        institute_id: "safe-far",
        band: "safe",
        cumulative_probability: 0.95,
        predicted_closing_rank: 8000,
      }),
      makePrediction({
        institute_id: "reach-close",
        band: "delulu",
        cumulative_probability: 0.15,
        predicted_closing_rank: 500,
      }),
    ]);

    expect(sorted.map((p) => p.institute_id)).toEqual([
      "reach-close",
      "safe-far",
    ]);
  });

  it("breaks equal closing ranks by institute then program", () => {
    const sorted = sortByClosingRank([
      makePrediction({
        institute_id: "nit-b",
        program_id: "cse",
        predicted_closing_rank: 2000,
      }),
      makePrediction({
        institute_id: "nit-a",
        program_id: "ece",
        predicted_closing_rank: 2000,
      }),
    ]);

    expect(sorted.map((p) => p.institute_id)).toEqual(["nit-a", "nit-b"]);
  });
});

function makeIndexRows(): CollegePredictorIndexRow[] {
  return [
    makeRow({
      institute_id: "iit-a",
      program_id: "cse",
      predicted_closing_rank: 100,
      sigma_effective: 10,
      instype: "IIT",
    }),
    makeRow({
      institute_id: "iit-b",
      program_id: "cse",
      predicted_closing_rank: 300,
      sigma_effective: 30,
      instype: "IIT",
    }),
    makeRow({
      institute_id: "nit-a",
      program_id: "cse",
      predicted_closing_rank: 2000,
      sigma_effective: 200,
      instype: "NIT",
    }),
    makeRow({
      institute_id: "nit-b",
      program_id: "electronics",
      predicted_closing_rank: 5000,
      sigma_effective: 500,
      instype: "NIT",
    }),
    makeRow({
      institute_id: "nit-c",
      program_id: "civil",
      predicted_closing_rank: 9000,
      sigma_effective: 900,
      instype: "NIT",
    }),
  ];
}

describe("predictPrograms", () => {
  it("returns programs sorted safe → iffy → delulu → doesnt-matter", () => {
    const result = predictPrograms({
      indexRows: makeIndexRows(),
      studentRank: 2500,
      seatType: "OPEN",
      gender: "Gender-Neutral",
      includeAll: true,
    });
    const bands = result.programs.map((p) => p.band);
    const bandOrder = { safe: 0, iffy: 1, delulu: 2, "doesnt-matter": 3 };
    for (let i = 0; i < bands.length - 1; i++) {
      const current = bands[i];
      const next = bands[i + 1];
      expect(current).toBeDefined();
      expect(next).toBeDefined();
      if (current === undefined || next === undefined) continue;
      expect(bandOrder[current]).toBeLessThanOrEqual(bandOrder[next]);
    }
  });

  it("hides doesnt-matter programs below delulu band by default", () => {
    const result = predictPrograms({
      indexRows: makeIndexRows(),
      studentRank: 50000,
      seatType: "OPEN",
      gender: "Gender-Neutral",
    });
    expect(result.metadata.threshold_used).toBe(DELULU_BAND_MIN_PROBABILITY);
    for (const p of result.programs) {
      expect(p.cumulative_probability).toBeGreaterThanOrEqual(
        DELULU_BAND_MIN_PROBABILITY,
      );
      expect(p.band).not.toBe("doesnt-matter");
    }
  });

  it("includes all programs when includeAll=true", () => {
    const result = predictPrograms({
      indexRows: makeIndexRows(),
      studentRank: 50000,
      seatType: "OPEN",
      gender: "Gender-Neutral",
      includeAll: true,
    });
    expect(result.programs.length).toBe(makeIndexRows().length);
  });

  it("filters by institute_type", () => {
    const result = predictPrograms({
      indexRows: makeIndexRows(),
      studentRank: 2500,
      seatType: "OPEN",
      gender: "Gender-Neutral",
      includeAll: true,
      filters: { institute_type: ["IIT"] },
    });
    for (const p of result.programs) {
      expect(p.instype).toBe("IIT");
    }
  });

  it("filters by branch_name — only programs matching the branch are returned", () => {
    const result = predictPrograms({
      indexRows: makeIndexRows(),
      studentRank: 2500,
      seatType: "OPEN",
      gender: "Gender-Neutral",
      includeAll: true,
      filters: { branch_name: "civil" },
    });
    expect(result.programs).toHaveLength(1);
    expect(result.programs[0]?.program_id).toBe("civil");
  });

  it("returns empty programs when no rows match seat_type/gender", () => {
    const result = predictPrograms({
      indexRows: makeIndexRows(),
      studentRank: 1000,
      seatType: "SC",
      gender: "Gender-Neutral",
    });
    expect(result.programs).toHaveLength(0);
  });

  it("grouped_by_band contains the same programs as programs array", () => {
    const result = predictPrograms({
      indexRows: makeIndexRows(),
      studentRank: 2500,
      seatType: "OPEN",
      gender: "Gender-Neutral",
      includeAll: true,
    });
    const fromGroups = [
      ...result.grouped_by_band.safe,
      ...result.grouped_by_band.iffy,
      ...result.grouped_by_band.delulu,
      ...result.grouped_by_band["doesnt-matter"],
    ];
    expect(fromGroups.length).toBe(result.programs.length);
  });

  it("metadata counts are consistent", () => {
    const result = predictPrograms({
      indexRows: makeIndexRows(),
      studentRank: 2500,
      seatType: "OPEN",
      gender: "Gender-Neutral",
    });
    expect(result.metadata.displayed_programs).toBe(result.programs.length);
    expect(result.metadata.total_matching_programs).toBeGreaterThanOrEqual(
      result.programs.length,
    );
    expect(result.metadata.hidden_programs).toBe(
      result.metadata.total_matching_programs -
        result.metadata.displayed_programs,
    );
  });
});
