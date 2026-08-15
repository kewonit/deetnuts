import type { ProbabilityBand } from "@ejam/data/college-predictor";
import { describe, expect, it } from "vitest";
import {
  countClientHiddenLongShots,
  hasOnlyClientHiddenLongShots,
  withClientHiddenLongShotMetadata,
} from "@/components/predictor/long-shot-visibility";
import type { PredictorDisplayProgram } from "@/lib/predictor-adapters";

function row(band: ProbabilityBand): PredictorDisplayProgram {
  return {
    key: band,
    exam: "jee",
    instituteId: "nit-test",
    instituteName: "nit-test",
    instituteType: "NIT",
    programId: "cse",
    programName: "CSE",
    band,
    overallProbability: 0.5,
    predictedClosingRank: 1,
    roundProbabilities: [0.5],
    roundCount: 6,
    seatPoolLabel: "OPEN · OS",
    dataQuality: "inferred",
    yearsOfData: 2,
    latestYear: 2025,
  };
}

const metadata = {
  total_matching: 2,
  total_above_threshold: 0,
  threshold_used: 0.1,
  hidden_count: 0,
  total_matching_programs: 2,
  displayed_programs: 2,
  hidden_programs: 0,
  active_filters: {},
};

describe("long-shot visibility helpers", () => {
  it("counts long-shot rows hidden by the client-side toggle", () => {
    const programs = [
      row("doesnt-matter"),
      row("delulu"),
      row("doesnt-matter"),
    ];

    expect(countClientHiddenLongShots(programs, false)).toBe(2);
    expect(countClientHiddenLongShots(programs, true)).toBe(0);
  });

  it("detects predictions where every returned row is hidden as a long-shot", () => {
    expect(
      hasOnlyClientHiddenLongShots(
        [row("doesnt-matter"), row("doesnt-matter")],
        false,
      ),
    ).toBe(true);
    expect(
      hasOnlyClientHiddenLongShots(
        [row("doesnt-matter"), row("delulu")],
        false,
      ),
    ).toBe(false);
    expect(hasOnlyClientHiddenLongShots([row("doesnt-matter")], true)).toBe(
      false,
    );
  });

  it("preserves the show-long-shots CTA after always fetching all rows", () => {
    expect(withClientHiddenLongShotMetadata(metadata, 2)).toMatchObject({
      hidden_programs: 2,
    });
  });
});
