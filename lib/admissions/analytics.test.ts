import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeAnalyticsPathname } from "./analytics";

test("analytics sees route templates rather than entity identifiers", () => {
  assert.equal(
    sanitizeAnalyticsPathname("/mht-cet/colleges/private-college-06120"),
    "/mht-cet/colleges/[slug]",
  );
  assert.equal(sanitizeAnalyticsPathname("/mht-cet/colleges"), "/mht-cet/colleges");
  assert.equal(
    sanitizeAnalyticsPathname("/jee-main/colleges/nit-trichy/cutoffs/2025/programs/computer-science/josaa/home-state/open/gender-neutral"),
    "/[jee-exam]/colleges/[slug]/cutoffs/[year]/programs/[program]/[body]/[quota]/[category]/[gender]",
  );
});
