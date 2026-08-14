import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeAnalyticsPathname } from "./analytics";

test("analytics sees route templates rather than entity identifiers", () => {
  assert.equal(
    sanitizeAnalyticsPathname("/mht-cet/colleges/private-college-06120"),
    "/mht-cet/colleges/[slug]",
  );
  assert.equal(sanitizeAnalyticsPathname("/mht-cet/colleges"), "/mht-cet/colleges");
});
