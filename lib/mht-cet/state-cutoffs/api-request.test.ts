import assert from "node:assert/strict";
import test from "node:test";

import {
  getUtf8ByteLength,
  STATE_CUTOFF_MAX_REQUEST_BYTES,
  StateCutoffApiRequestSchema,
} from "./api-request";

test("applies backwards-compatible defaults to a legacy request", () => {
  const result = StateCutoffApiRequestSchema.parse({});

  assert.equal(result.page, 1);
  assert.equal(result.perPage, 25);
  assert.equal(result.scoreMode, "percentile");
  assert.equal(result.requestKind, "search");
  assert.deepEqual(result.categories, []);
});

test("accepts numeric score values and normalizes them to strings", () => {
  const result = StateCutoffApiRequestSchema.parse({
    scoreMode: "rank",
    scoreValue: 5345,
    percentileInput: 5345,
  });

  assert.equal(result.scoreValue, "5345");
  assert.equal(result.percentileInput, "5345");
});

test("rejects sort injection and unsupported request kinds", () => {
  assert.equal(
    StateCutoffApiRequestSchema.safeParse({
      sortBy: "last_rank); DROP TABLE cutoffs;--",
    }).success,
    false,
  );
  assert.equal(
    StateCutoffApiRequestSchema.safeParse({
      requestKind: "background",
    }).success,
    false,
  );
});

test("rejects oversized pagination and filter inputs", () => {
  assert.equal(
    StateCutoffApiRequestSchema.safeParse({ perPage: 201 }).success,
    false,
  );
  assert.equal(
    StateCutoffApiRequestSchema.safeParse({
      categories: Array.from({ length: 101 }, (_, index) => `GOPEN${index}`),
    }).success,
    false,
  );
  assert.equal(
    StateCutoffApiRequestSchema.safeParse({
      search: "x".repeat(201),
    }).success,
    false,
  );
  assert.equal(
    StateCutoffApiRequestSchema.safeParse({
      courses: ["x".repeat(241)],
    }).success,
    false,
  );
});

test("measures multibyte request bodies by bytes rather than characters", () => {
  assert.equal(getUtf8ByteLength("é"), 2);
  assert.ok(
    getUtf8ByteLength("é".repeat(STATE_CUTOFF_MAX_REQUEST_BYTES / 2 + 1)) >
      STATE_CUTOFF_MAX_REQUEST_BYTES,
  );
});
