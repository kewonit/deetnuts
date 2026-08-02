import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_YEAR,
  getCollectionForRound,
  isRoundAvailableForYear,
  ROUNDS_BY_YEAR,
  YEAR_OPTIONS,
} from "./config";

test("defaults to the available 2026 CAP Round I dataset", () => {
  assert.equal(DEFAULT_YEAR, 2026);
  assert.equal(YEAR_OPTIONS[0].value, 2026);
  assert.deepEqual(ROUNDS_BY_YEAR[2026], [1]);
  assert.equal(
    getCollectionForRound(1, 2026),
    "2026_mht_cet_round_one_cutoffs",
  );
});

test("rejects unavailable 2026 rounds and falls back within 2026", () => {
  assert.equal(isRoundAvailableForYear(2, 2026), false);
  assert.equal(
    getCollectionForRound(2, 2026),
    "2026_mht_cet_round_one_cutoffs",
  );
});

test("unsupported years fall back to the current default dataset", () => {
  assert.equal(
    getCollectionForRound(1, 2030),
    "2026_mht_cet_round_one_cutoffs",
  );
});

test("preserves historical year and round table mappings", () => {
  assert.equal(
    getCollectionForRound(4, 2025),
    "2025_mht_cet_round_four_cutoffs",
  );
  assert.equal(
    getCollectionForRound(3, 2024),
    "2024_mht_cet_round_three_cutoffs",
  );
});
