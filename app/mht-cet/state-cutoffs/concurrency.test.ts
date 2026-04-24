import assert from "node:assert/strict";
import test from "node:test";

import { runWithConcurrencyLimit } from "./concurrency";

test("runWithConcurrencyLimit preserves task order while capping concurrency", async () => {
  let activeCount = 0;
  let maxActiveCount = 0;

  const tasks = [40, 10, 20, 5].map((delay, index) => async () => {
    activeCount += 1;
    maxActiveCount = Math.max(maxActiveCount, activeCount);

    await new Promise((resolve) => setTimeout(resolve, delay));

    activeCount -= 1;
    return index;
  });

  const result = await runWithConcurrencyLimit(tasks, 2);

  assert.deepEqual(result, [0, 1, 2, 3]);
  assert.equal(maxActiveCount, 2);
});

test("runWithConcurrencyLimit handles an empty task list", async () => {
  assert.deepEqual(await runWithConcurrencyLimit([], 3), []);
});
