import assert from "node:assert/strict";
import { test } from "node:test";
import { validateCapacityConfiguration } from "./timekeeper-capacity.mjs";

const metric = {
  peakRps: 12,
  resolutionSeconds: 1,
  windowStart: "2026-10-01T00:00:00Z",
  windowEnd: "2026-10-08T00:00:00Z",
  reference: "isolated fixture logs",
};
const latency = {
  p95Ms: 300,
  p99Ms: 600,
  reference: "isolated fixture measurement",
};
const config = () => ({
  candidate: {
    origin: "http://127.0.0.1:3108",
    releaseSha: "a".repeat(40),
    isolated: true,
    productionEquivalentResources: true,
    isolationEvidence: "fixture separate VM",
    resourceEvidence: "fixture matching CPU/RAM",
    cacheMissEvidence: "fixture direct origin",
    cacheMissMode: "origin-only",
  },
  measurements: {
    timekeeper: { ...metric, hostname: "timekeeper.edbn.me" },
    deetnuts: { ...metric, hostname: "www.deetnuts.com" },
  },
  baseline: { existing: latency, feature: latency, uncached: latency },
});
test("capacity rate is derived from the observed combined peak", () => {
  assert.equal(validateCapacityConfiguration(config()).rate, 48);
});
test("production hosts, aggregated totals and undocumented isolation cannot be load tested", () => {
  for (const origin of [
    "https://www.deetnuts.com",
    "https://timekeeper.edbn.me",
    "https://7d4c1fd6.timekeeper-933.pages.dev",
  ]) {
    const value = config();
    value.candidate.origin = origin;
    assert.throws(
      () => validateCapacityConfiguration(value),
      /live production/,
    );
  }
  const value = config();
  value.measurements.timekeeper.resolutionSeconds = 86400;
  assert.throws(() => validateCapacityConfiguration(value), /daily totals/);
  value.measurements.timekeeper.resolutionSeconds = 1;
  value.candidate.isolated = false;
  assert.throws(() => validateCapacityConfiguration(value), /isolation/);
});
