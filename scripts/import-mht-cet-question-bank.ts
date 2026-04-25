import { readFileSync } from "node:fs";

import { validateQuestionImportRows } from "../lib/mht-cet/questions/validate-question-import";

const filePath = process.argv[2];

if (!filePath) {
  console.error(
    "Usage: npx tsx scripts/import-mht-cet-question-bank.ts <question-bank.json>",
  );
  process.exit(1);
}

const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
const rows = Array.isArray(parsed)
  ? parsed
  : parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { questions?: unknown }).questions)
    ? (parsed as { questions: unknown[] }).questions
    : null;

if (!rows) {
  console.error(
    "Question bank JSON must be an array or an object with a questions array.",
  );
  process.exit(1);
}

const result = validateQuestionImportRows(rows, { mode: "production" });
const errorCount = result.errors.filter(
  (error) => error.severity === "error",
).length;

if (errorCount > 0) {
  console.error(`Import blocked: ${errorCount} validation errors found.`);
  for (const issue of result.errors) {
    console.error(
      `${issue.severity.toUpperCase()} row ${issue.rowNumber} ${issue.fieldName}: ${issue.message}`,
    );
  }
  process.exit(1);
}

console.log(`Validated ${result.validRows.length} production-ready rows.`);
console.log(
  "Supabase insertion is handled by the admin import API route in the application.",
);
