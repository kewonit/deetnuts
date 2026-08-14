import assert from "node:assert/strict";
import test from "node:test";
import {
  parseAdmissionsInteger,
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
