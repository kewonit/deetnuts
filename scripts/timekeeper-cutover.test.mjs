import { test } from "node:test";
import assert from "node:assert/strict";
import manifest from "../docs/timekeeper-migration/manifest.json" with { type: "json" };
import { cutoverFailures } from "./timekeeper-cutover.mjs";

const now = Date.parse("2026-11-10T12:00:00Z");
const at = (offset) => new Date(now + offset).toISOString();
const day = 86400000;
const release = "a".repeat(40);
const routeReport = {
  passed: true,
  production: true,
  pages: 74,
  releaseSha: release,
  checkedAt: at(-1000),
};
function validEvidence() {
  return {
    sourceCommit: manifest.sourceCommit,
    releaseSha: release,
    dnsTlsAndRulesCaptured: true,
    searchConsoleOwnershipVerified: true,
    recoveryArtifactsVerified: true,
    oldOriginImportVerified: true,
    rollbackDrillPassed: true,
    routes: routeReport,
    browser: {
      passed: true,
      releaseSha: release,
      checkedAt: at(-1000),
      viewportWidths: [320, 390, 768, 1024, 1440],
    },
    productionChecks: {
      passed: true,
      releaseSha: release,
      checkedAt: at(-1000),
    },
    capacity: {
      passed: true,
      releaseSha: release,
      isolated: true,
      productionEquivalentResources: true,
      observedCombinedPeakRps: 20,
      testedRps: 40,
      cacheMissVerified: true,
      phases: [
        { passed: true, achievedRps: 40, durationSeconds: 300 },
        { passed: true, achievedRps: 40, durationSeconds: 300 },
      ],
    },
    candidateDeployedAt: at(-32 * day),
    observation: {
      start: at(-day - 1000),
      end: at(-1000),
      passed: true,
      unresolvedErrors: 0,
    },
    rollback: {
      releaseSha: release,
      routes: routeReport,
      pinned: true,
      webDigest: `sha256:${"b".repeat(64)}`,
    },
    canaryWindow: {
      start: at(-1000),
      end: at(1799000),
      observedRps: 2,
      measurementReference: "isolated test fixture",
    },
    canary: {
      path: "/category/teaching",
      status: 307,
      cacheControl: "no-store, max-age=0",
      start: at(-31 * day - 1800000),
      end: at(-31 * day),
      passed: true,
      unresolvedErrors: 0,
    },
    singleHopRedirectsVerified: true,
    rollbackMarkerInstalled: true,
    permanentRedirectStartedAt: at(-31 * day),
    stability: {
      start: at(-31 * day),
      end: at(-1000),
      passed: true,
      unresolvedErrors: 0,
    },
    searchMigration: {
      sitemapSubmitted: true,
      changeOfAddressSubmitted: true,
      canonicalSelectionReviewed: true,
      indexedReplacementsReviewed: true,
      organicLandingTrafficReviewed: true,
    },
    compatibilityServiceIndependent: true,
    hostnameDnsTlsRetained: true,
  };
}
test("complete measured evidence permits only the requested rollout phase", () => {
  for (const phase of ["canary", "permanent", "retired"])
    assert.deepEqual(cutoverFailures(validEvidence(), phase, now), []);
});
test("missing evidence and wall-clock waiting alone cannot permit a cutover", () => {
  assert.ok(cutoverFailures({}, "permanent", now).length > 10);
  const evidence = validEvidence();
  evidence.observation.unresolvedErrors = 1;
  assert.ok(
    cutoverFailures(evidence, "permanent", now).some((item) =>
      item.includes("24-hour"),
    ),
  );
  evidence.observation.unresolvedErrors = 0;
  evidence.observation.start = at(-day + 1000);
  assert.ok(
    cutoverFailures(evidence, "permanent", now).some((item) =>
      item.includes("24-hour"),
    ),
  );
});
test("an old rollback, reduced offered load or unverified cache misses blocks permanent redirects", () => {
  const evidence = validEvidence();
  evidence.rollback.routes = { ...routeReport, pages: 0 };
  evidence.capacity.cacheMissVerified = false;
  evidence.capacity.phases[1].achievedRps = 10;
  const failures = cutoverFailures(evidence, "permanent", now);
  assert.ok(
    failures.some((item) => item.includes("rollback")) &&
      failures.some((item) => item.includes("cache-miss")),
  );
});
test("retirement requires 30 stable days and completed search migration evidence", () => {
  const evidence = validEvidence();
  evidence.stability.start = at(-29 * day);
  evidence.searchMigration.indexedReplacementsReviewed = false;
  const failures = cutoverFailures(evidence, "retired", now);
  assert.ok(
    failures.some((item) => item.includes("30 measured")) &&
      failures.some((item) => item.includes("indexing")),
  );
});
