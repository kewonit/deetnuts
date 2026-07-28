import assert from "node:assert/strict";
import test from "node:test";

import { buildAuthCallbackUrl, sanitizeRedirectPath } from "./auth-redirect";

test("sanitizeRedirectPath preserves state cutoff URLs with params", () => {
  assert.equal(
    sanitizeRedirectPath(
      "/mht-cet/state-cutoffs?percentile=95&year=2025&round=1",
    ),
    "/mht-cet/state-cutoffs?percentile=95&year=2025&round=1",
  );
});

test("sanitizeRedirectPath preserves hashes", () => {
  assert.equal(
    sanitizeRedirectPath("/mht-cet/state-cutoffs?percentile=95#results"),
    "/mht-cet/state-cutoffs?percentile=95#results",
  );
});

test("sanitizeRedirectPath rejects external and protocol-relative URLs", () => {
  assert.equal(sanitizeRedirectPath("https://example.com/phish"), "/");
  assert.equal(sanitizeRedirectPath("//example.com/phish"), "/");
});

test("sanitizeRedirectPath rejects blank values and auth loops", () => {
  assert.equal(sanitizeRedirectPath(""), "/");
  assert.equal(sanitizeRedirectPath("/login"), "/");
  assert.equal(sanitizeRedirectPath("/signup?redirect=/account"), "/");
  assert.equal(
    sanitizeRedirectPath("/auth/callback?redirect=/account"),
    "/",
  );
  assert.equal(
    sanitizeRedirectPath("/mht-cet-login-required?redirect=/mht-cet"),
    "/",
  );
});

test("buildAuthCallbackUrl encodes nested redirect params", () => {
  assert.equal(
    buildAuthCallbackUrl(
      "/mht-cet/state-cutoffs?percentile=95&year=2025&round=1",
      "https://deetnuts.com",
    ),
    "https://deetnuts.com/auth/callback?redirect=%2Fmht-cet%2Fstate-cutoffs%3Fpercentile%3D95%26year%3D2025%26round%3D1",
  );
});
