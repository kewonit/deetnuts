import assert from "node:assert/strict";
import { after, test } from "node:test";
import { openOAuthState, sealOAuthState } from "./auth";

const previousStateSecret = process.env.AUTH_STATE_SECRET;
process.env.AUTH_STATE_SECRET =
  "test-oauth-state-secret-with-at-least-32-bytes";

after(() => {
  if (previousStateSecret === undefined) {
    delete process.env.AUTH_STATE_SECRET;
  } else {
    process.env.AUTH_STATE_SECRET = previousStateSecret;
  }
});

function tamper(value: string): string {
  return `${value[0] === "A" ? "B" : "A"}${value.slice(1)}`;
}

test("OAuth state round-trips through authenticated encryption", () => {
  const state = "state-value-with-sufficient-entropy";
  const codeVerifier = "code-verifier-with-sufficient-entropy";
  const sealed = sealOAuthState(state, codeVerifier, "/account?tab=profile");
  const opened = openOAuthState(sealed);

  assert.equal(sealed.includes(state), false);
  assert.equal(sealed.includes(codeVerifier), false);
  assert.ok(opened);
  assert.equal(opened.provider, "google");
  assert.equal(opened.state, state);
  assert.equal(opened.codeVerifier, codeVerifier);
  assert.equal(opened.redirect, "/account?tab=profile");
  assert.equal(typeof opened.issuedAt, "number");
});

test("OAuth state rejects tampering and the wrong encryption secret", () => {
  const sealed = sealOAuthState(
    "state-value-with-sufficient-entropy",
    "code-verifier-with-sufficient-entropy",
    "/",
  );
  const parts = sealed.split(".");

  for (const index of [1, 2, 3]) {
    const tampered = [...parts];
    tampered[index] = tamper(tampered[index]);
    assert.equal(openOAuthState(tampered.join(".")), null);
  }

  process.env.AUTH_STATE_SECRET = "different-oauth-state-secret-with-32-bytes";
  assert.equal(openOAuthState(sealed), null);
  process.env.AUTH_STATE_SECRET =
    "test-oauth-state-secret-with-at-least-32-bytes";
});

test("OAuth state rejects legacy and oversized cookie formats", () => {
  assert.equal(openOAuthState("payload.signature"), null);
  assert.equal(openOAuthState(`v1.${"A".repeat(4097)}.ciphertext.tag`), null);
});
