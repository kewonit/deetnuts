import assert from "node:assert/strict";
import test from "node:test";

import {
  BotCutoffError,
  normalizeBotCutoffQuery,
  queryBotStateCutoffs,
  selectTopUniqueCutoffRows,
} from "./cutoff-query";

test("normalizeBotCutoffQuery defaults year and round", () => {
  assert.deepEqual(normalizeBotCutoffQuery({ percentile: 95 }), {
    percentile: 95,
    year: 2025,
    round: 1,
    limit: 5,
  });
});

test("normalizeBotCutoffQuery accepts 2025 round 4", () => {
  assert.equal(
    normalizeBotCutoffQuery({ percentile: 95, year: 2025, round: 4 }).round,
    4,
  );
});

test("normalizeBotCutoffQuery rejects unsupported round-year combinations", () => {
  assert.throws(
    () => normalizeBotCutoffQuery({ percentile: 95, year: 2024, round: 4 }),
    (error) =>
      error instanceof BotCutoffError && error.code === "UNSUPPORTED_ROUND",
  );
});

test("selectTopUniqueCutoffRows dedupes college-course rows", () => {
  const rows = selectTopUniqueCutoffRows(
    [
      {
        college_code: "1001",
        college_name: "A College",
        course_name: "Computer Engineering",
        category: "GOPENS",
        cutoff_score: "95.1",
        last_rank: "1000",
      },
      {
        college_code: "1001",
        college_name: "A College",
        course_name: "Computer Engineering",
        category: "GOPENH",
        cutoff_score: "94.9",
        last_rank: "1010",
      },
      {
        college_code: "1002",
        college_name: "B College",
        course_name: "Information Technology",
        category: "GOPENS",
        cutoff_score: "94.7",
        last_rank: "1200",
      },
    ],
    5,
  );

  assert.equal(rows.length, 2);
  assert.equal(rows[0].collegeName, "A College");
  assert.equal(rows[0].category, "GOPENS");
});

test("queryBotStateCutoffs returns top unique rows and source URL", async () => {
  const result = await queryBotStateCutoffs(
    { percentile: 95, year: 2025, round: 1 },
    {
      fetchRows: async () => ({
        totalMatched: 2,
        rows: [
          {
            college_code: "1001",
            college_name: "A College",
            course_name: "Computer Engineering",
            category: "GOPENS",
            cutoff_score: "94.8",
            last_rank: "1000",
          },
        ],
      }),
    },
  );

  assert.equal(result.rows.length, 1);
  assert.equal(result.query.roundLabel, "Round 1");
  assert.match(result.sourceUrl, /percentile=95/);
});
