import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { GET as sitemapIndex } from "../../app/sitemap-index.xml/route";
import {
  GET as sitemapShard,
  generateStaticParams,
} from "../../app/sitemaps/[exam]/[year]/route";
import { getCanonicalMhtCetCollegePaths } from "../admissions/proxy-canonical";
import { PRODUCTION_SITE_URL } from "../site-url";
import { getJeeSeoRoutes } from "./seo";
const require = createRequire(import.meta.url);
const coreSitemap = (
  require("../../app/sitemap.ts") as typeof import("../../app/sitemap")
).default;
const mhtCetSitemap = (
  require("../../app/mht-cet/sitemap.ts") as typeof import("../../app/mht-cet/sitemap")
).default;

function locations(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1].replace(/&amp;/g, "&"),
  );
}

test("every indexable JEE route appears once in the actual core and shard outputs", async () => {
  const routes = await getJeeSeoRoutes();
  const expected = new Set(
    routes
      .filter((route) => route.indexable)
      .map((route) => PRODUCTION_SITE_URL + route.path),
  );
  const published = (await coreSitemap()).map((entry) => entry.url);
  assert.ok(!published.includes(PRODUCTION_SITE_URL + "/datasource"));
  assert.ok(
    published.includes(
      PRODUCTION_SITE_URL + "/compliance/data-sources-and-licensing",
    ),
  );
  const shards = await generateStaticParams();
  assert.equal(shards.length, 20);
  for (const shard of shards) {
    const response = await sitemapShard(new Request(PRODUCTION_SITE_URL), {
      params: Promise.resolve(shard),
    });
    assert.equal(response.status, 200);
    const xml = await response.text();
    const urls = locations(xml);
    assert.ok(urls.length > 0 && urls.length <= 50_000);
    assert.ok(Buffer.byteLength(xml, "utf8") < 50 * 1024 * 1024);
    assert.equal(new Set(urls).size, urls.length);
    assert.ok(urls.every((url) => expected.has(url)));
    published.push(...urls);
  }
  assert.equal(new Set(published).size, published.length);
  const actualJee = new Set(published.filter((url) => expected.has(url)));
  assert.deepEqual(actualJee, expected);
  assert.ok(
    published.every((location) => {
      const url = new URL(location);
      return url.origin === PRODUCTION_SITE_URL && !url.search && !url.hash;
    }),
  );
  const excluded = routes
    .filter((route) => !route.indexable)
    .map((route) => PRODUCTION_SITE_URL + route.path);
  const all = new Set(published);
  assert.ok(excluded.every((url) => !all.has(url)));
});

test("sitemap index discovers every JEE shard, MHT-CET and exam countdowns", async () => {
  const response = await sitemapIndex();
  assert.equal(response.status, 200);
  const xml = await response.text();
  const urls = locations(xml);
  assert.equal(urls.length, 23);
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.includes(PRODUCTION_SITE_URL + "/sitemap.xml"));
  assert.ok(urls.includes(PRODUCTION_SITE_URL + "/mht-cet/sitemap.xml"));
  assert.ok(urls.includes(PRODUCTION_SITE_URL + "/exam-countdown/sitemap.xml"));
  for (const { exam, year } of await generateStaticParams()) {
    assert.ok(
      urls.includes(PRODUCTION_SITE_URL + "/sitemaps/" + exam + "/" + year),
    );
  }
  assert.doesNotMatch(xml, /<loc>[^<]+\/mht-cet\/sitemap.xml<\/loc><lastmod>/);
});

test("MHT-CET sitemap includes only enabled canonical college routes", async (t) => {
  const previous = process.env.ADMISSIONS_V2_MHT_CET;
  t.after(() => {
    if (previous === undefined) delete process.env.ADMISSIONS_V2_MHT_CET;
    else process.env.ADMISSIONS_V2_MHT_CET = previous;
  });
  process.env.ADMISSIONS_V2_MHT_CET = "false";
  const disabled = await mhtCetSitemap();
  assert.equal(disabled.length, 4);
  assert.ok(disabled.every((entry) => !entry.url.includes("/colleges/")));
  process.env.ADMISSIONS_V2_MHT_CET = "true";
  const enabled = await mhtCetSitemap();
  assert.equal(
    enabled.length,
    disabled.length + getCanonicalMhtCetCollegePaths().length,
  );
  assert.equal(new Set(enabled.map((entry) => entry.url)).size, enabled.length);
  const core = new Set((await coreSitemap()).map((entry) => entry.url));
  assert.ok(enabled.every((entry) => !core.has(entry.url)));
  for (const path of getCanonicalMhtCetCollegePaths()) {
    assert.ok(
      enabled.some((entry) => entry.url === PRODUCTION_SITE_URL + path),
    );
  }
});
