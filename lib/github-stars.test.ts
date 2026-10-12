import assert from "node:assert/strict";
import test from "node:test";
import {
  createGitHubStarCache,
  fetchGitHubStarCount,
  formatStarCount,
} from "./github-stars";

const HOUR = 60 * 60 * 1000;

function githubResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function fakeGitHub(responses: Array<number | Error | Response>) {
  const calls: string[] = [];
  const fetchImpl = async (input: string) => {
    calls.push(input);
    const next = responses.shift();
    if (next instanceof Error) throw next;
    if (next instanceof Response) return next;
    return githubResponse({ stargazers_count: next });
  };
  return { calls, fetchImpl };
}

test("reads stargazers_count from the repository API", async () => {
  const { calls, fetchImpl } = fakeGitHub([42]);
  assert.equal(await fetchGitHubStarCount(fetchImpl), 42);
  assert.deepEqual(calls, ["https://api.github.com/repos/kewonit/deetnuts"]);
});

test("rejects error responses, network failures, and malformed counts", async () => {
  const failures = [
    githubResponse({ message: "rate limited" }, 403),
    new Error("offline"),
    githubResponse({ stargazers_count: "42" }),
    githubResponse({ stargazers_count: -1 }),
    githubResponse({ stargazers_count: 1.5 }),
  ];
  for (const failure of failures) {
    const { fetchImpl } = fakeGitHub([failure]);
    assert.equal(await fetchGitHubStarCount(fetchImpl), null);
  }
});

test("serves a fresh count from memory without calling GitHub again", async () => {
  let clock = 0;
  const { calls, fetchImpl } = fakeGitHub([10]);
  const get = createGitHubStarCache({ fetchImpl, now: () => clock });
  assert.equal(await get(), 10);
  clock += 5 * HOUR;
  assert.equal(await get(), 10);
  assert.equal(calls.length, 1);
});

test("shares one request between concurrent callers", async () => {
  const { calls, fetchImpl } = fakeGitHub([7]);
  const get = createGitHubStarCache({ fetchImpl, now: () => 0 });
  assert.deepEqual(await Promise.all([get(), get(), get()]), [7, 7, 7]);
  assert.equal(calls.length, 1);
});

test("returns the stale count immediately and refreshes in the background", async () => {
  let clock = 0;
  const { calls, fetchImpl } = fakeGitHub([10, 12]);
  const get = createGitHubStarCache({ fetchImpl, now: () => clock });
  assert.equal(await get(), 10);
  clock += 7 * HOUR;
  assert.equal(await get(), 10);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(await get(), 12);
  assert.equal(calls.length, 2);
});

test("keeps the last good count when a refresh fails, then retries later", async () => {
  let clock = 0;
  const { calls, fetchImpl } = fakeGitHub([10, new Error("offline"), 11]);
  const get = createGitHubStarCache({ fetchImpl, now: () => clock });
  assert.equal(await get(), 10);
  clock += 7 * HOUR;
  assert.equal(await get(), 10);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(await get(), 10);
  assert.equal(calls.length, 2);
  clock += 6 * 60 * 1000;
  assert.equal(await get(), 10);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(await get(), 11);
  assert.equal(calls.length, 3);
});

test("retries a first-time failure after a short delay instead of six hours", async () => {
  let clock = 0;
  const { calls, fetchImpl } = fakeGitHub([new Error("offline"), 5]);
  const get = createGitHubStarCache({ fetchImpl, now: () => clock });
  assert.equal(await get(), null);
  assert.equal(await get(), null);
  assert.equal(calls.length, 1);
  clock += 6 * 60 * 1000;
  assert.equal(await get(), 5);
});

test("formats counts compactly from one thousand", () => {
  assert.equal(formatStarCount(null), null);
  assert.equal(formatStarCount(0), "0");
  assert.equal(formatStarCount(999), "999");
  assert.equal(formatStarCount(1234), "1.2K");
  assert.equal(formatStarCount(15000), "15K");
});
