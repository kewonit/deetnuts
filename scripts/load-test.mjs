const baseUrl = process.env.LOAD_TEST_BASE_URL?.replace(/\/+$/, "");
const confirmation = process.env.LOAD_TEST_CONFIRM;
const rate = Number(process.env.LOAD_TEST_RPS || 10);
const durationSeconds = Number(process.env.LOAD_TEST_DURATION_SECONDS || 600);

if (!baseUrl || confirmation !== "deetnuts") {
  throw new Error(
    "Set LOAD_TEST_BASE_URL and LOAD_TEST_CONFIRM=deetnuts to run the bounded load test",
  );
}
if (!Number.isInteger(rate) || rate < 1 || rate > 10) {
  throw new Error("LOAD_TEST_RPS must be an integer between 1 and 10");
}
if (
  !Number.isInteger(durationSeconds) ||
  durationSeconds < 10 ||
  durationSeconds > 600
) {
  throw new Error("LOAD_TEST_DURATION_SECONDS must be between 10 and 600");
}

const targets = [
  { path: "/api/health", p95LimitMs: 500 },
  { path: "/", p95LimitMs: 2_500 },
  { path: "/sitemap-index.xml", p95LimitMs: 2_500 },
];
const results = new Map(
  targets.map((target) => [target.path, { latencies: [], failures: 0 }]),
);
const startedAt = Date.now();
const deadline = startedAt + durationSeconds * 1_000;
const pending = new Set();
let requestIndex = 0;

async function runRequest(target) {
  const start = performance.now();
  try {
    const response = await fetch(`${baseUrl}${target.path}`, {
      headers: { accept: "text/html,application/json,application/xml" },
      signal: AbortSignal.timeout(15_000),
    });
    await response.arrayBuffer();
    if (!response.ok) results.get(target.path).failures += 1;
  } catch {
    results.get(target.path).failures += 1;
  } finally {
    results.get(target.path).latencies.push(performance.now() - start);
  }
}

const intervalMs = 1_000 / rate;
while (Date.now() < deadline) {
  const target = targets[requestIndex % targets.length];
  requestIndex += 1;
  const operation = runRequest(target).finally(() => pending.delete(operation));
  pending.add(operation);
  await new Promise((resolve) => setTimeout(resolve, intervalMs));
}
await Promise.all(pending);

let failed = false;
for (const target of targets) {
  const result = results.get(target.path);
  const ordered = result.latencies.sort((left, right) => left - right);
  const p95 = ordered[Math.max(0, Math.ceil(ordered.length * 0.95) - 1)] || 0;
  console.log(
    JSON.stringify({
      path: target.path,
      requests: ordered.length,
      failures: result.failures,
      p95Ms: Math.round(p95),
      limitMs: target.p95LimitMs,
    }),
  );
  if (result.failures > 0 || p95 > target.p95LimitMs) failed = true;
}

if (failed) process.exitCode = 1;
