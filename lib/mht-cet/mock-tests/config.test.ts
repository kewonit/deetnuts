import assert from "node:assert/strict";
import test from "node:test";

import { normalizeMockConfig } from "./config";

test("full PCM default returns 150 questions and 10800 seconds", () => {
  const config = normalizeMockConfig({ mode: "full_pcm" });

  assert.equal(config.questionCount, 150);
  assert.equal(config.durationSeconds, 10_800);
  assert.deepEqual(config.subjects, ["mathematics", "physics", "chemistry"]);
});

test("mathematics default returns 50 questions and 5400 seconds", () => {
  const config = normalizeMockConfig({ mode: "mathematics" });

  assert.equal(config.questionCount, 50);
  assert.equal(config.durationSeconds, 5_400);
  assert.deepEqual(config.subjects, ["mathematics"]);
});

test("physics/chemistry default returns 100 questions and 5400 seconds", () => {
  const config = normalizeMockConfig({ mode: "physics_chemistry" });

  assert.equal(config.questionCount, 100);
  assert.equal(config.durationSeconds, 5_400);
  assert.deepEqual(config.subjects, ["physics", "chemistry"]);
});

test("custom duration clamps between 300 and 21600 seconds", () => {
  assert.equal(
    normalizeMockConfig({ mode: "custom", durationSeconds: 120 })
      .durationSeconds,
    300,
  );
  assert.equal(
    normalizeMockConfig({ mode: "custom", durationSeconds: 99_999 })
      .durationSeconds,
    21_600,
  );
});

test("empty chapter selection means all active chapters for selected subjects", () => {
  const config = normalizeMockConfig({
    mode: "custom",
    subjects: ["physics"],
    chapterSlugs: [],
  });

  assert.deepEqual(config.chapterSlugs, []);
  assert.equal(config.includeAllChapters, true);
});
