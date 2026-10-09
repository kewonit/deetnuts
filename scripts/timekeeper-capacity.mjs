import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";
import manifest from "../docs/timekeeper-migration/manifest.json" with { type: "json" };

export function validateCapacityConfiguration(config) {
  const requireThat = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const candidate = config?.candidate;
  const origin = new URL(candidate?.origin);
  requireThat(
    ["http:", "https:"].includes(origin.protocol) &&
      origin.pathname === "/" &&
      !origin.username &&
      !origin.password &&
      !origin.search &&
      !origin.hash,
    "Use a candidate origin without credentials or a path",
  );
  requireThat(
    ![
      "deetnuts.com",
      "www.deetnuts.com",
      "api.deetnuts.com",
      "timekeeper.edbn.me",
      "timekeeper-933.pages.dev",
      "7d4c1fd6.timekeeper-933.pages.dev",
      "exam-timekeeper.pages.dev",
    ].includes(origin.hostname),
    "Never run migration capacity tests against a live production hostname",
  );
  requireThat(
    candidate.isolated === true &&
      candidate.productionEquivalentResources === true &&
      candidate.isolationEvidence &&
      candidate.resourceEvidence &&
      /^[0-9a-f]{40}$/.test(candidate.releaseSha),
    "Document host isolation, matching production resource limits, and the exact candidate release",
  );
  const metrics = [
    config.measurements?.timekeeper,
    config.measurements?.deetnuts,
  ];
  for (const metric of metrics) {
    requireThat(
      metric &&
        Number.isFinite(metric.peakRps) &&
        metric.peakRps > 0 &&
        metric.reference &&
        metric.hostname &&
        Number.isFinite(metric.resolutionSeconds) &&
        metric.resolutionSeconds > 0 &&
        metric.resolutionSeconds <= 60 &&
        Date.parse(metric.windowEnd) - Date.parse(metric.windowStart) >=
          86400000,
      "Provide hostname-specific peak traffic with its measured window, reference and resolution; daily totals are insufficient",
    );
  }
  requireThat(
    metrics[0].hostname === "timekeeper.edbn.me" &&
      metrics[1].hostname === "www.deetnuts.com",
    "Peak measurements must describe the two exact live hostnames",
  );
  for (const group of ["existing", "feature", "uncached"])
    requireThat(
      Number.isFinite(config.baseline?.[group]?.p95Ms) &&
        config.baseline[group].p95Ms > 0 &&
        Number.isFinite(config.baseline[group].p99Ms) &&
        config.baseline[group].p99Ms >= config.baseline[group].p95Ms &&
        config.baseline[group].reference,
      `A measured ${group} latency baseline is required`,
    );
  requireThat(
    candidate.cacheMissEvidence &&
      ["origin-only", "observed-edge-misses"].includes(candidate.cacheMissMode),
    "Document how isolated cache misses will be generated and verified",
  );
  const peak = metrics.reduce((sum, metric) => sum + metric.peakRps, 0);
  const rate = Math.ceil(peak * 2);
  requireThat(
    rate <= 2000,
    "This runner supports at most 2000 RPS; use a distributed generator above that limit",
  );
  const durationSeconds = config.durationSeconds ?? 300;
  requireThat(
    Number.isInteger(durationSeconds) &&
      durationSeconds >= 300 &&
      durationSeconds <= 900,
    "Each phase must last 300–900 seconds",
  );
  return { origin: origin.origin, rate, peak, durationSeconds };
}

const percentile = (values, fraction) =>
  values[Math.max(0, Math.ceil(values.length * fraction) - 1)] ?? Infinity;

async function runCapacity(config) {
  const { origin, rate, peak, durationSeconds } =
    validateCapacityConfiguration(config);
  const health = await fetch(`${origin}/api/health`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!health.ok || (await health.json()).sha !== config.candidate.releaseSha)
    throw new Error("The isolated candidate is not the specified release");
  const feature = Object.values(manifest.redirects);
  const existing = [
    "/",
    "/sitemap-index.xml",
    "/jee-main/colleges/assam-university/cutoffs/2025",
    "/jee-main/colleges",
    "/mht-cet/colleges",
  ];
  const targets = [
    ...feature.map((path) => ({ path, group: "feature" })),
    ...Array.from({ length: 21 }, (_, index) => ({
      path: existing[index % existing.length],
      group: "existing",
    })),
    ...Array.from({ length: 11 }, (_, index) => ({
      path: index % 2 ? "/api/health" : "/api/exam-countdown/config",
      group: "uncached",
    })),
  ];
  // These requests exercise only reads. Study sessions and private migration
  // tickets are not generated against the unchanged production backends.
  const phases = [];
  for (const name of ["warm", "cache-miss"]) {
    if (name === "warm")
      for (const path of [...feature, ...existing]) {
        const response = await fetch(`${origin}${path}`, {
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok)
          throw new Error(
            `Capacity warm-up failed: ${path} returned ${response.status}`,
          );
        await response.arrayBuffer();
      }
    const groups = Object.fromEntries(
      ["feature", "existing", "uncached"].map((group) => [
        group,
        { latencies: [], failures: 0, cacheMisses: 0 },
      ]),
    );
    const start = performance.now();
    const pending = new Set();
    let launched = 0,
      dropped = 0,
      maxSchedulingDelayMs = 0,
      lastProgress = start;
    const expected = Math.ceil(rate * durationSeconds);
    const send = async (index) => {
      const target = targets[index % targets.length];
      const result = groups[target.group];
      const started = performance.now();
      try {
        const url = new URL(target.path, origin);
        if (name === "cache-miss")
          url.searchParams.set("tk_capacity", String(index));
        const response = await fetch(url, {
          redirect: "manual",
          headers: name === "cache-miss" ? { "Cache-Control": "no-cache" } : {},
          signal: AbortSignal.timeout(15000),
        });
        await response.arrayBuffer();
        if (response.status !== 200) result.failures++;
        const cache =
          response.headers.get("cf-cache-status") ??
          response.headers.get("x-cache") ??
          "";
        if (
          /MISS|BYPASS|DYNAMIC|EXPIRED/i.test(cache) ||
          /no-store/.test(response.headers.get("cache-control") ?? "") ||
          (name === "cache-miss" &&
            config.candidate.cacheMissMode === "origin-only")
        )
          result.cacheMisses++;
      } catch {
        result.failures++;
      } finally {
        result.latencies.push(performance.now() - started);
      }
    };
    while (launched < expected) {
      const elapsed = performance.now() - start;
      const due = Math.min(expected, Math.floor((elapsed * rate) / 1000) + 1);
      while (launched < due) {
        maxSchedulingDelayMs = Math.max(
          maxSchedulingDelayMs,
          elapsed - (launched * 1000) / rate,
        );
        if (pending.size >= Math.max(100, rate * 20)) dropped++;
        else {
          const operation = send(launched).finally(() =>
            pending.delete(operation),
          );
          pending.add(operation);
        }
        launched++;
      }
      if (elapsed - lastProgress >= 30000) {
        console.log(
          JSON.stringify({
            phase: name,
            offeredRps: rate,
            elapsedSeconds: Math.round(elapsed / 1000),
            pending: pending.size,
            dropped,
          }),
        );
        lastProgress = elapsed;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    await Promise.all(pending);
    const results = Object.fromEntries(
      Object.entries(groups).map(([group, result]) => {
        const ordered = result.latencies.sort((a, b) => a - b);
        const p95Ms = percentile(ordered, 0.95),
          p99Ms = percentile(ordered, 0.99);
        const baseline = config.baseline[group];
        return [
          group,
          {
            requests: ordered.length,
            failures: result.failures,
            cacheMisses: result.cacheMisses,
            p95Ms: Math.round(p95Ms),
            p99Ms: Math.round(p99Ms),
            passed:
              ordered.length > 0 &&
              result.failures === 0 &&
              p95Ms <= baseline.p95Ms * 1.1 + 25 &&
              p99Ms <= baseline.p99Ms * 1.1 + 25,
          },
        ];
      }),
    );
    const achievedRps =
      Object.values(results).reduce((sum, result) => sum + result.requests, 0) /
      durationSeconds;
    const cacheMissVerified =
      name === "warm" ||
      (results.feature.cacheMisses / results.feature.requests >= 0.5 &&
        results.uncached.cacheMisses / results.uncached.requests >= 0.99);
    const passed =
      dropped === 0 &&
      maxSchedulingDelayMs < 1000 &&
      achievedRps >= rate * 0.98 &&
      cacheMissVerified &&
      Object.values(results).every((result) => result.passed);
    phases.push({
      name,
      passed,
      durationSeconds,
      achievedRps,
      dropped,
      maxSchedulingDelayMs: Math.round(maxSchedulingDelayMs),
      cacheMissVerified,
      results,
    });
    if (!passed) break;
  }
  return {
    passed: phases.length === 2 && phases.every((phase) => phase.passed),
    checkedAt: new Date().toISOString(),
    releaseSha: config.candidate.releaseSha,
    isolated: true,
    productionEquivalentResources: true,
    origin,
    observedCombinedPeakRps: peak,
    testedRps: rate,
    cacheMissVerified: phases[1]?.cacheMissVerified === true,
    measurements: config.measurements,
    candidate: config.candidate,
    baseline: config.baseline,
    phases,
  };
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  const configuration = process.argv
    .find((value) => value.startsWith("--config="))
    ?.slice(9);
  const output = process.argv
    .find((value) => value.startsWith("--report="))
    ?.slice(9);
  if (!configuration || !output)
    throw new Error(
      "Pass --config=measured-input.json --report=capacity-report.json. Use an isolated host only.",
    );
  const report = await runCapacity(
    JSON.parse(await readFile(configuration, "utf8")),
  );
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, {
    mode: 0o600,
  });
  console.log(
    JSON.stringify({
      passed: report.passed,
      observedCombinedPeakRps: report.observedCombinedPeakRps,
      testedRps: report.testedRps,
      report: output,
    }),
  );
  if (!report.passed) process.exitCode = 1;
}
