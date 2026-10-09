import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import manifest from "../docs/timekeeper-migration/manifest.json" with { type: "json" };

export function cutoverFailures(evidence, phase, now = Date.now()) {
  const failures = [];
  const check = (condition, message) => {
    if (!condition) failures.push(message);
  };
  const time = (value) => Date.parse(value ?? "");
  const sha = (value) =>
    typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
  const fresh = (report) =>
    Number.isFinite(time(report?.checkedAt)) &&
    time(report.checkedAt) <= now &&
    now - time(report.checkedAt) < 24 * 60 * 60 * 1000;
  const routesPassed = (report, release) =>
    report?.passed === true &&
    report.production === true &&
    report.pages === manifest.counts.pages &&
    report.releaseSha === release &&
    fresh(report);
  check(
    ["canary", "permanent", "retired"].includes(phase),
    "Choose canary, permanent or retired",
  );
  check(
    evidence?.sourceCommit === manifest.sourceCommit,
    "Confirmed production source does not match the imported commit",
  );
  const release = evidence?.releaseSha;
  check(sha(release), "A full candidate release SHA is required");
  for (const field of [
    "dnsTlsAndRulesCaptured",
    "searchConsoleOwnershipVerified",
    "recoveryArtifactsVerified",
    "oldOriginImportVerified",
    "rollbackDrillPassed",
  ])
    check(evidence?.[field] === true, `${field} has no successful evidence`);
  check(
    routesPassed(evidence?.routes, release),
    "A current production route, canonical, asset and CSP report is required for this release",
  );
  for (const field of ["browser", "productionChecks"])
    check(
      evidence?.[field]?.passed === true &&
        evidence[field].releaseSha === release &&
        fresh(evidence[field]),
      `${field} must pass for this release`,
    );
  check(
    evidence?.browser?.viewportWidths?.join(",") === "320,390,768,1024,1440",
    "Browser verification must cover all five supported widths",
  );
  const capacity = evidence?.capacity;
  check(
    capacity?.passed === true &&
      capacity.releaseSha === release &&
      capacity.isolated === true &&
      capacity.productionEquivalentResources === true,
    "Isolated capacity verification must pass for the candidate with production resource limits",
  );
  const peak = capacity?.observedCombinedPeakRps;
  check(
    Number.isFinite(peak) && peak > 0 && capacity?.testedRps >= 2 * peak,
    "Capacity must cover at least twice the measured combined peak",
  );
  check(
    capacity?.phases?.length === 2 &&
      capacity.phases.every(
        (item) =>
          item.passed &&
          item.achievedRps >= 2 * peak * 0.98 &&
          item.durationSeconds >= 300,
      ) &&
      capacity.cacheMissVerified === true,
    "Warm and cache-miss capacity phases must both pass without reducing the offered load",
  );
  const observed = evidence?.observation;
  check(
    time(observed?.start) >= time(evidence?.candidateDeployedAt) &&
      time(observed?.end) <= now &&
      time(observed?.end) - time(observed?.start) >= 24 * 60 * 60 * 1000 &&
      now - time(observed?.end) < 60 * 60 * 1000 &&
      observed?.passed === true &&
      observed.unresolvedErrors === 0,
    "A measured, clean 24-hour production observation ending within the last hour is required",
  );
  const rollback = evidence?.rollback;
  check(
    sha(rollback?.releaseSha) &&
      routesPassed(rollback?.routes, rollback.releaseSha) &&
      rollback?.pinned === true &&
      /^sha256:[0-9a-f]{64}$/.test(rollback?.webDigest ?? ""),
    "Pin and test an immutable rollback release containing all new, indexable routes",
  );
  if (phase === "canary") {
    const window = evidence?.canaryWindow;
    check(
      time(window?.start) <= now &&
        now < time(window?.end) &&
        time(window?.end) - time(window?.start) === 30 * 60 * 1000 &&
        Number.isFinite(window?.observedRps) &&
        window.observedRps < peak &&
        Boolean(window?.measurementReference),
      "Select a measured low-traffic window lasting exactly 30 minutes",
    );
  } else {
    const canary = evidence?.canary;
    check(
      canary?.path === "/category/teaching" &&
        canary.status === 307 &&
        canary.cacheControl === "no-store, max-age=0" &&
        canary.passed === true &&
        canary.unresolvedErrors === 0 &&
        time(canary.end) <= now &&
        time(canary.end) - time(canary.start) >= 30 * 60 * 1000,
      "The non-cacheable teaching canary must pass a measured 30-minute observation",
    );
    check(
      evidence?.singleHopRedirectsVerified === true &&
        evidence?.rollbackMarkerInstalled === true,
      "Verify one-hop redirects and install the destination rollback guard before permanent redirects",
    );
  }
  if (phase === "retired") {
    const stable = evidence?.stability;
    check(
      time(stable?.start) >= time(evidence?.permanentRedirectStartedAt) &&
        time(stable?.end) <= now &&
        time(stable?.end) - time(stable?.start) >= 30 * 24 * 60 * 60 * 1000 &&
        stable?.passed === true &&
        stable.unresolvedErrors === 0,
      "At least 30 measured stable days after permanent redirects are required",
    );
    check(
      evidence?.searchMigration?.sitemapSubmitted === true &&
        evidence.searchMigration.changeOfAddressSubmitted === true &&
        evidence.searchMigration.canonicalSelectionReviewed === true &&
        evidence.searchMigration.indexedReplacementsReviewed === true &&
        evidence.searchMigration.organicLandingTrafficReviewed === true,
      "Review the sitemap, Change of Address, crawler/indexing, canonical selection and organic traffic evidence before retirement",
    );
    check(
      evidence?.compatibilityServiceIndependent === true &&
        evidence?.hostnameDnsTlsRetained === true,
      "Verify the independent redirect/import service and indefinite old-host DNS/TLS retention before disconnecting Pages",
    );
  }
  return failures;
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  const phase = process.argv
    .find((value) => value.startsWith("--phase="))
    ?.slice(8);
  const file = process.argv
    .find((value) => value.startsWith("--evidence="))
    ?.slice(11);
  if (!file)
    throw new Error(
      "Pass --evidence=/absolute/path/evidence.json; never infer missing evidence",
    );
  const failures = cutoverFailures(
    JSON.parse(await readFile(file, "utf8")),
    phase,
  );
  if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      `Verified migration evidence permits the ${phase} phase. This check does not deploy or change traffic.`,
    );
}
