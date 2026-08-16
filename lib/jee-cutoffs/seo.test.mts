import assert from "node:assert/strict";
import test from "node:test";
import { getCutoffSources, getJeeSeoRoutes } from "./seo";

test("SEO route artifact reconciles the quality-gated release", async () => {
  const routes = await getJeeSeoRoutes();
  assert.equal(routes.length, 113_821);
  assert.equal(new Set(routes.map((route) => route.path)).size, routes.length);
  assert.equal(routes.filter((route) => route.indexable).length, 96_853);
  assert.equal(routes.filter((route) => route.routeType === "program").length, 7_476);
  assert.equal(routes.filter((route) => route.routeType === "profile").length, 105_115);
  assert.equal(routes.filter((route) => route.routeType === "profile" && route.indexable).length, 88_147);
  assert.equal(routes.filter((route) => route.routeType === "profile" && !route.indexable).length, 16_968);
  assert.ok(routes.every((route) => !route.path.includes("?") && !route.path.includes("#")));
  assert.ok(routes.every((route) => route.programSlug === null || route.programSlug.length <= 96));
});

test("sitemap inventory contains only canonical indexable routes", async () => {
  const routes = await getJeeSeoRoutes();
  const core = routes.filter((route) => route.indexable && ["entry", "directory", "hub"].includes(route.routeType));
  const yearShards = routes.filter((route) => route.indexable && ["year", "program", "profile"].includes(route.routeType));
  assert.equal(core.length, 134);
  assert.equal(yearShards.length, 96_719);
  assert.equal(core.length + yearShards.length, 96_853);
  assert.ok(yearShards.every((route) => route.examId && route.year && route.year >= 2016 && route.year <= 2025));
  assert.ok(!routes.some((route) => route.routeType === "profile" && route.roundCount === 1 && route.indexable));
});

test("cutoff provenance registry covers every current source", async () => {
  const sources = await getCutoffSources();
  assert.equal(sources.length, 274);
  assert.equal(new Set(sources.map((source) => source.sourceId)).size, sources.length);
  assert.ok(sources.every((source) => source.title && source.officialDomain));
});
