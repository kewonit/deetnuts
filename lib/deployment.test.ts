import assert from "node:assert/strict";
import test from "node:test";

import { normalizeDeploymentSha } from "./deployment";

test("normalizeDeploymentSha accepts immutable release identifiers", () => {
  assert.equal(normalizeDeploymentSha("a1b2c3d4"), "a1b2c3d4");
  assert.equal(
    normalizeDeploymentSha("release_2026-08-23"),
    "release_2026-08-23",
  );
});

test("normalizeDeploymentSha hides missing or malformed values", () => {
  assert.equal(normalizeDeploymentSha(undefined), "unknown");
  assert.equal(normalizeDeploymentSha("short"), "unknown");
  assert.equal(normalizeDeploymentSha("sha with spaces"), "unknown");
});
