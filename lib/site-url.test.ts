import assert from "node:assert/strict";
import test from "node:test";

import {
  getRequestOrigin,
  LOCAL_SITE_URL,
  PRODUCTION_SITE_URL,
  normalizeSiteUrl,
} from "./site-url";

test("site URL constants use the canonical production and local origins", () => {
  assert.equal(PRODUCTION_SITE_URL, "https://www.deetnuts.com");
  assert.equal(LOCAL_SITE_URL, "http://localhost:3000");
});

test("normalizeSiteUrl removes a trailing slash", () => {
  assert.equal(
    normalizeSiteUrl("https://www.deetnuts.com/", true),
    "https://www.deetnuts.com",
  );
});

test("normalizeSiteUrl rejects paths, credentials, and production HTTP", () => {
  assert.throws(
    () => normalizeSiteUrl("https://www.deetnuts.com/path", true),
    /only an origin/,
  );
  assert.throws(
    () => normalizeSiteUrl("https://user@example.com", true),
    /only an origin/,
  );
  assert.throws(
    () => normalizeSiteUrl("http://www.deetnuts.com", true),
    /HTTPS/,
  );
  assert.throws(
    () => normalizeSiteUrl("https://attacker.example", true),
    /must be https:\/\/www\.deetnuts\.com in production/,
  );
  assert.throws(() => normalizeSiteUrl("ftp://example.com"), /HTTP or HTTPS/);
});

test("request redirects ignore untrusted production origins", () => {
  assert.equal(
    getRequestOrigin("https://attacker.example/auth/callback", true, ""),
    PRODUCTION_SITE_URL,
  );
  assert.equal(
    getRequestOrigin(
      "https://attacker.example/auth/callback",
      true,
      PRODUCTION_SITE_URL,
    ),
    PRODUCTION_SITE_URL,
  );
  assert.equal(
    getRequestOrigin("http://127.0.0.1:3107/auth/callback", false, ""),
    "http://127.0.0.1:3107",
  );
});
