/**
 * Upload MHT-CET CAP 2025 cutoff data for rounds 2, 3 and 4 into Supabase.
 *
 * Source: handoff/mht-cet-cap-2025-rounds-2-4/data/round-{2,3,4}/combined_cutoffs_with_status.csv
 * Target tables (must already exist; see supabase/migrations/20260423_mht_cet_2025_rounds_2_3_4.sql):
 *   public."2025_mht_cet_round_two_cutoffs"
 *   public."2025_mht_cet_round_three_cutoffs"
 *   public."2025_mht_cet_round_four_cutoffs"
 *
 * Behaviour:
 *  - Truncates the target table before insert (idempotent re-runs).
 *  - Uses Supabase service role; bypasses RLS.
 *  - Inserts in chunks of 1000 with limited concurrency.
 *  - Generates 15-char base32 IDs (PocketBase-compatible) using crypto.randomBytes.
 *
 * Run: npx tsx scripts/upload-mht-cet-2025-rounds-2-4.ts [--rounds=2,3,4] [--dry-run]
 */
import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import * as path from "path";
import * as crypto from "crypto";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
}

const SUPABASE_URL_VALUE = SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY_VALUE = SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
  SUPABASE_URL_VALUE,
  SUPABASE_SERVICE_ROLE_KEY_VALUE,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

const ROUND_TABLES: Record<number, string> = {
  2: "2025_mht_cet_round_two_cutoffs",
  3: "2025_mht_cet_round_three_cutoffs",
  4: "2025_mht_cet_round_four_cutoffs",
};

const EXPECTED_ROW_COUNTS: Record<number, number> = {
  2: 46257,
  3: 46632,
  4: 47060,
};

const HANDOFF_ROOT = path.join(
  __dirname,
  "..",
  "handoff",
  "mht-cet-cap-2025-rounds-2-4",
  "data",
);

const CHUNK_SIZE = 1000;
const CONCURRENCY = 4;

// PocketBase-style 15-char id from base32 alphabet (lowercase, no padding).
const ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
function generateId(): string {
  const buf = crypto.randomBytes(15);
  let out = "";
  for (let i = 0; i < 15; i += 1) {
    out += ID_ALPHABET[buf[i] % ID_ALPHABET.length];
  }
  return out;
}

interface CsvRow {
  college_code: string;
  college_name: string;
  course_code: string;
  course_name: string;
  category: string;
  seat_allocation_section: string;
  cutoff_score: string;
  last_rank: string;
  total_admitted: string;
  Status: string;
  "Home University": string;
}

interface InsertRow {
  id: string;
  college_code: string | null;
  college_name: string | null;
  course_code: string | null;
  course_name: string | null;
  category: string | null;
  seat_allocation_section: string | null;
  cutoff_score: number | null;
  last_rank: number | null;
  total_admitted: number | null;
  status: string | null;
  home_university: string | null;
}

type OpenApiSpec = {
  paths?: Record<string, unknown>;
};

function emptyToNull(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

function parseNumeric(value: string | undefined | null): number | null {
  const t = emptyToNull(value);
  if (t === null) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseInteger(value: string | undefined | null): number | null {
  const t = emptyToNull(value);
  if (t === null) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function mapRow(row: CsvRow): InsertRow {
  return {
    id: generateId(),
    college_code: emptyToNull(row.college_code),
    college_name: emptyToNull(row.college_name),
    course_code: emptyToNull(row.course_code),
    course_name: emptyToNull(row.course_name),
    category: emptyToNull(row.category),
    seat_allocation_section: emptyToNull(row.seat_allocation_section),
    cutoff_score: parseNumeric(row.cutoff_score),
    last_rank: parseInteger(row.last_rank),
    total_admitted: parseInteger(row.total_admitted),
    status: emptyToNull(row.Status),
    home_university: emptyToNull(row["Home University"]),
  };
}

async function fetchExposedRestPaths(): Promise<Set<string>> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_SERVICE_ROLE_KEY_VALUE,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY_VALUE}`,
  };

  const response = await fetch(`${SUPABASE_URL_VALUE}/rest/v1/`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to read Supabase OpenAPI schema: ${response.status} ${response.statusText}`,
    );
  }

  const spec = (await response.json()) as OpenApiSpec;
  return new Set(Object.keys(spec.paths ?? {}));
}

async function verifyTargetTables(rounds: number[]): Promise<void> {
  const restPaths = await fetchExposedRestPaths();
  const missingTables = rounds
    .map((round) => ROUND_TABLES[round])
    .filter((table) => !restPaths.has(`/${table}`));

  if (missingTables.length > 0) {
    throw new Error(
      [
        `Target tables are not exposed by the Supabase Data API: ${missingTables.join(", ")}`,
        "The service-role key can write existing tables, but it cannot create missing tables.",
        "Apply supabase/migrations/20260423_mht_cet_2025_rounds_2_3_4.sql first, or use a DATABASE_URL / Management API access token for DDL.",
      ].join(" "),
    );
  }
}

function verifyExpectedRowCount(round: number, actualRows: number): void {
  const expectedRows = EXPECTED_ROW_COUNTS[round];
  if (expectedRows !== actualRows) {
    throw new Error(
      `Unexpected row count for round ${round}: expected ${expectedRows}, got ${actualRows}`,
    );
  }
}

async function readCsv(filePath: string): Promise<InsertRow[]> {
  return new Promise((resolve, reject) => {
    const rows: InsertRow[] = [];
    createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: false }))
      .on("data", (row: CsvRow) => rows.push(mapRow(row)))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function clearTable(table: string): Promise<void> {
  // Delete all rows. Filter `id is not null` matches every row but satisfies the
  // safety requirement that delete must include a where clause.
  const { error } = await supabase.from(table).delete().not("id", "is", null);
  if (error) {
    throw new Error(`Failed to clear ${table}: ${error.message}`);
  }
}

async function getCount(table: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`Failed to count ${table}: ${error.message}`);
  return count ?? 0;
}

async function insertChunk(
  table: string,
  chunk: InsertRow[],
  attempt = 1,
): Promise<void> {
  const { error } = await supabase.from(table).insert(chunk);
  if (!error) return;
  if (attempt >= 4) {
    throw new Error(
      `Insert failed for ${table} after ${attempt} attempts: ${error.message}`,
    );
  }
  const backoffMs = 500 * 2 ** (attempt - 1);
  console.warn(
    `   retry ${attempt} for ${table} (${chunk.length} rows): ${error.message}`,
  );
  await new Promise((r) => setTimeout(r, backoffMs));
  return insertChunk(table, chunk, attempt + 1);
}

async function uploadRound(round: number, dryRun: boolean): Promise<void> {
  const table = ROUND_TABLES[round];
  const csvPath = path.join(
    HANDOFF_ROOT,
    `round-${round}`,
    "combined_cutoffs_with_status.csv",
  );

  console.log(`\n=== Round ${round} -> ${table} ===`);
  console.log(`Reading ${csvPath}`);
  const rows = await readCsv(csvPath);
  console.log(`Parsed ${rows.length} rows`);
  verifyExpectedRowCount(round, rows.length);

  // Sanity: schema parity check
  const sectionSet = new Set(rows.map((r) => r.seat_allocation_section));
  const categorySet = new Set(rows.map((r) => r.category));
  console.log(
    `Distinct sections: ${sectionSet.size} | distinct categories: ${categorySet.size}`,
  );

  if (dryRun) {
    console.log("Dry-run: skipping clear + insert");
    return;
  }

  const before = await getCount(table);
  console.log(`Existing rows in ${table}: ${before}`);
  if (before > 0) {
    console.log("Clearing existing rows...");
    await clearTable(table);
    const after = await getCount(table);
    if (after !== 0) {
      throw new Error(`Clear failed; ${after} rows remain in ${table}`);
    }
  }

  // Chunk the work
  const chunks: InsertRow[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    chunks.push(rows.slice(i, i + CHUNK_SIZE));
  }
  console.log(
    `Inserting ${rows.length} rows in ${chunks.length} chunks of ${CHUNK_SIZE} (concurrency=${CONCURRENCY})`,
  );

  let completed = 0;
  const queue = chunks.slice();
  async function worker() {
    while (queue.length) {
      const chunk = queue.shift()!;
      await insertChunk(table, chunk);
      completed += 1;
      if (completed % 10 === 0 || completed === chunks.length) {
        console.log(`   ${completed}/${chunks.length} chunks done`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const final = await getCount(table);
  console.log(`Final row count in ${table}: ${final}`);
  if (final !== rows.length) {
    throw new Error(
      `Row count mismatch for ${table}: inserted ${rows.length} but table has ${final}`,
    );
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const roundsArg = args.find((a) => a.startsWith("--rounds="));
  const positionalRounds = args
    .filter((arg) => !arg.startsWith("--"))
    .map((value) => parseInt(value.trim(), 10))
    .filter((value) => Number.isInteger(value));
  const roundsFromFlag = roundsArg
    ? roundsArg
        .replace("--rounds=", "")
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isInteger(n))
    : [];

  const rounds = Array.from(
    new Set(
      (roundsFromFlag.length > 0 || positionalRounds.length > 0
        ? [...roundsFromFlag, ...positionalRounds]
        : [2, 3, 4]
      ).filter((value) => Number.isInteger(value)),
    ),
  );

  for (const r of rounds) {
    if (!ROUND_TABLES[r]) {
      throw new Error(`Unsupported round: ${r}`);
    }
  }

  console.log(
    `Uploading rounds: ${rounds.join(", ")}${dryRun ? " (dry-run)" : ""}`,
  );
  if (!dryRun) {
    console.log("Verifying target tables are available via the Data API...");
    await verifyTargetTables(rounds);
  }
  for (const round of rounds) {
    await uploadRound(round, dryRun);
  }
  console.log("\nAll rounds processed.");
}

main().catch((err) => {
  console.error("\nUpload failed:", err);
  process.exit(1);
});
