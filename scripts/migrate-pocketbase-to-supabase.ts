import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

type PocketBaseListResponse<T> = {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
};

type CollectionMigration = {
  pocketbaseCollection: string;
  supabaseTable: string;
  onConflict?: string;
};

type MigrationCheckpoint = {
  updatedAt: string;
  collections: Record<
    string,
    {
      page: number;
      migratedRows: number;
      completed: boolean;
    }
  >;
};

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.POCKETBASE_URL;
const POCKETBASE_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const POCKETBASE_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!POCKETBASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_POCKETBASE_URL (or POCKETBASE_URL)");
}
if (!POCKETBASE_ADMIN_EMAIL || !POCKETBASE_ADMIN_PASSWORD) {
  throw new Error(
    "Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD",
  );
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
}

const POCKETBASE_BASE_URL = POCKETBASE_URL.replace(/\/$/, "");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const COLLECTIONS: CollectionMigration[] = [
  {
    pocketbaseCollection: "josaa_institutes",
    supabaseTable: "josaa_institutes",
    onConflict: "id",
  },
  {
    pocketbaseCollection: "josaa_branches",
    supabaseTable: "josaa_branches",
    onConflict: "id",
  },
  {
    pocketbaseCollection: "josaa_cutoffs",
    supabaseTable: "josaa_cutoffs",
    onConflict: "id",
  },
  {
    pocketbaseCollection: "josaa_institute_aliases",
    supabaseTable: "josaa_institute_aliases",
    onConflict: "id",
  },
  {
    pocketbaseCollection: "2024_mht_cet_colleges",
    supabaseTable: "2024_mht_cet_colleges",
    onConflict: "id",
  },
  {
    pocketbaseCollection: "2024_mht_cet_colleges_seat_matrix",
    supabaseTable: "2024_mht_cet_colleges_seat_matrix",
    onConflict: "id",
  },
  {
    pocketbaseCollection: "2024_mht_cet_round_one_cutoffs_duplicate",
    supabaseTable: "2024_mht_cet_round_one_cutoffs_duplicate",
    onConflict: "id",
  },
  {
    pocketbaseCollection: "2024_mht_cet_round_two_cutoffs",
    supabaseTable: "2024_mht_cet_round_two_cutoffs",
    onConflict: "id",
  },
  {
    pocketbaseCollection: "2024_mht_cet_round_three_cutoffs",
    supabaseTable: "2024_mht_cet_round_three_cutoffs",
    onConflict: "id",
  },
  {
    pocketbaseCollection: "2025_mht_cet_round_one_cutoffs",
    supabaseTable: "2025_mht_cet_round_one_cutoffs",
    onConflict: "id",
  },
  {
    pocketbaseCollection: "2024_all_india_rounds_one",
    supabaseTable: "2024_all_india_rounds_one",
    onConflict: "id",
  },
  {
    pocketbaseCollection: "2024_all_india_rounds_two",
    supabaseTable: "2024_all_india_rounds_two",
    onConflict: "id",
  },
  {
    pocketbaseCollection: "2024_all_india_rounds_three",
    supabaseTable: "2024_all_india_rounds_three",
    onConflict: "id",
  },
  {
    pocketbaseCollection: "engineering_bits_cutoffs",
    supabaseTable: "engineering_bits_cutoffs",
    onConflict: "id",
  },
];

const TABLE_ALLOWED_COLUMNS: Record<string, Set<string>> = {
  josaa_institutes: new Set([
    "id",
    "created",
    "updated",
    "name",
    "code",
    "short_name",
    "slug",
    "institute_type",
    "state",
    "city",
    "established_year",
    "nirf_rank",
    "website",
    "logo_url",
    "years_active",
    "original_id",
  ]),
  josaa_branches: new Set([
    "id",
    "created",
    "updated",
    "name",
    "code",
    "short_code",
    "degree_type",
    "duration",
    "duration_years",
    "specializations",
    "years_active",
    "original_id",
  ]),
  josaa_cutoffs: new Set([
    "id",
    "created",
    "updated",
    "institute",
    "institute_id",
    "branch",
    "branch_id",
    "branch_code",
    "year",
    "round",
    "category",
    "gender",
    "seat_type",
    "opening_rank",
    "closing_rank",
    "quota",
    "is_pwd",
    "source",
  ]),
  josaa_institute_aliases: new Set([
    "id",
    "created",
    "updated",
    "institute",
    "alias",
    "is_official",
  ]),
  "2024_mht_cet_colleges": new Set([
    "id",
    "created",
    "updated",
    "college_id",
    "college_name",
    "status",
    "home_university",
  ]),
  "2024_mht_cet_colleges_seat_matrix": new Set([
    "id",
    "created",
    "updated",
    "page_number",
    "college_code",
    "college_name",
    "choice_code",
    "course_name",
    "seat_type",
    "SI",
    "MS_seats",
    "minority_seats",
    "all_india",
    "institute_seats",
    "orphan",
    "CAP_seats",
    "OPEN_General",
    "OPEN_Ladies",
    "SC_General",
    "SC_Ladies",
    "ST_General",
    "ST_Ladies",
    "VJ_DT_General",
    "VJ_DT_Ladies",
    "NTB_General",
    "NTB_Ladies",
    "NTC_General",
    "NTC_Ladies",
    "NTD_General",
    "NTD_Ladies",
    "OBC_General",
    "OBC_Ladies",
    "SEBC_General",
    "SEBC_Ladies",
    "Total",
    "PWD_total",
    "PWD_common_reserved",
    "DEF_total",
    "DEF_common_reserved",
    "EWS_seat",
    "TFWS_choice_code",
    "TFWS_seats",
  ]),
  "2024_mht_cet_round_one_cutoffs_duplicate": new Set([
    "id",
    "created",
    "updated",
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
  ]),
  "2024_mht_cet_round_two_cutoffs": new Set([
    "id",
    "created",
    "updated",
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
  ]),
  "2024_mht_cet_round_three_cutoffs": new Set([
    "id",
    "created",
    "updated",
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
  ]),
  "2025_mht_cet_round_one_cutoffs": new Set([
    "id",
    "created",
    "updated",
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
  ]),
  "2024_all_india_rounds_one": new Set([
    "id",
    "created",
    "updated",
    "sr_no",
    "rank",
    "percentile",
    "choice_code",
    "institute_code",
    "merit_exam",
    "type",
    "seat_type",
    "college_code",
    "course_name",
    "college_name",
  ]),
  "2024_all_india_rounds_two": new Set([
    "id",
    "created",
    "updated",
    "sr_no",
    "rank",
    "percentile",
    "choice_code",
    "institute_code",
    "merit_exam",
    "type",
    "seat_type",
    "college_code",
    "course_name",
    "college_name",
  ]),
  "2024_all_india_rounds_three": new Set([
    "id",
    "created",
    "updated",
    "sr_no",
    "rank",
    "percentile",
    "choice_code",
    "institute_code",
    "merit_exam",
    "type",
    "seat_type",
    "college_code",
    "course_name",
    "college_name",
  ]),
  engineering_bits_cutoffs: new Set([
    "id",
    "created",
    "updated",
    "Year",
    "Program",
    "Campus",
    "Degree",
    "Quotas",
    "Gender",
    "Opening",
    "Closing",
  ]),
};

const PAGE_SIZE = 500;
const UPSERT_BATCH_SIZE = 1000;
const MAX_RETRIES = 5;
const REQUEST_TIMEOUT_MS = 45_000;
const SKIP_BAD_ROWS = parseBool(process.env.MIGRATION_SKIP_BAD_ROWS, false);
const CHECKPOINT_PATH = path.resolve(
  process.cwd(),
  ".migration-pocketbase-supabase.checkpoint.json",
);
const BAD_ROWS_LOG_PATH = path.resolve(
  process.cwd(),
  ".migration-pocketbase-supabase.bad-rows.ndjson",
);

let pbAuthToken = "";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseBool(value: string | undefined, defaultValue = false): boolean {
  if (!value) return defaultValue;
  return ["1", "true", "yes", "y", "on"].includes(value.toLowerCase());
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const json = Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function validateSupabaseAdminKey(key: string) {
  if (key.startsWith("sb_secret_")) {
    return;
  }

  const payload = decodeJwtPayload(key);
  if (!payload) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is neither an sb_secret key nor a valid JWT-based service_role key.",
    );
  }

  const role = String(payload.role || "").toLowerCase();
  if (role !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY has role='${role || "unknown"}', expected 'service_role'. Replace with a real service_role (legacy JWT) or sb_secret key from Supabase API Keys settings.`,
    );
  }
}

function formatError(error: unknown): string {
  if (!error) return "Unknown error";
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function loadCheckpoint(): MigrationCheckpoint {
  if (!fs.existsSync(CHECKPOINT_PATH)) {
    return { updatedAt: new Date().toISOString(), collections: {} };
  }

  try {
    const raw = fs.readFileSync(CHECKPOINT_PATH, "utf8");
    const parsed = JSON.parse(raw) as MigrationCheckpoint;
    if (!parsed.collections) {
      return { updatedAt: new Date().toISOString(), collections: {} };
    }
    return parsed;
  } catch (error) {
    console.warn("Could not parse checkpoint file, starting fresh.", error);
    return { updatedAt: new Date().toISOString(), collections: {} };
  }
}

function saveCheckpoint(checkpoint: MigrationCheckpoint) {
  checkpoint.updatedAt = new Date().toISOString();
  fs.writeFileSync(
    CHECKPOINT_PATH,
    JSON.stringify(checkpoint, null, 2),
    "utf8",
  );
}

async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  retries = MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof Error
          ? /timeout|network|ECONNRESET|429|5\d\d|Failed to fetch/i.test(
              error.message,
            )
          : true;

      if (!retryable || attempt === retries) {
        break;
      }

      const delayMs = Math.min(10_000, 400 * 2 ** (attempt - 1));
      console.warn(
        `[retry] ${context} failed (attempt ${attempt}/${retries}), retrying in ${delayMs}ms...`,
      );
      await sleep(delayMs);
    }
  }

  throw new Error(
    `${context} failed after ${retries} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

async function authenticatePocketBase(): Promise<string> {
  const authEndpoints = [
    `${POCKETBASE_BASE_URL}/api/admins/auth-with-password`,
    `${POCKETBASE_BASE_URL}/api/collections/_superusers/auth-with-password`,
  ];

  let lastError = "";

  for (const loginUrl of authEndpoints) {
    const response = await withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );
      try {
        return await fetch(loginUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identity: POCKETBASE_ADMIN_EMAIL,
            password: POCKETBASE_ADMIN_PASSWORD,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    }, `PocketBase auth (${loginUrl})`);

    if (response.status === 404) {
      lastError = `Endpoint not found: ${loginUrl}`;
      continue;
    }

    if (!response.ok) {
      const body = await response.text();
      lastError = `Auth failed at ${loginUrl} (${response.status}): ${body}`;
      continue;
    }

    const json = (await response.json()) as { token?: string };
    if (!json.token) {
      lastError = `Auth succeeded but no token returned at ${loginUrl}`;
      continue;
    }

    pbAuthToken = json.token;
    console.log(`PocketBase auth succeeded via: ${loginUrl}`);
    return json.token;
  }

  throw new Error(
    `PocketBase auth failed for all known endpoints. Last error: ${lastError}`,
  );
}

async function fetchPocketBaseCollectionPage<T>(
  collection: string,
  page: number,
): Promise<PocketBaseListResponse<T>> {
  const baseUrl = `${POCKETBASE_BASE_URL}/api/collections/${encodeURIComponent(collection)}/records`;
  const params = new URLSearchParams({
    page: String(page),
    perPage: String(PAGE_SIZE),
    skipTotal: "0",
  });

  const response = await withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(`${baseUrl}?${params.toString()}`, {
        headers: {
          Authorization: pbAuthToken,
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }, `Fetch PocketBase ${collection} page ${page}`);

  if (response.status === 401 || response.status === 403) {
    await authenticatePocketBase();
    return fetchPocketBaseCollectionPage<T>(collection, page);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed reading ${collection} page ${page} (${response.status}): ${body}`,
    );
  }

  return (await response.json()) as PocketBaseListResponse<T>;
}

function normalizeRecord(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const { collectionId, collectionName, expand, ...rest } = record;
  return rest;
}

function sanitizeRecordForTable(
  table: string,
  record: Record<string, unknown>,
): Record<string, unknown> {
  const allowed = TABLE_ALLOWED_COLUMNS[table];
  if (!allowed) {
    return record;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (allowed.has(key)) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

async function upsertInBatches(
  migration: CollectionMigration,
  page: number,
  table: string,
  records: Record<string, unknown>[],
) {
  for (let index = 0; index < records.length; index += UPSERT_BATCH_SIZE) {
    const batch = records.slice(index, index + UPSERT_BATCH_SIZE);
    const { error } = await withRetry(
      async () => {
        return supabase.from(table).upsert(batch, {
          onConflict: migration.onConflict || "id",
        });
      },
      `Supabase upsert ${table} page ${page} batch ${index / UPSERT_BATCH_SIZE + 1}`,
    );

    if (error) {
      const batchNumber = index / UPSERT_BATCH_SIZE + 1;
      console.error(
        `[${table}] batch upsert failed at page ${page}, batch ${batchNumber}. Attempting per-row diagnostic fallback...`,
      );

      let firstRowError: string | null = null;
      let failedRows = 0;

      for (const row of batch) {
        const { error: rowError } = await supabase.from(table).upsert([row], {
          onConflict: migration.onConflict || "id",
        });

        if (!rowError) continue;

        failedRows += 1;
        const diagnostic = {
          timestamp: new Date().toISOString(),
          table,
          pocketbaseCollection: migration.pocketbaseCollection,
          page,
          batch: batchNumber,
          rowId: (row as { id?: string }).id,
          error: rowError,
        };
        fs.appendFileSync(
          BAD_ROWS_LOG_PATH,
          `${JSON.stringify(diagnostic)}\n`,
          "utf8",
        );

        if (!firstRowError) {
          firstRowError = formatError(rowError);
        }

        if (!SKIP_BAD_ROWS) {
          throw new Error(
            `Supabase upsert failed for ${table} at page ${page}, batch ${batchNumber}. First row error: ${firstRowError}`,
          );
        }
      }

      if (failedRows > 0) {
        console.warn(
          `[${table}] page ${page} batch ${batchNumber}: ${failedRows} row(s) failed and were logged to ${BAD_ROWS_LOG_PATH}`,
        );
      }
    }

    console.log(
      `[${table}] page ${page}: upserted ${Math.min(index + UPSERT_BATCH_SIZE, records.length)}/${records.length}`,
    );
  }
}

async function getSupabaseExactCount(table: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact" })
    .limit(1);
  if (error) {
    throw new Error(
      `Failed to count Supabase table ${table}: ${error.message}`,
    );
  }
  return count || 0;
}

async function ensureTargetTablesExist() {
  const missingTables: string[] = [];

  for (const migration of COLLECTIONS) {
    const { error } = await supabase
      .from(migration.supabaseTable)
      .select("*")
      .limit(1);

    if (!error) continue;

    const code = (error as { code?: string }).code;
    const message = formatError(error).toLowerCase();
    const isMissing =
      code === "42P01" ||
      message.includes("does not exist") ||
      message.includes("relation");

    if (isMissing) {
      missingTables.push(migration.supabaseTable);
      continue;
    }

    throw new Error(
      `Failed to verify target table ${migration.supabaseTable}: ${formatError(error)}`,
    );
  }

  if (missingTables.length > 0) {
    throw new Error(
      `Supabase schema is incomplete. Missing tables: ${missingTables.join(", ")}. Apply SQL migration file supabase/migrations/20260304_pocketbase_to_supabase.sql first.`,
    );
  }
}

async function migrateCollection(
  checkpoint: MigrationCheckpoint,
  migration: CollectionMigration,
) {
  console.log(
    `\n→ Migrating ${migration.pocketbaseCollection} -> ${migration.supabaseTable}`,
  );

  const collectionState = checkpoint.collections[
    migration.pocketbaseCollection
  ] || {
    page: 1,
    migratedRows: 0,
    completed: false,
  };

  if (collectionState.completed) {
    console.log(
      `↷ Skipping ${migration.pocketbaseCollection}: already completed in checkpoint.`,
    );
    return;
  }

  const startPage = Math.max(1, collectionState.page);

  let firstPage: PocketBaseListResponse<Record<string, unknown>>;
  try {
    firstPage = await fetchPocketBaseCollectionPage<Record<string, unknown>>(
      migration.pocketbaseCollection,
      startPage,
    );
  } catch (error) {
    const message = formatError(error).toLowerCase();
    const isMissingCollection =
      message.includes("missing collection context") ||
      message.includes("404") ||
      message.includes("not found");

    if (!isMissingCollection) {
      throw error;
    }

    console.warn(
      `Source collection '${migration.pocketbaseCollection}' not found in PocketBase. Marking as completed with 0 migrated rows.`,
    );
    checkpoint.collections[migration.pocketbaseCollection] = {
      page: 1,
      migratedRows: 0,
      completed: true,
    };
    saveCheckpoint(checkpoint);
    return;
  }

  if (firstPage.totalItems === 0) {
    console.log(
      `[${migration.supabaseTable}] no records found, marking complete.`,
    );
    checkpoint.collections[migration.pocketbaseCollection] = {
      page: 1,
      migratedRows: 0,
      completed: true,
    };
    saveCheckpoint(checkpoint);
    return;
  }

  const totalPages = firstPage.totalPages;
  let migratedRows = collectionState.migratedRows;

  for (let page = startPage; page <= totalPages; page += 1) {
    const pageResult =
      page === startPage
        ? firstPage
        : await fetchPocketBaseCollectionPage<Record<string, unknown>>(
            migration.pocketbaseCollection,
            page,
          );

    const normalized = pageResult.items
      .map(normalizeRecord)
      .map((row) => sanitizeRecordForTable(migration.supabaseTable, row));
    if (normalized.length > 0) {
      await upsertInBatches(
        migration,
        page,
        migration.supabaseTable,
        normalized,
      );
      migratedRows += normalized.length;
    }

    checkpoint.collections[migration.pocketbaseCollection] = {
      page: page + 1,
      migratedRows,
      completed: false,
    };
    saveCheckpoint(checkpoint);

    console.log(
      `[${migration.pocketbaseCollection}] migrated page ${page}/${totalPages} (running rows: ${migratedRows})`,
    );
  }

  const sourceCount = firstPage.totalItems;
  const destinationCount = await getSupabaseExactCount(migration.supabaseTable);

  checkpoint.collections[migration.pocketbaseCollection] = {
    page: totalPages + 1,
    migratedRows,
    completed: true,
  };
  saveCheckpoint(checkpoint);

  console.log(
    ` Completed ${migration.supabaseTable} (source=${sourceCount}, destination=${destinationCount}, migratedRows=${migratedRows})`,
  );

  if (destinationCount < sourceCount) {
    throw new Error(
      `Verification failed for ${migration.supabaseTable}: destination count (${destinationCount}) is lower than source count (${sourceCount}).`,
    );
  }
}

async function main() {
  const forceRestart = parseBool(process.env.MIGRATION_FORCE_RESTART, false);

  if (forceRestart && fs.existsSync(CHECKPOINT_PATH)) {
    fs.unlinkSync(CHECKPOINT_PATH);
    console.log(
      "Removed existing migration checkpoint due to MIGRATION_FORCE_RESTART=true",
    );
  }

  const checkpoint = loadCheckpoint();

  console.log("Starting PocketBase -> Supabase migration...");
  console.log(`PocketBase: ${POCKETBASE_URL}`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Checkpoint: ${CHECKPOINT_PATH}`);

  validateSupabaseAdminKey(SUPABASE_SERVICE_ROLE_KEY!);

  await ensureTargetTablesExist();

  await authenticatePocketBase();

  for (const migration of COLLECTIONS) {
    await migrateCollection(checkpoint, migration);
  }

  console.log("\nMigration finished successfully.");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
