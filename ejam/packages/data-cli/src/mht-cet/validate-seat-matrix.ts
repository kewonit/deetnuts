#!/usr/bin/env tsx

import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { DATA_DIR } from "../repo-root.js";
import { canonicalRowsSha256, canonicalSourceRow } from "./source-spec.js";

const AllocationCount = z.object({
  general: z.number().int().min(0),
  ladies: z.number().int().min(0),
});

const OfficialSeatMatrixRow = z.object({
  schema_version: z.literal(1),
  year: z.number().int().min(2024).max(2025),
  institute_code: z.string().regex(/^\d{5}$/),
  choice_code: z.string().regex(/^\d{10}[A-Z]{0,2}$/),
  allocation_scope: z.enum([
    "HOME_UNIVERSITY",
    "OTHER_HOME_UNIVERSITY",
    "STATE_LEVEL",
  ]),
  category_seats: z.record(z.string(), AllocationCount),
  scope_total: z.number().int().min(0),
  sanctioned_intake: z.number().int().min(0),
  maharashtra_state_seats: z.number().int().min(0),
  minority_seats: z.number().int().min(0),
  all_india_seats: z.number().int().min(0),
  institute_seats: z.number().int().min(0),
  orphan_seats: z.number().int().min(0),
  cap_seats: z.number().int().min(0),
  pwd_total: z.number().int().min(0),
  pwd_common_reserved: z.number().int().min(0),
  defence_total: z.number().int().min(0),
  defence_common_reserved: z.number().int().min(0),
  ews_seats: z.number().int().min(0),
  tfws_choice_code: z
    .string()
    .regex(/^\d{10}[A-Z]{0,2}$/)
    .nullable(),
  tfws_seats: z.number().int().min(0),
});
type OfficialSeatMatrixRow = z.infer<typeof OfficialSeatMatrixRow>;

const CATEGORY_FIELDS = {
  OPEN: ["OPEN_General", "OPEN_Ladies"],
  SC: ["SC_General", "SC_Ladies"],
  ST: ["ST_General", "ST_Ladies"],
  "VJ/DT": ["VJ_DT_General", "VJ_DT_Ladies"],
  NTB: ["NTB_General", "NTB_Ladies"],
  NTC: ["NTC_General", "NTC_Ladies"],
  NTD: ["NTD_General", "NTD_Ladies"],
  OBC: ["OBC_General", "OBC_Ladies"],
  SEBC: ["SEBC_General", "SEBC_Ladies"],
} as const;

const SCOPE_FIELDS = {
  HU: "HOME_UNIVERSITY",
  OHU: "OTHER_HOME_UNIVERSITY",
  State_Level: "STATE_LEVEL",
} as const;

type StagingRow = Record<string, unknown>;

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function integer(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(
      `${field}: expected a non-negative integer, found ${value}`,
    );
  }
  return parsed;
}

function key(value: {
  year: number;
  choice_code: string;
  allocation_scope: string;
}): string {
  return `${value.year}:${value.choice_code}:${value.allocation_scope}`;
}

function officialComparable(
  row: OfficialSeatMatrixRow,
): Record<string, unknown> {
  return {
    institute_code: row.institute_code,
    choice_code: row.choice_code,
    allocation_scope: row.allocation_scope,
    sanctioned_intake: row.sanctioned_intake,
    maharashtra_state_seats: row.maharashtra_state_seats,
    minority_seats: row.minority_seats,
    all_india_seats: row.all_india_seats,
    institute_seats: row.institute_seats,
    orphan_seats: row.orphan_seats,
    cap_seats: row.cap_seats,
    category_seats: row.category_seats,
    scope_total: row.scope_total,
    pwd_total: row.pwd_total,
    pwd_common_reserved: row.pwd_common_reserved,
    defence_total: row.defence_total,
    defence_common_reserved: row.defence_common_reserved,
    ews_seats: row.ews_seats,
    tfws_choice_code: row.tfws_choice_code,
    tfws_seats: row.tfws_seats,
  };
}

function stagingComparable(row: StagingRow): Record<string, unknown> {
  const seatType = text(row.seat_type) as keyof typeof SCOPE_FIELDS;
  const allocationScope = SCOPE_FIELDS[seatType];
  if (!allocationScope) {
    throw new Error(`seat_type: unsupported value ${seatType}`);
  }
  const categorySeats = Object.fromEntries(
    Object.entries(CATEGORY_FIELDS).map(
      ([category, [generalField, ladiesField]]) => [
        category,
        {
          general: integer(row[generalField], generalField),
          ladies: integer(row[ladiesField], ladiesField),
        },
      ],
    ),
  );
  const tfwsChoiceCode = text(row.TFWS_choice_code);
  return {
    institute_code: text(row.college_code).padStart(5, "0"),
    choice_code: text(row.choice_code),
    allocation_scope: allocationScope,
    sanctioned_intake: integer(row.SI, "SI"),
    maharashtra_state_seats: integer(row.MS_seats, "MS_seats"),
    minority_seats: integer(row.minority_seats, "minority_seats"),
    all_india_seats: integer(row.all_india, "all_india"),
    institute_seats: integer(row.institute_seats, "institute_seats"),
    orphan_seats: integer(row.orphan, "orphan"),
    cap_seats: integer(row.CAP_seats, "CAP_seats"),
    category_seats: categorySeats,
    scope_total: integer(row.Total, "Total"),
    pwd_total: integer(row.PWD_total, "PWD_total"),
    pwd_common_reserved: integer(
      row.PWD_common_reserved,
      "PWD_common_reserved",
    ),
    defence_total: integer(row.DEF_total, "DEF_total"),
    defence_common_reserved: integer(
      row.DEF_common_reserved,
      "DEF_common_reserved",
    ),
    ews_seats: integer(row.EWS_seat, "EWS_seat"),
    tfws_choice_code: tfwsChoiceCode || null,
    tfws_seats: integer(row.TFWS_seats, "TFWS_seats"),
  };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "snapshot-root": { type: "string" },
      official: { type: "string" },
      year: { type: "string", default: "2024" },
      "run-id": { type: "string" },
      publish: { type: "boolean", default: false },
    },
  });
  if (!values["snapshot-root"] || !values.official) {
    throw new Error("--snapshot-root and --official are required");
  }
  const year = Number(values.year);
  if (year !== 2024) {
    throw new Error(
      "Deetnuts seat-matrix parity is available only for its 2024 staging table",
    );
  }
  const snapshotRoot = resolve(values["snapshot-root"]);
  const officialPath = resolve(values.official);
  const officialRows = (await readFile(officialPath, "utf-8"))
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      const parsed = OfficialSeatMatrixRow.safeParse(JSON.parse(line));
      if (!parsed.success) {
        throw new Error(
          `${officialPath}: line ${index + 1}: ${parsed.error.message}`,
        );
      }
      return parsed.data;
    });
  const stagingUnknown: unknown = JSON.parse(
    await readFile(
      join(snapshotRoot, "2024_mht_cet_colleges_seat_matrix.json"),
      "utf-8",
    ),
  );
  if (!Array.isArray(stagingUnknown)) {
    throw new Error("staging seat matrix must be a JSON array");
  }
  const stagingRows = stagingUnknown as StagingRow[];
  const officialByKey = new Map(
    officialRows.map((row) => [key(row), officialComparable(row)]),
  );
  if (officialByKey.size !== officialRows.length) {
    throw new Error("official seat matrix contains duplicate keys");
  }
  const stagingByKey = new Map<string, Record<string, unknown>>();
  for (const row of stagingRows) {
    const comparable = stagingComparable(row);
    const rowKey = key({
      year,
      choice_code: String(comparable.choice_code),
      allocation_scope: String(comparable.allocation_scope),
    });
    if (stagingByKey.has(rowKey)) {
      throw new Error(`staging seat matrix contains duplicate key ${rowKey}`);
    }
    stagingByKey.set(rowKey, comparable);
  }

  const discrepancies: Array<{
    key: string;
    reason: string;
    staging?: Record<string, unknown>;
    official?: Record<string, unknown>;
  }> = [];
  for (const [rowKey, staging] of stagingByKey) {
    const official = officialByKey.get(rowKey);
    if (!official) {
      discrepancies.push({
        key: rowKey,
        reason: "staging-only key",
        staging,
      });
      continue;
    }
    if (canonicalSourceRow(staging) !== canonicalSourceRow(official)) {
      discrepancies.push({
        key: rowKey,
        reason: "seat counts or official codes disagree",
        staging,
        official,
      });
    }
  }
  for (const [rowKey, official] of officialByKey) {
    if (!stagingByKey.has(rowKey)) {
      discrepancies.push({
        key: rowKey,
        reason: "official-only key",
        official,
      });
    }
  }

  const runId = values["run-id"] ?? randomUUID();
  const auditRoot = resolve(
    DATA_DIR,
    "_scratch",
    "mht-cet",
    "seat-matrix",
    runId,
  );
  await mkdir(auditRoot, { recursive: true });
  const reportPath = join(auditRoot, "parity-report.json");
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        schema_version: 1,
        year,
        staging_rows: stagingRows.length,
        official_rows: officialRows.length,
        staging_canonical_sha256: canonicalRowsSha256(stagingRows),
        official_sha256: createHash("sha256")
          .update(await readFile(officialPath))
          .digest("hex"),
        discrepancy_count: discrepancies.length,
        discrepancies,
        model_usage:
          "reference validation only; seat counts are excluded from prediction probability",
      },
      null,
      2,
    )}\n`,
  );
  if (discrepancies.length > 0) {
    throw new Error(
      `seat-matrix parity found ${discrepancies.length} discrepancies; nothing was published (audit: ${reportPath})`,
    );
  }
  if (values.publish) {
    const outputPath = resolve(
      DATA_DIR,
      "reference",
      "engineering",
      "mht-cet",
      `seat-matrix-${year}.jsonl`,
    );
    await mkdir(dirname(outputPath), { recursive: true });
    await copyFile(officialPath, outputPath);
    console.log(`Published verified MHT-CET seat matrix: ${outputPath}`);
  } else {
    console.log(
      `MHT-CET seat-matrix parity passed in audit-only mode (${officialRows.length} rows)`,
    );
  }
  console.log(`Audit: ${reportPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
