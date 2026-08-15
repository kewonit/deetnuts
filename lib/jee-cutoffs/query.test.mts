import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { CutoffQueryError, queryCutoffRows } from "./query";
import type { CutoffServingRow } from "./types";

const base: CutoffServingRow = {
  body: "josaa",
  year: 2025,
  round: 1,
  institute_id: "test-college",
  source_program_id: "computer-science",
  source_program_name: "Computer Science and Engineering",
  canonical_program_id: "computer-science",
  offering_id: "cse-btech-4",
  quota: "AI",
  seat_type: "OPEN",
  gender: "Gender-Neutral",
  opening_rank: 100,
  closing_rank: 200,
  exam_id: "jee-main",
  institute_type: "NIT",
  degree: "B.Tech",
  duration_years: 4,
  source: "official",
  source_id: "source-1",
  source_locator: "https://example.test/official",
};

const rows: CutoffServingRow[] = [
  base,
  { ...base, round: 2, opening_rank: 110, closing_rank: 210 },
  { ...base, round: 2, source_program_id: "mechanical", source_program_name: "Mechanical Engineering", canonical_program_id: "mechanical", offering_id: "mechanical-btech-4", opening_rank: 300, closing_rank: 500 },
  { ...base, round: 3, source_program_id: "mechanical", source_program_name: "Mechanical Engineering", canonical_program_id: "mechanical", offering_id: "mechanical-btech-4", opening_rank: 320, closing_rank: 520 },
  { ...base, round: 4, opening_rank: 130, closing_rank: 230 },
  { ...base, round: 4, source_program_id: "mechanical", source_program_name: "Mechanical Engineering", canonical_program_id: "mechanical", offering_id: "mechanical-btech-4", opening_rank: 340, closing_rank: 540 },
  { ...base, body: "csab", round: 1, quota: "HS", opening_rank: 180, closing_rank: 280 },
];

test("catalog reconciles the accepted JEE release", async () => {
  const catalog = JSON.parse(await readFile("ejam/data/tools/college-cutoffs/catalog.json", "utf8"));
  assert.deepEqual(catalog.totals, {
    rows: 463_050,
    colleges: 131,
    pages: 1_096,
    jeeMainPages: 866,
    jeeAdvancedPages: 230,
    programs: 7_476,
    profiles: 105_115,
    multiRoundProfiles: 88_147,
    oneRoundProfiles: 16_968,
    canonicalRoutes: 113_821,
    indexableRoutes: 96_853,
    sources: 274,
  });
});

test("default query keeps the chart offering separate from the all-program table", () => {
  const result = queryCutoffRows(rows, {});
  assert.equal(result.selection.body, "josaa");
  assert.equal(result.selection.round, 4);
  assert.equal(result.selection.offeringId, "cse-btech-4");
  assert.equal(result.rows.length, 2);
  assert.deepEqual(result.chart.map((point) => point.round), [1, 2, 3, 4]);
  assert.equal(result.chart[2]?.closingRank, null);
});

test("query validation rejects invalid limits and paginates deterministically", () => {
  assert.throws(
    () => queryCutoffRows(rows, { limit: "101" }),
    (error) => error instanceof CutoffQueryError && error.code === "invalid_limit",
  );
  const first = queryCutoffRows(rows, { limit: "1" });
  assert.equal(first.rows.length, 1);
  assert.ok(first.pagination.nextCursor);
  const second = queryCutoffRows(rows, { limit: "1", cursor: first.pagination.nextCursor! });
  assert.notEqual(second.rows[0]?.offering_id, first.rows[0]?.offering_id);
});

test("query rejects unknown taxonomy values instead of guessing", () => {
  assert.throws(
    () => queryCutoffRows(rows, { seatType: "NOT-A-SEAT-TYPE" }),
    (error) => error instanceof CutoffQueryError && error.code === "invalid_seatType",
  );
});

test("valid taxonomy values with no intersection return an explicit empty result", () => {
  const result = queryCutoffRows(rows, { body: "josaa", quota: "HS" });
  assert.equal(result.rows.length, 0);
  assert.match(result.emptyReason ?? "", /No source rows/);
});
