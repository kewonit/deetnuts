import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdmissionsCanonicalRedirectPath,
  getAdmissionsCanonicalRouteDecision,
  getCanonicalMhtCetCollegePaths,
} from "./proxy-canonical";

test("resolves any MHT-CET alias suffix to the stable current college path", () => {
  assert.equal(
    getAdmissionsCanonicalRedirectPath("/mht-cet/colleges/anything-at-all-1002"),
    "/mht-cet/colleges/government-college-of-engineering-amravati-01002",
  );
  assert.equal(
    getAdmissionsCanonicalRedirectPath("/mht-cet/colleges/not-a-college"),
    null,
  );
  assert.deepEqual(
    getAdmissionsCanonicalRouteDecision("/mht-cet/colleges/not-a-college"),
    { type: "not-found", system: "mht-cet" },
  );
});

test("sitemap inventory contains unique canonical college paths", () => {
  const colleges = getCanonicalMhtCetCollegePaths();

  assert.equal(new Set(colleges).size, colleges.length);
  assert.ok(
    colleges.includes(
      "/mht-cet/colleges/government-college-of-engineering-amravati-01002",
    ),
  );
});
