import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStateCutoffSearchUsageEvent,
  scheduleStateCutoffSearchUsage,
} from "./search-usage";

test("builds an aggregate event without recording search details", () => {
  const event = buildStateCutoffSearchUsageEvent({
    requestId: "request-1",
    status: "served",
    durationMs: 12.6,
  });

  assert.equal(event.eventName, "state_cutoff_search");
  assert.equal(event.platform, "web");
  assert.equal(event.durationMs, 13);
  assert.equal(event.scoreMode, undefined);
  assert.equal(event.scoreValue, undefined);
  assert.equal(event.percentile, undefined);
  assert.equal(event.year, undefined);
  assert.equal(event.round, undefined);
  assert.equal(event.resultCount, undefined);
  assert.equal(event.errorCode, undefined);
});

test("normalizes invalid duration without throwing", () => {
  const event = buildStateCutoffSearchUsageEvent({
    requestId: "request-2",
    status: "failed",
    durationMs: -20,
  });

  assert.equal(event.durationMs, 0);
});

test("a rejected analytics write never rejects the search lifecycle", async () => {
  let scheduledTask: (() => Promise<void>) | undefined;
  const event = buildStateCutoffSearchUsageEvent({
    requestId: "request-3",
    status: "served",
    durationMs: 5,
  });

  scheduleStateCutoffSearchUsage(
    event,
    (task) => {
      scheduledTask = async () => {
        await task();
      };
    },
    async () => {
      throw new Error("stats database unavailable");
    },
  );

  assert.ok(scheduledTask);
  await assert.doesNotReject(async () => {
    await scheduledTask?.();
  });
});

test("a scheduler failure is contained", () => {
  const event = buildStateCutoffSearchUsageEvent({
    requestId: "request-4",
    status: "served",
    durationMs: 1,
  });

  assert.doesNotThrow(() =>
    scheduleStateCutoffSearchUsage(
      event,
      () => {
        throw new Error("request lifecycle already closed");
      },
      async () => {},
    ),
  );
});
