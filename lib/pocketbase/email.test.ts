import assert from "node:assert/strict";
import test from "node:test";
import {
  isPocketBaseCompatibleEmail,
  toPocketBaseAuthEmail,
} from "./email";

test("keeps normalized public email addresses unchanged", () => {
  assert.equal(toPocketBaseAuthEmail(" User+tag@Example.COM "), "user+tag@example.com");
  assert.equal(isPocketBaseCompatibleEmail("user+tag@example.com"), true);
});

test("maps a legacy single-label domain to a deterministic non-deliverable alias", () => {
  const alias = toPocketBaseAuthEmail("legacy-user@internal");

  assert.match(alias, /^[0-9a-f]{40}@legacy\.invalid\.deetnuts\.com$/);
  assert.equal(alias, toPocketBaseAuthEmail(" LEGACY-USER@INTERNAL "));
  assert.equal(isPocketBaseCompatibleEmail(alias), true);
});

test("does not collapse distinct legacy addresses", () => {
  assert.notEqual(
    toPocketBaseAuthEmail("first@internal"),
    toPocketBaseAuthEmail("second@internal"),
  );
});

test("maps a legacy numeric top-level domain", () => {
  assert.match(
    toPocketBaseAuthEmail("legacy-user@example.1"),
    /^[0-9a-f]{40}@legacy\.invalid\.deetnuts\.com$/,
  );
});
