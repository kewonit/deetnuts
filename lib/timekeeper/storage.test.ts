import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  importTransfer,
  mergeCountdowns,
  readSavedCountdowns,
  readTransfer,
  saveSavedCountdowns,
  transferSchema,
  type SavedCountdown,
} from "./storage";

const timer: SavedCountdown = {
  id: "old-id",
  title: "My exam",
  description: "Revision",
  color: "pink",
  targetDate: "2030-03-12T09:30",
  createdAt: "2026-10-09T00:00:00Z",
};
let values: Map<string, string>;
let failStateWrite = false;
beforeEach(() => {
  values = new Map();
  failStateWrite = false;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (failStateWrite && key === "timekeeper-countdown-state")
          throw new Error("Quota exceeded");
        values.set(key, value);
      },
    },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: new EventTarget(),
  });
});

test("ID conflicts retain both timers and repeated imports remain idempotent after edits", () => {
  const legacy = JSON.stringify([{ ...timer, title: "Destination timer" }]);
  values.set("timekeeper-countdowns", legacy);
  const transfer = {
    version: 1,
    countdowns: [timer],
    theme: "ocean",
    avatarSeed: "my-avatar",
  };
  assert.equal(importTransfer(transfer), 1);
  const saved = readSavedCountdowns();
  assert.equal(saved.length, 2);
  assert.notEqual(saved[0].id, saved[1].id);
  assert.equal(importTransfer(transfer), 0);
  saveSavedCountdowns(
    saved.map((item) =>
      item.id === saved[1].id
        ? { ...item, title: "Edited imported timer" }
        : item,
    ),
  );
  assert.equal(importTransfer(transfer), 0);
  assert.equal(readSavedCountdowns().length, 2);
  assert.equal(values.get("timekeeper-countdowns"), legacy);
  assert.equal(values.get("timekeeper-theme"), "ocean");
  assert.equal(
    values.get("timekeeper_avatar_seed"),
    JSON.stringify("my-avatar"),
  );
});

test("failed atomic writes preserve the destination and can be retried", () => {
  saveSavedCountdowns([timer]);
  const original = values.get("timekeeper-countdown-state");
  const transfer = { version: 1, countdowns: [{ ...timer, id: "other-id" }] };
  failStateWrite = true;
  assert.throws(() => importTransfer(transfer));
  assert.equal(values.get("timekeeper-countdown-state"), original);
  failStateWrite = false;
  assert.equal(importTransfer(transfer), 1);
  assert.equal(importTransfer(transfer), 0);
});

test("exports whitelist countdowns, themes and both historical avatar formats", () => {
  values.set("timekeeper-countdowns", JSON.stringify([timer]));
  values.set("timekeeper-theme", "valentine");
  values.set("timekeeper-avatar-seed", "my-avatar");
  values.set("timekeeper-auth", "PRIVATE_TOKEN");
  values.set("timekeeper_location", "PRECISE_LOCATION");
  const exported = readTransfer();
  assert.equal(exported.avatarSeed, "my-avatar");
  assert.deepEqual(Object.keys(exported).sort(), [
    "avatarSeed",
    "countdowns",
    "theme",
    "version",
  ]);
  assert.ok(
    !JSON.stringify(exported).includes("PRIVATE_TOKEN") &&
      !JSON.stringify(exported).includes("PRECISE_LOCATION"),
  );
  values.set("timekeeper-theme", "dark");
  importTransfer({ ...exported, theme: "light" });
  assert.equal(values.get("timekeeper-theme"), "dark");
});

test("invalid source entries are retained in legacy storage and import validation rejects malformed data", () => {
  const raw = JSON.stringify([timer, { id: "unrecognized-original" }]);
  values.set("timekeeper-countdowns", raw);
  importTransfer({ version: 1, countdowns: [] });
  assert.equal(values.get("timekeeper-countdowns"), raw);
  assert.deepEqual(readSavedCountdowns(), [timer]);
  assert.equal(
    transferSchema.safeParse({
      version: 1,
      countdowns: [{ ...timer, targetDate: "invalid" }],
    }).success,
    false,
  );
  assert.equal(
    transferSchema.safeParse({
      version: 1,
      countdowns: [],
      avatarSeed: "<script>",
    }).success,
    false,
  );
  assert.deepEqual(mergeCountdowns([timer], [timer, timer]), [timer]);
});
