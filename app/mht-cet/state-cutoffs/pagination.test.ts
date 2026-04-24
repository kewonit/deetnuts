import assert from "node:assert/strict";
import test from "node:test";

import { getClampedPage } from "./pagination";

test("getClampedPage keeps already valid pages", () => {
  assert.equal(getClampedPage(3, 25, 80), 3);
});

test("getClampedPage snaps oversized pages back to the last available page", () => {
  assert.equal(getClampedPage(2, 50, 40), 1);
});

test("getClampedPage falls back to page one for empty result sets", () => {
  assert.equal(getClampedPage(2, 50, 0), 1);
});
