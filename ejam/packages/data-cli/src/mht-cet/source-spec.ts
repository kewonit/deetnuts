import { createHash } from "node:crypto";

export type MhtCetCutoffSourceSpec = {
  table: string;
  year: 2024 | 2025;
  round: 1 | 2 | 3 | 4;
  expectedRows: number;
  expectedOfficialRows: number;
  expectedOfficialKeys: number;
};

export const MHT_CET_CUTOFF_SOURCES: readonly MhtCetCutoffSourceSpec[] = [
  {
    table: "2024_mht_cet_round_one_cutoffs_duplicate",
    year: 2024,
    round: 1,
    expectedRows: 31_792,
    expectedOfficialRows: 31_781,
    expectedOfficialKeys: 31_652,
  },
  {
    table: "2024_mht_cet_round_two_cutoffs",
    year: 2024,
    round: 2,
    expectedRows: 40_500,
    expectedOfficialRows: 30_834,
    expectedOfficialKeys: 30_486,
  },
  {
    table: "2024_mht_cet_round_three_cutoffs",
    year: 2024,
    round: 3,
    expectedRows: 43_499,
    expectedOfficialRows: 16_734,
    expectedOfficialKeys: 16_597,
  },
  {
    table: "2025_mht_cet_round_one_cutoffs",
    year: 2025,
    round: 1,
    expectedRows: 34_373,
    expectedOfficialRows: 34_433,
    expectedOfficialKeys: 34_329,
  },
  {
    table: "2025_mht_cet_round_two_cutoffs",
    year: 2025,
    round: 2,
    expectedRows: 46_257,
    expectedOfficialRows: 33_463,
    expectedOfficialKeys: 33_023,
  },
  {
    table: "2025_mht_cet_round_three_cutoffs",
    year: 2025,
    round: 3,
    expectedRows: 46_632,
    expectedOfficialRows: 17_983,
    expectedOfficialKeys: 17_854,
  },
  {
    table: "2025_mht_cet_round_four_cutoffs",
    year: 2025,
    round: 4,
    expectedRows: 47_060,
    expectedOfficialRows: 13_744,
    expectedOfficialKeys: 13_657,
  },
] as const;

export const MHT_CET_EXPECTED_CUTOFF_ROWS = 290_113;
export const MHT_CET_EXPECTED_OFFICIAL_ROWS = 178_972;
export const MHT_CET_EXPECTED_OFFICIAL_KEYS = 177_598;
export const MHT_CET_EXPECTED_MULTI_STAGE_KEYS = 1_373;
export const MHT_CET_EXPECTED_ADDITIONAL_STAGE_CELLS = 1_374;

export const MHT_CET_REFERENCE_SOURCES = [
  {
    table: "2024_mht_cet_colleges",
    select: "id,college_id,college_name,status,home_university,created,updated",
  },
  {
    table: "2024_mht_cet_colleges_seat_matrix",
    select: "*",
  },
] as const;

export const MHT_CET_CUTOFF_SELECT = [
  "id",
  "college_code",
  "college_name",
  "course_code",
  "course_name",
  "category",
  "seat_allocation_section",
  "cutoff_score",
  "last_rank",
  "total_admitted",
  "status",
  "home_university",
  "created",
  "updated",
].join(",");

const VOLATILE_SOURCE_FIELDS = new Set(["id", "created", "updated"]);

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !VOLATILE_SOURCE_FIELDS.has(key))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalValue(entry)]),
    );
  }
  return value;
}

export function canonicalSourceRow(row: Record<string, unknown>): string {
  return JSON.stringify(canonicalValue(row));
}

export function canonicalRowsSha256(
  rows: Array<Record<string, unknown>>,
): string {
  const hash = createHash("sha256");
  const canonicalRows = rows.map(canonicalSourceRow).sort();
  for (const row of canonicalRows) {
    hash.update(row);
    hash.update("\n");
  }
  return hash.digest("hex");
}

export function assertMhtCetSourceAccounting(
  counts: ReadonlyMap<string, number>,
): void {
  let total = 0;
  for (const source of MHT_CET_CUTOFF_SOURCES) {
    const actual = counts.get(source.table);
    if (actual !== source.expectedRows) {
      throw new Error(
        `${source.table}: expected ${source.expectedRows} rows, received ${actual ?? 0}`,
      );
    }
    total += actual;
  }
  if (total !== MHT_CET_EXPECTED_CUTOFF_ROWS) {
    throw new Error(
      `MHT-CET cutoff accounting mismatch: expected ${MHT_CET_EXPECTED_CUTOFF_ROWS}, received ${total}`,
    );
  }
}
