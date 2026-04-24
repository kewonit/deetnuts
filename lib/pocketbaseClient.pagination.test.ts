import assert from "node:assert/strict";
import test from "node:test";

import {
  createEmptyListResult,
  isRequestedRangeNotSatisfiableError,
} from "./pocketbaseClient";

test("isRequestedRangeNotSatisfiableError recognizes the Supabase 416 error shape", () => {
  assert.equal(
    isRequestedRangeNotSatisfiableError({
      code: "PGRST103",
      message: "Requested range not satisfiable",
      details: "An offset of 50 was requested, but there are only 0 rows.",
    }),
    true,
  );
  assert.equal(
    isRequestedRangeNotSatisfiableError({
      message: "Some other error",
    }),
    false,
  );
});

test("createEmptyListResult preserves the requested page while reporting total pages", () => {
  assert.deepEqual(createEmptyListResult(2, 50, 32), {
    items: [],
    page: 2,
    perPage: 50,
    totalItems: 32,
    totalPages: 1,
  });
});
