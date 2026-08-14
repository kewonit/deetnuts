import assert from "node:assert/strict";
import test from "node:test";
import { parseLegacyMhtCetCutoffRoute } from "./legacy-route";

test("maps supported legacy year and round aliases", () => {
  assert.deepEqual(parseLegacyMhtCetCutoffRoute("2024", "1"), {
    year: 2024,
    round: 1,
  });
  assert.deepEqual(parseLegacyMhtCetCutoffRoute("2025", "round-four"), {
    year: 2025,
    round: 4,
  });
  assert.deepEqual(parseLegacyMhtCetCutoffRoute("2026", "ROUND-ONE"), {
    year: 2026,
    round: 1,
  });
});

test("rejects unknown years and unsupported combinations", () => {
  assert.equal(parseLegacyMhtCetCutoffRoute("2023", "round-one"), null);
  assert.equal(parseLegacyMhtCetCutoffRoute("2026", "round-two"), null);
  assert.equal(parseLegacyMhtCetCutoffRoute("twenty", "1"), null);
  assert.equal(parseLegacyMhtCetCutoffRoute("2025", "final"), null);
});
