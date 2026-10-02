import assert from "node:assert/strict";
import test from "node:test";
import {
  parseAdmissionsInteger,
  parseMhtCetDetailSelection,
  withNeutralAdmissionsQuery,
} from "./query-state";

test("validates numeric query state and preserves only supplied neutral values", () => {
  assert.equal(parseAdmissionsInteger("2026"), 2026);
  assert.equal(parseAdmissionsInteger("2.5"), undefined);
  assert.equal(parseAdmissionsInteger("-1"), undefined);
  assert.equal(
    withNeutralAdmissionsQuery("/college", {
      year: 2026,
      round: 1,
      program: undefined,
    }),
    "/college?year=2026&round=1",
  );
});

test("detail selection validates the available year and round pairs", () => {
  assert.deepEqual(parseMhtCetDetailSelection(), {
    year: undefined,
    round: undefined,
  });
  assert.deepEqual(parseMhtCetDetailSelection("2024", "3"), {
    year: 2024,
    round: 3,
  });
  assert.deepEqual(parseMhtCetDetailSelection("2025", "4"), {
    year: 2025,
    round: 4,
  });
  assert.deepEqual(parseMhtCetDetailSelection("2026", "1"), {
    year: 2026,
    round: 1,
  });
  for (const [year, round] of [
    ["2023", "1"],
    ["2027", "1"],
    ["2024", "4"],
    ["2026", "2"],
    ["2026", "0"],
    ["", "1"],
    ["2026", ""],
    ["2026", "2.5"],
    ["2026", "-1"],
    ["9007199254740993", "1"],
  ]) {
    assert.equal(
      parseMhtCetDetailSelection(year, round),
      null,
      year + ":" + round,
    );
  }
  assert.equal(parseMhtCetDetailSelection(["2024", "2026"], "1"), null);
  assert.equal(parseMhtCetDetailSelection("2026", ["1", "2"]), null);
});
