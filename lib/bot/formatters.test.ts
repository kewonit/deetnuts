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
    branch: "cs_it",
    branchGroup: "Computer Science & IT",
  },
  rows: [
    {
      collegeCode: "1001",
      collegeName: "A_College",
      courseName: "Computer [Engineering]",
      category: "GOPENS",
      cutoffScore: 94.82,
      lastRank: 12345,
      homeUniversity: null,
    },
  ],
  totalMatched: 1,
  sourceUrl: "https://deetnuts.com/mht-cet/state-cutoffs?percentile=95",
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
  assert.match(text, /Verify official CAP data/i);
});

test("formatDiscordCutoffResponse stays below Discord content limit", () => {
  const text = formatDiscordCutoffResponse(result);

  assert.ok(text.length < 2000);
  assert.match(text, /MHT-CET state cutoffs/);
  assert.match(text, /Computer Science & IT/);
});
