import assert from "node:assert/strict";
import test from "node:test";

import {
  escapeRedditMarkdown,
  formatDiscordCutoffResponse,
  formatRedditCutoffResponse,
} from "./formatters";
import type { BotCutoffResult } from "./cutoff-query";

const result: BotCutoffResult = {
  query: {
    percentile: 95,
    year: 2025,
    round: 1,
    roundLabel: "Round 1",
    category: "open",
    categoryGroup: "Open Category (General)",
    subcategory: "gender_neutral_state",
    subcategoryGroup: "Gender-neutral + State Level",
    course: "cs_it",
    courseGroup: "Computer Science & IT",
    branch: "cs_it",
    branchGroup: "Computer Science & IT",
  },
  rows: [
    {
      collegeCode: "1001",
      collegeName: "A_College",
      courseCode: "100124210",
      courseName: "Computer [Engineering]",
      category: "GOPENS",
      cutoffScore: 94.82,
      lastRank: 12345,
      homeUniversity: null,
    },
  ],
  totalMatched: 1,
  sourceUrl: "https://www.deetnuts.com/mht-cet/state-cutoffs?percentile=95",
};

test("escapeRedditMarkdown escapes markdown syntax", () => {
  assert.equal(
    escapeRedditMarkdown("A_College [CSE]"),
    "A\\_College \\[CSE\\]",
  );
});

test("formatRedditCutoffResponse includes escaped rows and disclaimer", () => {
  const text = formatRedditCutoffResponse(result);

  assert.match(text, /A\\_College/);
  assert.match(text, /Computer Science & IT/);
  assert.match(text, /Gender\\-neutral/);
  assert.match(text, /Verify official CAP data/i);
});

test("formatDiscordCutoffResponse stays below Discord content limit", () => {
  const text = formatDiscordCutoffResponse(result);

  assert.ok(text.length < 2000);
  assert.match(text, /MHT-CET state cutoffs/);
  assert.match(text, /Computer Science & IT/);
  assert.match(text, /Gender-neutral/);
  assert.match(text, /College code: 1001/);
  assert.match(text, /Branch code: 100124210/);
  assert.match(text, /open filtered search/);
  assert.match(text, /Verify official CAP data/i);
});

test("formatDiscordCutoffResponse handles unavailable codes cleanly", () => {
  const text = formatDiscordCutoffResponse({
    ...result,
    rows: [
      {
        ...result.rows[0],
        collegeCode: null,
        collegeName: "A_College\nCampus",
        courseCode: null,
        courseName: "Computer\nEngineering",
      },
    ],
  });

  assert.match(text, /College code: n\/a/);
  assert.match(text, /Branch code: n\/a/);
  assert.match(text, /A_College Campus — Computer Engineering/);
  assert.doesNotMatch(text, /null|undefined/);
});

test("formatDiscordCutoffResponse preserves its footer for oversized results", () => {
  const oversizedResult: BotCutoffResult = {
    ...result,
    rows: Array.from({ length: 10 }, (_, index) => ({
      ...result.rows[0],
      collegeCode: String(10_000 + index),
      collegeName: `${"Very Long College Name ".repeat(8)}${index}`,
      courseCode: `${10_000 + index}24210`,
      courseName: "Very Long Computer Engineering Branch ".repeat(6),
    })),
    sourceUrl: `https://www.deetnuts.com/mht-cet/state-cutoffs?courses=${"x".repeat(2_500)}`,
  };

  const text = formatDiscordCutoffResponse(oversizedResult);

  assert.ok(text.length <= 1_900);
  assert.match(text, /College code: 10000/);
  assert.match(text, /Branch code: 1000024210/);
  assert.match(text, /… \d+ more top results/);
  assert.match(text, /More results: https:\/\/www\.deetnuts\.com\/mht-cet\/state-cutoffs/);
  assert.match(text, /Verify official CAP data/i);
  assert.doesNotMatch(text, /x{100}/);
});
