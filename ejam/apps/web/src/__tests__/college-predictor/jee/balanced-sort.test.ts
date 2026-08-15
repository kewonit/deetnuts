import type { ProgramPrediction } from "@ejam/data/college-predictor";
import { describe, expect, it } from "vitest";
import { applyResultsSort } from "@/components/predictor/results-sort-logic";
import type {
  PredictorDisplayProgram,
  PredictorExamId,
} from "@/lib/predictor-adapters";

function program(
  instituteId: string,
  closingRank: number,
  instituteType: string,
): ProgramPrediction {
  return {
    institute_id: instituteId,
    program_id: "computer-science",
    program_name: "Computer Science and Engineering",
    seat_type: "OPEN",
    quota: "AI",
    gender: "Gender-Neutral",
    instype: instituteType,
    degree: "B.Tech",
    duration_years: 4,
    weighted_mean: closingRank,
    predicted_closing_rank: closingRank,
    sigma_effective: 100,
    cumulative_probability: 0.65,
    band: "iffy",
    data_quality: "sufficient",
    years_of_data: 4,
    last_data_year: 2025,
    fill_round: 6,
    round_probs: [0.4, 0.5, 0.6, 0.65],
  };
}

function display(value: ProgramPrediction): PredictorDisplayProgram {
  return {
    key: [
      value.institute_id,
      value.program_id,
      value.seat_type,
      value.quota,
      value.gender,
    ].join("::"),
    exam: "jee",
    instituteId: value.institute_id,
    instituteName: value.institute_id,
    instituteType: value.instype,
    programId: value.program_id,
    programName: value.program_name ?? value.program_id,
    band: value.band,
    overallProbability: value.cumulative_probability,
    predictedClosingRank: value.predicted_closing_rank,
    roundProbabilities: value.round_probs,
    roundCount: 6,
    seatPoolLabel: `${value.seat_type} · ${value.quota}`,
    dataQuality: value.data_quality,
    yearsOfData: value.years_of_data,
    latestYear: value.last_data_year,
    jeeProgram: value,
  };
}

describe.each([
  "jee-main",
  "jee-advanced",
  "csab",
] satisfies PredictorExamId[])("%s Balanced sorting", () => {
  it("maps cloned ranking output back through the canonical program key", () => {
    const programs = [
      display(program("lower-institute", 8_000, "GFTI")),
      display(program("higher-institute", 2_000, "IIT")),
    ];

    const sorted = applyResultsSort(programs, "balanced");

    expect(sorted).toHaveLength(2);
    expect(new Set(sorted.map((entry) => entry.key))).toEqual(
      new Set(programs.map((entry) => entry.key)),
    );
    expect(sorted[0]).toBe(programs[1]);
  });
});

describe("Balanced sorting key safety", () => {
  it("rejects duplicate canonical JEE program keys", () => {
    const value = display(program("duplicate", 2_000, "NIT"));
    expect(() => applyResultsSort([value, { ...value }], "balanced")).toThrow(
      /duplicate program key/,
    );
  });
});
