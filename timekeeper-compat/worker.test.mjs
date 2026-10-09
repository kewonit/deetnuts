import assert from "node:assert/strict";
import test from "node:test";
import manifest from "../docs/timekeeper-migration/manifest.json" with { type: "json" };
import worker, { handleRequest } from "./worker.mjs";

test("every canonical route and historical alias redirects directly with queries and normalized slashes", async () => {
  for (const [path, destination] of Object.entries({
    ...manifest.redirects,
    ...manifest.aliases,
  })) {
    for (const suffix of ["", "/", "///"]) {
      const url = `${manifest.oldOrigin}${path === "/" ? "/" : path}${suffix}?a=one%20two&a=three&session=2`;
      const response = await worker.fetch(
        new Request(url),
        { ROLLOUT_PHASE: "permanent" },
        {},
      );
      assert.equal(response.status, 301, url);
      assert.equal(
        response.headers.get("location"),
        `${manifest.newOrigin}${destination}?a=one%20two&a=three&session=2`,
      );
      assert.ok(!response.headers.get("location").includes("#"));
    }
  }
});

test("canary is non-cacheable, timed and restricted to the teaching category", async () => {
  const env = {
    ROLLOUT_PHASE: "canary",
    CANARY_UNTIL: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
  const response = await handleRequest(
    new Request(`${manifest.oldOrigin}/category/teaching/?q=1`),
    env,
  );
  assert.equal(response.status, 307);
  assert.match(response.headers.get("cache-control"), /no-store/);
  const source = async (request) => {
    assert.ok(request.url.startsWith(manifest.immutableSourceOrigin));
    return new Response("old application");
  };
  assert.equal(
    await (
      await handleRequest(
        new Request(`${manifest.oldOrigin}/exams/jee-main`),
        env,
        source,
      )
    ).text(),
    "old application",
  );
  assert.equal(
    await (
      await handleRequest(
        new Request(`${manifest.oldOrigin}/category/teaching`),
        { ...env, CANARY_UNTIL: "2020-01-01" },
        source,
      )
    ).text(),
    "old application",
  );
});

test("fallback paths cannot change the pinned source origin or forward credentials", async () => {
  for (const path of ["//attacker.example/path", "/exams/jee-main"])
    await handleRequest(
      new Request(`${manifest.oldOrigin}${path}?q=one%20two&q=three`, {
        headers: { cookie: "private=session", authorization: "Bearer private" },
      }),
      { ROLLOUT_PHASE: "serve" },
      async (request) => {
        const source = new URL(request.url);
        assert.equal(source.origin, manifest.immutableSourceOrigin);
        assert.equal(source.pathname, path);
        assert.equal(source.search, "?q=one%20two&q=three");
        assert.equal(request.headers.has("cookie"), false);
        assert.equal(request.headers.has("authorization"), false);
        assert.equal(request.redirect, "manual");
        return new Response("pinned application");
      },
    );
});

test("compatibility previews are unindexed and non-cacheable, including source fallback and redirects", async () => {
  for (const phase of ["serve", "permanent"]) {
    const response = await handleRequest(
      new Request("https://candidate.workers.dev/exams/jee-main"),
      { ROLLOUT_PHASE: phase },
      async () =>
        new Response("source page", {
          headers: { "Cache-Control": "public, max-age=300" },
        }),
    );
    assert.equal(response.status, phase === "serve" ? 200 : 301);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  const production = await handleRequest(
    new Request(`${manifest.oldOrigin}/exams/jee-main`),
    { ROLLOUT_PHASE: "permanent" },
  );
  assert.equal(production.headers.get("x-robots-tag"), null);
  assert.match(production.headers.get("cache-control"), /public/);
});

test("unknown pages are 404, retired example is 410, helper and old assets stay available", async () => {
  const env = { ROLLOUT_PHASE: "retired" };
  for (const path of [...manifest.knownMissing, "/invented", "/exams/not-real"])
    assert.equal(
      (await handleRequest(new Request(`${manifest.oldOrigin}${path}`), env))
        .status,
      404,
    );
  assert.equal(
    (
      await handleRequest(
        new Request(`${manifest.oldOrigin}/example-usage/`),
        env,
      )
    ).status,
    410,
  );
  const helper = await handleRequest(
    new Request(`${manifest.oldOrigin}/migrate-to-deetnuts`),
    env,
  );
  assert.equal(helper.status, 200);
  assert.match(helper.headers.get("cache-control"), /no-store/);
  assert.match(helper.headers.get("x-robots-tag"), /noindex/);
  assert.match(await helper.text(), /original data stays/);
  const asset = await handleRequest(
    new Request(`${manifest.oldOrigin}/_astro/old.js`),
    env,
    async () => new Response("asset"),
  );
  assert.equal(await asset.text(), "asset");
  const head = await handleRequest(
    new Request(`${manifest.oldOrigin}/migrate-to-deetnuts`, {
      method: "HEAD",
    }),
    env,
  );
  assert.equal(await head.text(), "");
  const sw = await handleRequest(
    new Request(`${manifest.oldOrigin}/sw.js`),
    env,
  );
  const script = await sw.text();
  assert.ok(
    !script.includes("setInterval") && !script.includes("caches.delete"),
  );
});
