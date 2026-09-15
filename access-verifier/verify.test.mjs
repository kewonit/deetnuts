import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";
import { AccessTokenVerifier, validateConfig } from "./verify.mjs";

const NOW_MS = Date.UTC(2026, 8, 16, 12, 0, 0);
const NOW_SECONDS = Math.floor(NOW_MS / 1000);
const AUDIENCE = "a".repeat(64);
const ISSUER = "https://deetnuts.cloudflareaccess.com";
const ALLOWED_EMAIL = "admin.owner@example.com";
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const jwk = publicKey.export({ format: "jwk" });
Object.assign(jwk, { alg: "RS256", kid: "test-key", use: "sig" });

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function token(overrides = {}, headerOverrides = {}) {
  const header = encode({
    alg: "RS256",
    kid: "test-key",
    typ: "JWT",
    ...headerOverrides,
  });
  const claims = encode({
    aud: [AUDIENCE],
    email: ALLOWED_EMAIL,
    exp: NOW_SECONDS + 3600,
    iat: NOW_SECONDS,
    iss: ISSUER,
    sub: "identity-id",
    type: "app",
    ...overrides,
  });
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(`${header}.${claims}`),
    privateKey,
  ).toString("base64url");
  return `${header}.${claims}.${signature}`;
}

function createVerifier() {
  let requests = 0;
  const verifier = new AccessTokenVerifier(
    {
      allowedEmail: ALLOWED_EMAIL,
      audience: AUDIENCE,
      issuer: ISSUER,
      jwksUrl: `${ISSUER}/cdn-cgi/access/certs`,
    },
    {
      now: () => NOW_MS,
      fetch: async () => {
        requests += 1;
        return new Response(JSON.stringify({ keys: [jwk] }), {
          headers: {
            "cache-control": "max-age=600",
            "content-type": "application/json",
          },
        });
      },
    },
  );
  return {
    get requests() {
      return requests;
    },
    verifier,
  };
}

test("requires a valid team, non-placeholder audience, and email", () => {
  assert.deepEqual(
    validateConfig({
      CF_ACCESS_TEAM_DOMAIN: "deetnuts.cloudflareaccess.com",
      CF_ACCESS_AUD: AUDIENCE,
      CF_ACCESS_ALLOWED_EMAIL: ALLOWED_EMAIL,
    }),
    {
      allowedEmail: ALLOWED_EMAIL,
      audience: AUDIENCE,
      issuer: ISSUER,
      jwksUrl: `${ISSUER}/cdn-cgi/access/certs`,
    },
  );
  assert.throws(() =>
    validateConfig({
      CF_ACCESS_TEAM_DOMAIN: "deetnuts.cloudflareaccess.com",
      CF_ACCESS_AUD: AUDIENCE,
      CF_ACCESS_ALLOWED_EMAIL:
        "replace-with-allowed-google-email@example.invalid",
    }),
  );
});

test("accepts a valid Cloudflare Access application token and caches keys", async () => {
  const subject = createVerifier();
  const claims = await subject.verifier.verify(token());
  assert.equal(claims.email, ALLOWED_EMAIL);
  await subject.verifier.verify(token());
  assert.equal(subject.requests, 1);
});

for (const [name, overrides] of [
  ["wrong email", { email: "attacker@example.com" }],
  ["wrong audience", { aud: ["b".repeat(64)] }],
  ["wrong issuer", { iss: "https://example.cloudflareaccess.com" }],
  ["expired token", { exp: NOW_SECONDS - 31 }],
  ["future token", { iat: NOW_SECONDS + 31 }],
  ["wrong token type", { type: "org" }],
]) {
  test(`rejects ${name}`, async () => {
    await assert.rejects(createVerifier().verifier.verify(token(overrides)));
  });
}

test("rejects a modified signature", async () => {
  const parts = token().split(".");
  parts[2] = `${parts[2][0] === "A" ? "B" : "A"}${parts[2].slice(1)}`;
  await assert.rejects(createVerifier().verifier.verify(parts.join(".")));
});
