import { createHash } from "node:crypto";

import type { QuestionImportRow } from "./content-schema";

type JsonLike =
  | null
  | boolean
  | number
  | string
  | JsonLike[]
  | { [key: string]: JsonLike };

function normalizeForHash(value: unknown): JsonLike | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeForHash(item) ?? null);
  }

  if (typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, JsonLike>>((normalized, key) => {
        const item = normalizeForHash((value as Record<string, unknown>)[key]);

        if (item !== undefined) {
          normalized[key] = item;
        }

        return normalized;
      }, {});
  }

  return String(value);
}

export function hashQuestionImportRow(row: QuestionImportRow) {
  const normalized = normalizeForHash({
    body: row.body,
    correctOptionIds: row.correctOptionIds,
    examGroup: row.examGroup,
    options: row.options,
    source: row.source,
    subject: row.subject,
    year: row.year,
  });

  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}
