import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../../proxy";
import { getCanonicalMhtCetCollegePath } from "./proxy-canonical";

const canonical = getCanonicalMhtCetCollegePath("1002")!;

test("invalid detail query state returns a real uncached 404 before rendering", async (t) => {
  const previous = process.env.ADMISSIONS_V2_MHT_CET;
  process.env.ADMISSIONS_V2_MHT_CET = "true";
  t.after(() => {
    if (previous === undefined) delete process.env.ADMISSIONS_V2_MHT_CET;
    else process.env.ADMISSIONS_V2_MHT_CET = previous;
  });
  for (const query of [
    "?year=2023",
    "?year=2026&round=2",
    "?year=2024&round=4",
    "?round=0",
    "?year=",
    "?year=2024&year=2026",
    "?round=1&round=2",
  ]) {
    const response = await proxy(
      new NextRequest("https://www.deetnuts.com" + canonical + query),
    );
    assert.equal(response.status, 404, query);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/);
    assert.doesNotMatch(await response.text(), /rel="canonical"/);
  }
  assert.equal(
    (
      await proxy(
        new NextRequest(
          "https://www.deetnuts.com" + canonical + "?year=2024&round=3",
        ),
      )
    ).status,
    200,
  );
});

test("college aliases keep the canonical destination and historical selection", async () => {
  const response = await proxy(
    new NextRequest(
      "https://www.deetnuts.com/mht-cet/colleges/old-name-1002?year=2024&round=2",
    ),
  );
  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("location"),
    "https://www.deetnuts.com" + canonical + "?year=2024&round=2",
  );
});

test("disabled detail pages redirect temporarily while unknown entities still return 404", async (t) => {
  const previous = process.env.ADMISSIONS_V2_MHT_CET;
  process.env.ADMISSIONS_V2_MHT_CET = "false";
  t.after(() => {
    if (previous === undefined) delete process.env.ADMISSIONS_V2_MHT_CET;
    else process.env.ADMISSIONS_V2_MHT_CET = previous;
  });
  const response = await proxy(
    new NextRequest("https://www.deetnuts.com" + canonical),
  );
  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get("location"),
    "https://www.deetnuts.com/mht-cet/colleges",
  );
  assert.equal(
    (
      await proxy(
        new NextRequest(
          "https://www.deetnuts.com/mht-cet/colleges/unknown-99999",
        ),
      )
    ).status,
    404,
  );
});
