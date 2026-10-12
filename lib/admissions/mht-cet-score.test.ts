import assert from "node:assert/strict";
import test from "node:test";
import {
  compareMhtCetScore,
  describeMhtCetMargin,
  formatMhtCetMargin,
  parseMhtCetScore,
  percentileScale,
  rankHeat,
  readStoredMhtCetScore,
  scalePosition,
} from "./mht-cet-score";

test("scores are validated per mode", () => {
  assert.deepEqual(parseMhtCetScore("percentile", "97.5"), { mode: "percentile", value: 97.5 });
  assert.equal(parseMhtCetScore("percentile", "101"), null);
  assert.equal(parseMhtCetScore("percentile", " "), null);
  assert.deepEqual(parseMhtCetScore("rank", "4500"), { mode: "rank", value: 4500 });
  assert.equal(parseMhtCetScore("rank", "45.5"), null);
  assert.equal(parseMhtCetScore("rank", "0"), null);
});

test("percentile verdicts use the closing percentile", () => {
  const row = { percentileValue: 92.5129597, rankValue: 31743 };
  const cleared = compareMhtCetScore(row, { mode: "percentile", value: 93 });
  assert.equal(cleared?.status, "cleared");
  assert.equal(formatMhtCetMargin(cleared!, "percentile"), "+0.48");
  assert.equal(compareMhtCetScore(row, { mode: "percentile", value: 92 })?.status, "close");
  const short = compareMhtCetScore(row, { mode: "percentile", value: 90 });
  assert.equal(short?.status, "short");
  assert.equal(describeMhtCetMargin(short!, "percentile"), "Short by 2.51 percentile points");
  assert.equal(compareMhtCetScore({ percentileValue: null }, { mode: "percentile", value: 90 }), null);
});

test("rank verdicts treat a smaller rank as better", () => {
  const row = { percentileValue: 92.5, rankValue: 10000 };
  assert.equal(compareMhtCetScore(row, { mode: "rank", value: 10000 })?.status, "cleared");
  const close = compareMhtCetScore(row, { mode: "rank", value: 11500 });
  assert.equal(close?.status, "close");
  assert.equal(formatMhtCetMargin(close!, "rank"), "−1,500");
  assert.equal(compareMhtCetScore(row, { mode: "rank", value: 13000 })?.status, "short");
});

test("the shared scale leaves room below the lowest cutoff", () => {
  assert.deepEqual(percentileScale([99.97, 98.85]), { lo: 98, hi: 100 });
  assert.deepEqual(percentileScale([92.5, 84.2]), { lo: 80, hi: 100 });
  assert.deepEqual(percentileScale([92.5, 19.5]), { lo: 10, hi: 100 });
  assert.deepEqual(percentileScale([99.8], 70), { lo: 60, hi: 100 });
  assert.deepEqual(percentileScale([]), { lo: 0, hi: 100 });
  assert.equal(scalePosition(90, { lo: 80, hi: 100 }), 0.5);
  assert.equal(scalePosition(50, { lo: 80, hi: 100 }), 0);
});

test("stored scores are parsed defensively", () => {
  assert.deepEqual(readStoredMhtCetScore('{"mode":"rank","text":"4500"}'), { mode: "rank", text: "4500" });
  assert.equal(readStoredMhtCetScore('{"mode":"marks","text":"1"}'), null);
  assert.equal(readStoredMhtCetScore("not json"), null);
});

test("rank heat is strongest for the smallest closing rank", () => {
  const ranks = [150, 1500, 15000, null];
  assert.equal(rankHeat(150, ranks), 1);
  assert.equal(rankHeat(15000, ranks), 0);
  assert.ok(Math.abs((rankHeat(1500, ranks) ?? 0) - 0.5) < 1e-9);
  assert.equal(rankHeat(null, ranks), null);
  assert.equal(rankHeat(400, [400]), 0.5);
});
