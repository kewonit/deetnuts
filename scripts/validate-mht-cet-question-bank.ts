import { readFileSync } from "node:fs";

import {
  validateQuestionImportRows,
  type QuestionImportValidationMode,
} from "../lib/mht-cet/questions/validate-question-import";

function loadRows(filePath: string) {
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { questions?: unknown }).questions)
  ) {
    return (parsed as { questions: unknown[] }).questions;
  }

  throw new Error(
    "Question bank JSON must be an array or an object with a questions array.",
  );
}

const filePath = process.argv[2];
const mode: QuestionImportValidationMode = process.argv.includes("--production")
  ? "production"
  : "development";

if (!filePath) {
  console.error(
    "Usage: npx tsx scripts/validate-mht-cet-question-bank.ts <question-bank.json> [--production]",
  );
  process.exit(1);
}

const rows = loadRows(filePath);
const result = validateQuestionImportRows(rows, { mode });
const errorCount = result.errors.filter(
  (error) => error.severity === "error",
).length;
const warningCount = result.errors.filter(
  (error) => error.severity === "warning",
).length;

console.log(`Validated ${rows.length} rows in ${mode} mode.`);
console.log(`Accepted rows: ${result.validRows.length}`);
console.log(`Errors: ${errorCount}`);
console.log(`Warnings: ${warningCount}`);

for (const issue of result.errors) {
  console.log(
    `${issue.severity.toUpperCase()} row ${issue.rowNumber} ${issue.fieldName}: ${issue.message}`,
  );
}

if (errorCount > 0) {
  process.exit(1);
}
