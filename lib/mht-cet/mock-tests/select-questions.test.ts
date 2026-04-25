import assert from "node:assert/strict";
import test from "node:test";

import { normalizeMockConfig } from "./config";
import {
  selectQuestionsForMock,
  type MockQuestionPoolItem,
} from "./select-questions";

const pool: MockQuestionPoolItem[] = [
  {
    id: "m1",
    subject: "mathematics",
    chapterSlug: "functions",
    year: 2025,
    marks: 2,
    verificationStatus: "approved",
  },
  {
    id: "m2",
    subject: "mathematics",
    chapterSlug: "circle",
    year: 2025,
    marks: 2,
    verificationStatus: "approved",
  },
  {
    id: "p1",
    subject: "physics",
    chapterSlug: "motion-in-a-plane",
    year: 2025,
    marks: 1,
    verificationStatus: "approved",
  },
  {
    id: "p2",
    subject: "physics",
    chapterSlug: "laws-of-motion",
    year: 2025,
    marks: 1,
    verificationStatus: "approved",
  },
  {
    id: "c1",
    subject: "chemistry",
    chapterSlug: "structure-of-atom",
    year: 2025,
    marks: 1,
    verificationStatus: "approved",
  },
  {
    id: "c2",
    subject: "chemistry",
    chapterSlug: "chemical-bonding",
    year: 2024,
    marks: 1,
    verificationStatus: "approved",
  },
  {
    id: "draft",
    subject: "chemistry",
    chapterSlug: "chemical-bonding",
    year: 2025,
    marks: 1,
    verificationStatus: "draft",
  },
];

test("selection is deterministic by seed", () => {
  const config = normalizeMockConfig({
    mode: "custom",
    subjects: ["mathematics", "physics"],
    questionCount: 4,
  });

  const first = selectQuestionsForMock({ pool, config, seed: "same-seed" });
  const second = selectQuestionsForMock({ pool, config, seed: "same-seed" });

  assert.equal(first.ok, true);
  assert.deepEqual(first, second);
});

test("selection reports insufficient approved questions", () => {
  const config = normalizeMockConfig({
    mode: "custom",
    subjects: ["chemistry"],
    year: 2025,
    questionCount: 2,
  });

  const result = selectQuestionsForMock({ pool, config, seed: "low-pool" });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "insufficient_questions");
  assert.equal(result.available, 1);
  assert.equal(result.required, 2);
});

test("selection balances subjects for multi-subject custom mocks", () => {
  const config = normalizeMockConfig({
    mode: "custom",
    subjects: ["mathematics", "physics"],
    questionCount: 4,
  });

  const result = selectQuestionsForMock({ pool, config, seed: "balance" });

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.questions.map((question) => question.subject).sort(),
    ["mathematics", "mathematics", "physics", "physics"],
  );
});

test("selection keeps stable positions and does not mutate input", () => {
  const originalIds = pool.map((question) => question.id);
  const config = normalizeMockConfig({
    mode: "custom",
    subjects: ["mathematics"],
    questionCount: 2,
  });

  const result = selectQuestionsForMock({ pool, config, seed: "positions" });

  assert.equal(result.ok, true);
  assert.deepEqual(
    pool.map((question) => question.id),
    originalIds,
  );
  assert.deepEqual(
    result.questions.map((question) => question.position),
    [1, 2],
  );
});
