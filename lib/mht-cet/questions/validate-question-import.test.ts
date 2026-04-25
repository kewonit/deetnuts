import assert from "node:assert/strict";
import test from "node:test";

import practiceRows from "../../../data/mht-cet/question-bank/practice-2026-original.json";
import type { QuestionImportRow } from "./content-schema";
import { validateQuestionImportRows } from "./validate-question-import";

const validRow: QuestionImportRow = {
  source: {
    title: "Local fixture batch",
    sourceType: "licensed_provider",
    licenseNote: "Operator supplied licensed sample for validation tests.",
    fileSha256:
      "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    year: 2025,
    examGroup: "pcm",
  },
  subject: "mathematics",
  chapterSlug: "functions",
  year: 2025,
  examGroup: "pcm",
  marks: 2,
  negativeMarks: 0,
  questionType: "single_correct",
  body: [{ type: "paragraph", text: "What is f(2) when f(x) = x + 3?" }],
  options: [
    { id: "a", body: [{ type: "paragraph", text: "4" }] },
    { id: "b", body: [{ type: "paragraph", text: "5" }] },
    { id: "c", body: [{ type: "paragraph", text: "6" }] },
    { id: "d", body: [{ type: "paragraph", text: "7" }] },
  ],
  correctOptionIds: ["b"],
  explanation: [{ type: "paragraph", text: "Substitute x = 2." }],
};

function cloneValidRow(overrides: Partial<QuestionImportRow> = {}) {
  return {
    ...structuredClone(validRow),
    ...overrides,
  } satisfies QuestionImportRow;
}

test("valid single-correct question passes", () => {
  const result = validateQuestionImportRows([validRow], { mode: "production" });

  assert.equal(
    result.errors.filter((error) => error.severity === "error").length,
    0,
  );
  assert.equal(result.validRows.length, 1);
  assert.equal(result.validRows[0]?.bodySha256.length, 64);
});

test("missing source metadata fails", () => {
  const row = cloneValidRow({
    source: {
      ...validRow.source,
      title: "",
      licenseNote: "",
      fileSha256: undefined,
      sourceUrl: undefined,
    },
  });

  const result = validateQuestionImportRows([row], { mode: "production" });

  assert.ok(result.errors.some((error) => error.fieldName === "source.title"));
  assert.ok(
    result.errors.some((error) => error.fieldName === "source.licenseNote"),
  );
  assert.ok(result.errors.some((error) => error.fieldName === "source"));
  assert.equal(result.validRows.length, 0);
});

test("correct option ID not present in options fails", () => {
  const result = validateQuestionImportRows(
    [cloneValidRow({ correctOptionIds: ["missing"] })],
    { mode: "production" },
  );

  assert.ok(
    result.errors.some((error) => error.fieldName === "correctOptionIds"),
  );
  assert.equal(result.validRows.length, 0);
});

test("raw HTML-like content fails", () => {
  const result = validateQuestionImportRows(
    [
      cloneValidRow({
        body: [{ type: "paragraph", text: "<script>alert('x')</script>" }],
      }),
    ],
    { mode: "production" },
  );

  assert.ok(result.errors.some((error) => error.fieldName === "body"));
  assert.equal(result.validRows.length, 0);
});

test("duplicate option IDs fail", () => {
  const row = cloneValidRow({
    options: [
      { id: "same", body: [{ type: "paragraph", text: "4" }] },
      { id: "same", body: [{ type: "paragraph", text: "5" }] },
    ],
    correctOptionIds: ["same"],
  });

  const result = validateQuestionImportRows([row], { mode: "production" });

  assert.ok(result.errors.some((error) => error.fieldName === "options"));
  assert.equal(result.validRows.length, 0);
});

test("approved test fixtures cannot be imported in production", () => {
  const row = cloneValidRow({
    source: {
      ...validRow.source,
      sourceType: "test_fixture",
      licenseNote:
        "Local test fixture for renderer and scoring development; not official MHT-CET content.",
    },
    verificationStatus: "approved",
  });

  const result = validateQuestionImportRows([row], { mode: "production" });

  assert.ok(
    result.errors.some((error) => error.fieldName === "source.sourceType"),
  );
  assert.equal(result.validRows.length, 0);
});

test("original practice bank validates for production import", () => {
  const result = validateQuestionImportRows(practiceRows, {
    mode: "production",
  });

  assert.equal(
    result.errors.filter((error) => error.severity === "error").length,
    0,
  );
  assert.equal(result.validRows.length, practiceRows.length);
  assert.equal(practiceRows.length, 30);
});
