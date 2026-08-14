import assert from "node:assert/strict";
import test from "node:test";
import {
  getMhtCetCollegePath,
  matchesCanonicalSegment,
} from "./canonical";

test("builds stable canonical MHT-CET paths", () => {
  assert.equal(
    getMhtCetCollegePath("Government College of Engineering, Amravati", 1002),
    "/mht-cet/colleges/government-college-of-engineering-amravati-01002",
  );
});

test("canonical segment matching is decoded and exact", () => {
  assert.equal(matchesCanonicalSegment("college-01002", "college-01002"), true);
  assert.equal(matchesCanonicalSegment("COLLEGE-01002", "college-01002"), false);
  assert.equal(matchesCanonicalSegment("not-the-slug", "college-01002"), false);
  assert.equal(matchesCanonicalSegment("%E0%A4%A", "college-01002"), false);
});
