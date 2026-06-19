import assert from "node:assert/strict";
import test from "node:test";

import {
  ANONYMOUS_STATE_CUTOFF_ACTION_LIMIT,
  ANONYMOUS_STATE_CUTOFF_STORAGE_KEY,
  type AnonymousUsageStorage,
  getAnonymousStateCutoffActionCount,
  recordAnonymousStateCutoffAction,
} from "./anonymous-usage";

function createStorage(initialValue?: string): AnonymousUsageStorage {
  const values = new Map<string, string>();
  if (initialValue !== undefined) {
    values.set(ANONYMOUS_STATE_CUTOFF_STORAGE_KEY, initialValue);
  }

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

test("recordAnonymousStateCutoffAction allows the first ten anonymous actions", () => {
  const storage = createStorage();

  for (let index = 1; index <= ANONYMOUS_STATE_CUTOFF_ACTION_LIMIT; index++) {
    const result = recordAnonymousStateCutoffAction({
      isAuthenticated: false,
      storage,
    });

    assert.equal(result.allowed, true);
    assert.equal(result.count, index);
  }
});

test("recordAnonymousStateCutoffAction blocks action eleven", () => {
  const storage = createStorage(String(ANONYMOUS_STATE_CUTOFF_ACTION_LIMIT));
  const result = recordAnonymousStateCutoffAction({
    isAuthenticated: false,
    storage,
  });

  assert.equal(result.allowed, false);
  assert.equal(result.count, ANONYMOUS_STATE_CUTOFF_ACTION_LIMIT);
  assert.equal(result.remaining, 0);
});

test("anonymous count parsing handles malformed stored counts", () => {
  const storage = createStorage("not-a-number");

  assert.equal(getAnonymousStateCutoffActionCount(storage), 0);

  const result = recordAnonymousStateCutoffAction({
    isAuthenticated: false,
    storage,
  });

  assert.equal(result.allowed, true);
  assert.equal(result.count, 1);
});

test("authenticated users are allowed without incrementing anonymous usage", () => {
  const storage = createStorage("4");
  const result = recordAnonymousStateCutoffAction({
    isAuthenticated: true,
    storage,
  });

  assert.equal(result.allowed, true);
  assert.equal(result.authenticated, true);
  assert.equal(getAnonymousStateCutoffActionCount(storage), 4);
});
