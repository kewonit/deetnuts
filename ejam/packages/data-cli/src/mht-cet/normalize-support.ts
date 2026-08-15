import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";
import { MhtCetStageSemanticsId } from "@ejam/data/mht-cet";
import { z } from "zod";
import { canonicalSourceRow } from "./source-spec.js";

export const OfficialCutoff = z.object({
  schema_version: z.literal(2),
  year: z.number().int().min(2024).max(2100),
  round: z.number().int().min(1).max(4),
  institute_code: z.string().regex(/^\d{5}$/),
  institute_name: z.string().min(1),
  choice_code: z.string().regex(/^\d{10}[A-Z]{0,2}$/),
  program_name: z.string().min(1),
  source_category_code: z.string().min(1),
  source_allocation_section: z.enum([
    "HOME_TO_HOME",
    "HOME_TO_OTHER",
    "OTHER_TO_OTHER",
    "OTHER_TO_HOME",
    "STATE_LEVEL",
    "MAHARASHTRA_STATE",
  ]),
  source_stage_label: z.string().min(1),
  source_stage_sequence: z.number().int().positive(),
  stage_semantics_id: MhtCetStageSemanticsId,
  closing_rank: z.number().int().min(0),
  closing_percentile: z.number().min(0).max(100),
  source_id: z.string().min(1),
  source_locator: z.string().min(1),
});
export type OfficialCutoffRow = z.infer<typeof OfficialCutoff>;

export const OfficialProgram = z.object({
  schema_version: z.literal(1),
  year: z.number().int().min(2024).max(2100),
  institute_code: z.string().regex(/^\d{5}$/),
  choice_code: z.string().regex(/^\d{10}[A-Z]{0,2}$/),
  offering_id: z.string().regex(/^[a-z0-9-]+$/),
  program_id: z.string().regex(/^[a-z0-9-]+$/),
  program_name: z.string().min(1),
  home_university_id: z.string().regex(/^[a-z0-9-]+$/),
  affiliating_university_id: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  minority_community_id: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .nullable(),
  source_id: z.string().min(1),
  source_locator: z.string().min(1),
});
export type OfficialProgram = z.infer<typeof OfficialProgram>;

export type RawCutoff = Record<string, unknown>;

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function stableSourceRowId(row: RawCutoff): string {
  return createHash("sha256")
    .update(canonicalSourceRow(row))
    .digest("hex")
    .slice(0, 24);
}

export function stableOfficialRowId(row: OfficialCutoffRow): string {
  return createHash("sha256")
    .update(
      [
        cutoffStageKey(row),
        row.closing_rank,
        row.closing_percentile,
        row.source_id,
        row.source_locator,
      ].join(":"),
    )
    .digest("hex")
    .slice(0, 24);
}

export function sourceSeatScope(
  section: OfficialCutoffRow["source_allocation_section"],
):
  | "home-university"
  | "other-university"
  | "state-level"
  | "maharashtra-state" {
  switch (section) {
    case "HOME_TO_HOME":
    case "HOME_TO_OTHER":
      return "home-university";
    case "OTHER_TO_HOME":
    case "OTHER_TO_OTHER":
      return "other-university";
    case "STATE_LEVEL":
      return "state-level";
    case "MAHARASHTRA_STATE":
      return "maharashtra-state";
  }
}

export function effectiveAllocationScope(
  section: OfficialCutoffRow["source_allocation_section"],
):
  | "home-university"
  | "other-university"
  | "state-level"
  | "maharashtra-state" {
  switch (section) {
    case "HOME_TO_HOME":
    case "OTHER_TO_HOME":
      return "home-university";
    case "HOME_TO_OTHER":
    case "OTHER_TO_OTHER":
      return "other-university";
    case "STATE_LEVEL":
      return "state-level";
    case "MAHARASHTRA_STATE":
      return "maharashtra-state";
  }
}

export function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

export function integer(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function decimal(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function cutoffKey(value: {
  year: number;
  round: number;
  institute_code: string;
  choice_code: string;
  source_category_code: string;
  source_allocation_section: string;
}): string {
  return [
    value.year,
    value.round,
    value.institute_code,
    value.choice_code,
    value.source_category_code,
    value.source_allocation_section,
  ].join(":");
}

export function cutoffStageKey(
  value: Parameters<typeof cutoffKey>[0] & {
    source_stage_label: string;
    source_stage_sequence: number;
    stage_semantics_id: string;
  },
): string {
  return [
    cutoffKey(value),
    value.source_stage_label,
    value.source_stage_sequence,
    value.stage_semantics_id,
  ].join(":");
}

export function twoDecimalAgreement(
  stagedValue: number,
  officialValue: number,
): boolean {
  return (
    Math.round((stagedValue + Number.EPSILON) * 100) ===
    Math.round((officialValue + Number.EPSILON) * 100)
  );
}

export async function readJsonLines<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T[]> {
  const content = await readFile(path, "utf-8");
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      const parsed = schema.safeParse(JSON.parse(line));
      if (!parsed.success) {
        throw new Error(
          `${path}: line ${index + 1} failed validation: ${parsed.error.message}`,
        );
      }
      return parsed.data;
    });
}

export async function readJsonArray<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T[]> {
  const raw: unknown = JSON.parse(await readFile(path, "utf-8"));
  if (!Array.isArray(raw)) throw new Error(`${path}: expected JSON array`);
  return raw.map((entry, index) => {
    const parsed = schema.safeParse(entry);
    if (!parsed.success) {
      throw new Error(
        `${path}: item ${index} failed validation: ${parsed.error.message}`,
      );
    }
    return parsed.data;
  });
}

export async function parquetFromJsonLines(
  jsonLinesPath: string,
  outputPath: string,
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  const instance = await DuckDBInstance.create();
  const connection = await instance.connect();
  try {
    await connection.run(
      `COPY (
        SELECT * FROM read_json_auto(
          ${sqlLiteral(jsonLinesPath)},
          format = 'newline_delimited',
          maximum_object_size = 104857600
        )
        ORDER BY institute_code, choice_code, seat_pool_id, source_allocation_section,
          source_stage_sequence, source_stage_label
      ) TO ${sqlLiteral(outputPath)} (FORMAT PARQUET, COMPRESSION ZSTD)`,
    );
  } finally {
    connection.closeSync();
    instance.closeSync();
  }
}
