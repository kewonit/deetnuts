import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveDataRoot } from "@ejam/data";
import {
  encodeMhtCetPagedPredictionResult,
  type MhtCetPredictionInput,
  MhtCetPredictionInput as MhtCetPredictionInputSchema,
} from "@ejam/data/mht-cet";
import { describe, expect, it } from "vitest";
import { predictor } from "./index";

const INDEX_PATH =
  "tools/college-predictor/maharashtra-cap/predictor-index.parquet";
const absoluteIndexPath = join(resolveDataRoot(), INDEX_PATH);
const indexSha256 = createHash("sha256")
  .update(readFileSync(absoluteIndexPath))
  .digest("hex");

const BASE_INPUT = {
  rank: 50_000,
  candidature_type_id: "type-a",
  category_id: "open",
  ladies_seat_eligible: false,
  home_university_id: "savitribai-phule-pune-university",
  eligibilities: {
    ews_certificate: false,
    tfws_eligible: false,
    orphan_certificate: false,
  },
  include_all: true,
} as const;

async function predict(input: MhtCetPredictionInput) {
  return (
    await predictor.predict(input, {
      examId: "mht-cet",
      resolvedDatasets: [
        {
          dataset: "predictor_index",
          path: INDEX_PATH,
          sha256: indexSha256,
        },
      ],
    })
  ).result;
}

describe("MHT-CET built-index integration", () => {
  it("keeps a representative first page under 250 KiB uncompressed", async () => {
    const result = await predict(
      MhtCetPredictionInputSchema.parse({
        ...BASE_INPUT,
        result_options: { limit: 100, sort_by: "chance" },
      }),
    );

    expect(result.programs.length).toBeLessThanOrEqual(100);
    const transport = encodeMhtCetPagedPredictionResult(result);
    expect(
      Buffer.byteLength(JSON.stringify(transport), "utf8"),
    ).toBeLessThanOrEqual(250 * 1024);
  });

  it.each([
    {
      choiceCode: "0675526310",
      categoryId: "obc",
      expectedRanks: [35_480, 36_314, 36_137, 36_601],
    },
    {
      choiceCode: "0100219110",
      categoryId: "open",
      expectedRanks: [37_591, 39_713, 31_618, 28_216],
    },
  ] as const)("returns every eligible published round for $choiceCode", async ({
    choiceCode,
    categoryId,
    expectedRanks,
  }) => {
    const result = await predict(
      MhtCetPredictionInputSchema.parse({
        ...BASE_INPUT,
        category_id: categoryId,
        result_options: {
          limit: 100,
          search: choiceCode,
          sort_by: "chance",
        },
      }),
    );

    expect(result.programs).toHaveLength(1);
    const program = result.programs[0];
    expect(program.choice_code).toBe(choiceCode);
    expect(
      ["1", "2", "3", "4"].map(
        (round) =>
          program.round_matches[round as keyof typeof program.round_matches]
            ?.predicted_closing_rank ?? null,
      ),
    ).toEqual(expectedRanks);
  });

  it("recovers every eligible later round for 0347119110", async () => {
    const result = await predict(
      MhtCetPredictionInputSchema.parse({
        ...BASE_INPUT,
        result_options: {
          limit: 100,
          search: "0347119110",
          sort_by: "chance",
        },
      }),
    );

    expect(result.programs).toHaveLength(1);
    const program = result.programs[0];
    expect(program.choice_code).toBe("0347119110");
    expect(
      ["1", "2", "3", "4"].map(
        (round) =>
          program.round_availability[
            round as keyof typeof program.round_availability
          ].status,
      ),
    ).toEqual(["available", "available", "available", "available"]);
    expect(
      ["2", "3", "4"].every(
        (round) =>
          program.round_matches[round as keyof typeof program.round_matches] !==
          null,
      ),
    ).toBe(true);
    expect(
      ["2", "3", "4"].some(
        (round) =>
          program.round_matches[round as keyof typeof program.round_matches]
            ?.stage.conversion_applied,
      ),
    ).toBe(true);
  });
});
