import assert from "node:assert/strict";
import test from "node:test";

import {
  BotCutoffError,
  normalizeBotCutoffQuery,
  queryBotStateCutoffs,
  selectTopUniqueCutoffRows,
} from "./cutoff-query";

test("normalizeBotCutoffQuery defaults year and round", () => {
  const query = normalizeBotCutoffQuery({ percentile: 95 });

  assert.deepEqual(
    {
      percentile: query.percentile,
      year: query.year,
      round: query.round,
      limit: query.limit,
      category: query.categoryGroup.id,
      subcategory: query.subcategoryGroup.id,
      categoryCodes: query.categoryCodes,
      branch: query.branchGroup.id,
    },
    {
      percentile: 95,
      year: 2025,
      round: 1,
      limit: 5,
      category: "open",
      subcategory: "all",
      categoryCodes: [
        "GOPENS",
        "GOPENH",
        "GOPENO",
        "LOPENS",
        "LOPENH",
        "LOPENO",
      ],
      branch: "all",
    },
  );
});

test("normalizeBotCutoffQuery accepts 2025 round 4", () => {
  assert.equal(
    normalizeBotCutoffQuery({ percentile: 95, year: 2025, round: 4 }).round,
    4,
  );
});

test("normalizeBotCutoffQuery accepts category aliases", () => {
  const query = normalizeBotCutoffQuery({
    percentile: 95,
    category: "SC/ST",
  });

  assert.equal(query.categoryGroup.id, "sc_st");
  assert.equal(query.subcategoryGroup.id, "all");
  assert.deepEqual(query.categoryGroup.codes.slice(0, 3), [
    "GSCH",
    "GSCO",
    "GSCS",
  ]);
});

test("normalizeBotCutoffQuery accepts subcategory aliases", () => {
  const query = normalizeBotCutoffQuery({
    percentile: 95,
    category: "OBC",
    subcategory: "ladies home",
  });

  assert.equal(query.subcategoryGroup.id, "ladies_home");
  assert.deepEqual(query.categoryCodes, ["LOBCH"]);
});

test("normalizeBotCutoffQuery accepts course and legacy branch aliases", () => {
  const query = normalizeBotCutoffQuery({
    percentile: 95,
    course: "Electronics & Communication",
  });
  const legacyQuery = normalizeBotCutoffQuery({
    percentile: 95,
    branch: "Electronics & Communication",
  });

  assert.equal(query.branchGroup.id, "electronics_comm");
  assert.equal(legacyQuery.branchGroup.id, "electronics_comm");
  assert.ok(query.branchGroup.courses.includes("Electronics Engineering"));
});

test("normalizeBotCutoffQuery rejects unsupported categories", () => {
  assert.throws(
    () => normalizeBotCutoffQuery({ percentile: 95, category: "banana" }),
    (error) =>
      error instanceof BotCutoffError && error.code === "INVALID_INPUT",
  );
});

test("normalizeBotCutoffQuery rejects unsupported subcategories", () => {
  assert.throws(
    () => normalizeBotCutoffQuery({ percentile: 95, subcategory: "banana" }),
    (error) =>
      error instanceof BotCutoffError && error.code === "INVALID_INPUT",
  );
});

test("normalizeBotCutoffQuery rejects subcategories unavailable for category", () => {
  assert.throws(
    () =>
      normalizeBotCutoffQuery({
        percentile: 95,
        category: "ews",
        subcategory: "home",
      }),
    (error) =>
      error instanceof BotCutoffError &&
      error.code === "INVALID_INPUT" &&
      error.message.includes("not available"),
  );
});

test("normalizeBotCutoffQuery rejects unsupported branch groups", () => {
  assert.throws(
    () => normalizeBotCutoffQuery({ percentile: 95, course: "banana" }),
    (error) =>
      error instanceof BotCutoffError && error.code === "INVALID_INPUT",
  );
});

test("normalizeBotCutoffQuery rejects conflicting branch and course values", () => {
  assert.throws(
    () =>
      normalizeBotCutoffQuery({
        percentile: 95,
        branch: "cs-it",
        course: "mechanical",
      }),
    (error) =>
      error instanceof BotCutoffError && error.code === "INVALID_INPUT",
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
    {
      percentile: 95,
      year: 2025,
      round: 1,
      category: "obc",
      subcategory: "gender neutral state",
      course: "AI & Data Science",
    },
    {
      fetchRows: async (query) => {
        assert.equal(query.categoryGroup.id, "obc");
        assert.equal(query.subcategoryGroup.id, "gender_neutral_state");
        assert.deepEqual(query.categoryCodes, ["GOBCS"]);
        assert.equal(query.branchGroup.id, "ai_ds");
        return {
          totalMatched: 3,
          rows: [
            {
              college_code: "1001",
              college_name: "A College",
              course_name: "Artificial Intelligence and Data Science",
              category: "GOBCS",
              cutoff_score: "94.8",
              last_rank: "1000",
            },
            {
              college_code: "1002",
              college_name: "B College",
              course_name: "Mechanical Engineering",
              category: "GOBCS",
              cutoff_score: "94.9",
              last_rank: "900",
            },
          ],
        };
      },
    },
  );

  assert.equal(result.rows.length, 1);
  assert.equal(result.query.roundLabel, "Round 1");
  assert.equal(result.query.category, "obc");
  assert.equal(result.query.categoryGroup, "OBC (Other Backward Classes)");
  assert.equal(result.query.subcategory, "gender_neutral_state");
  assert.equal(result.query.subcategoryGroup, "Gender-neutral + State Level");
  assert.equal(result.query.course, "ai_ds");
  assert.equal(result.query.courseGroup, "AI & Data Science");
  assert.equal(result.query.branch, "ai_ds");
  assert.equal(result.query.branchGroup, "AI & Data Science");
  assert.equal(
    result.rows[0].courseName,
    "Artificial Intelligence and Data Science",
  );
  assert.match(result.sourceUrl, /percentile=95/);
  assert.match(result.sourceUrl, /GOBCS/);
  assert.match(
    result.sourceUrl,
    /Artificial\+Intelligence\+and\+Data\+Science/,
  );
});
