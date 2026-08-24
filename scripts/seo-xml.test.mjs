import assert from "node:assert/strict";
import test from "node:test";
import { decodeXml, extractLocations } from "./seo-xml.mjs";

test("decodeXml decodes exactly one entity layer", () => {
  assert.equal(decodeXml("&amp;lt;&lt;&gt;&quot;&apos;&amp;"), "&lt;<>\"'&");
});

test("extractLocations decodes sitemap URL separators once", () => {
  assert.deepEqual(
    extractLocations(
      "<urlset><url><loc>https://www.deetnuts.com/path?a=1&amp;b=&amp;lt;</loc></url></urlset>",
    ),
    ["https://www.deetnuts.com/path?a=1&b=&lt;"],
  );
});
