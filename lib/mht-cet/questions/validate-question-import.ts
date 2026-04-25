import {
  QuestionImportRowSchema,
  type QuestionImportRow,
} from "./content-schema";
import { hashQuestionImportRow } from "./hash-question";

export type QuestionImportValidationMode =
  | "development"
  | "test"
  | "production";

export type QuestionImportValidationError = {
  rowNumber: number;
  fieldName: string;
  severity: "warning" | "error";
  message: string;
};

export type ValidatedQuestionImportRow = QuestionImportRow & {
  bodySha256: string;
};

export type QuestionImportValidationResult = {
  validRows: ValidatedQuestionImportRow[];
  errors: QuestionImportValidationError[];
};

type ValidateQuestionImportRowsOptions = {
  mode?: QuestionImportValidationMode;
};

const UNSAFE_TEXT_PATTERN = /<script|<iframe|onerror\s*=/i;

function hasUnsafeText(value: unknown): boolean {
  if (typeof value === "string") {
    return UNSAFE_TEXT_PATTERN.test(value);
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasUnsafeText(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((item) => hasUnsafeText(item));
  }

  return false;
}

function pathToFieldName(path: Array<string | number>) {
  return path.length > 0 ? path.join(".") : "row";
}

function pushIssue(
  errors: QuestionImportValidationError[],
  rowNumber: number,
  fieldName: string,
  severity: "warning" | "error",
  message: string,
) {
  errors.push({ rowNumber, fieldName, severity, message });
}

export function validateQuestionImportRows(
  rows: readonly unknown[],
  options: ValidateQuestionImportRowsOptions = {},
): QuestionImportValidationResult {
  const mode = options.mode ?? "development";
  const validRows: ValidatedQuestionImportRow[] = [];
  const errors: QuestionImportValidationError[] = [];

  rows.forEach((rawRow, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const parsed = QuestionImportRowSchema.safeParse(rawRow);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        pushIssue(
          errors,
          rowNumber,
          pathToFieldName(issue.path),
          "error",
          issue.message,
        );
      }

      return;
    }

    const row = parsed.data;
    const rowErrorsBeforeCustomValidation = errors.length;
    const sourceTitle = row.source.title.trim();
    const licenseNote = row.source.licenseNote.trim();
    const optionIds = row.options.map((option) => option.id.trim());
    const uniqueOptionIds = new Set(optionIds);

    if (!sourceTitle) {
      pushIssue(
        errors,
        rowNumber,
        "source.title",
        "error",
        "Source title is required.",
      );
    }

    if (!licenseNote) {
      pushIssue(
        errors,
        rowNumber,
        "source.licenseNote",
        "error",
        "Source license note is required.",
      );
    }

    if (!row.source.fileSha256 && !row.source.sourceUrl) {
      pushIssue(
        errors,
        rowNumber,
        "source",
        "error",
        "Provide either a source URL or source file SHA-256.",
      );
    }

    if (row.source.sourceType === "test_fixture" && mode === "production") {
      pushIssue(
        errors,
        rowNumber,
        "source.sourceType",
        "error",
        "Test fixture rows cannot be imported in production.",
      );
    }

    if (
      row.questionType === "single_correct" &&
      row.correctOptionIds.length !== 1
    ) {
      pushIssue(
        errors,
        rowNumber,
        "correctOptionIds",
        "error",
        "Single-correct questions must have exactly one correct option ID.",
      );
    }

    if (uniqueOptionIds.size !== optionIds.length) {
      pushIssue(
        errors,
        rowNumber,
        "options",
        "error",
        "Option IDs must be unique.",
      );
    }

    for (const correctOptionId of row.correctOptionIds) {
      if (!uniqueOptionIds.has(correctOptionId)) {
        pushIssue(
          errors,
          rowNumber,
          "correctOptionIds",
          "error",
          `Correct option ID '${correctOptionId}' does not exist in options.`,
        );
      }
    }

    if (hasUnsafeText(row.body)) {
      pushIssue(
        errors,
        rowNumber,
        "body",
        "error",
        "Question body contains unsafe HTML-like text.",
      );
    }

    if (hasUnsafeText(row.options)) {
      pushIssue(
        errors,
        rowNumber,
        "options",
        "error",
        "Options contain unsafe HTML-like text.",
      );
    }

    if (hasUnsafeText(row.explanation)) {
      pushIssue(
        errors,
        rowNumber,
        "explanation",
        "error",
        "Explanation contains unsafe HTML-like text.",
      );
    }

    if (!row.explanation || row.explanation.length === 0) {
      pushIssue(
        errors,
        rowNumber,
        "explanation",
        "warning",
        "Explanation is missing.",
      );
    }

    if (!row.chapterSlug?.trim()) {
      pushIssue(
        errors,
        rowNumber,
        "chapterSlug",
        "warning",
        "Chapter slug is missing.",
      );
    }

    const customErrorsForRow = errors
      .slice(rowErrorsBeforeCustomValidation)
      .some((issue) => issue.severity === "error");

    if (!customErrorsForRow) {
      validRows.push({
        ...row,
        bodySha256: hashQuestionImportRow(row),
      });
    }
  });

  return { validRows, errors };
}
