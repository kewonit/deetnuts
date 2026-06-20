import assert from "node:assert/strict";
import test from "node:test";

import { parseCutoffFlagCommand } from "./commands";

test("parseCutoffFlagCommand parses flags in any order", () => {
  const result = parseCutoffFlagCommand(
    "please check --round 2 --percentile 95.5 --year 2025",
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.command, {
      percentile: 95.5,
      year: 2025,
      round: 2,
    });
  }
});

test("parseCutoffFlagCommand rejects duplicate flags", () => {
  const result = parseCutoffFlagCommand("--percentile 95 --percentile 96");

  assert.equal(result.ok, false);
});

test("parseCutoffFlagCommand requires percentile", () => {
  const result = parseCutoffFlagCommand("--year 2025 --round 1");

  assert.equal(result.ok, false);
});
