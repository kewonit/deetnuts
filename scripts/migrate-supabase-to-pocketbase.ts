import "dotenv/config";

import { createHash } from "node:crypto";
import { basename } from "node:path";
import pg from "pg";
import QueryStream from "pg-query-stream";
import PocketBase, {
  ClientResponseError,
  type CollectionModel,
  type RecordModel,
} from "pocketbase";
import { toPocketBaseAuthEmail } from "../lib/pocketbase/email";

const { Client } = pg;
const SERVICE_RULE =
  '@request.auth.collectionName = "app_services" && @request.auth.role = "backend"';
const BATCH_SIZE = 250;
const VERIFY_PAGE_SIZE = 500;
const MODULUS = 1n << 256n;
const PB_ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const PB_ID_SPACE = 36n ** 15n;
const RESERVED_FIELDS = new Set([
  "id",
  "created",
  "updated",
  "collectionId",
  "collectionName",
  "expand",
]);
const MIGRATION_FIELDS = new Set([
  "migration_source_key",
  "migration_source_hash",
  "migration_source_json",
  "migration_run_id",
]);
const SERVICE_WRITABLE_TABLES = new Set([
  "bot_usage_events",
  "bot_processed_events",
]);

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: "YES" | "NO";
  ordinal_position: number;
}

interface PrimaryKeyInfo {
  table_name: string;
  columns: string[];
}

interface StreamRow {
  source_json: string;
  pk_json: string;
}

interface SourceUserRow {
  supabase_id: string;
  email: string;
  encrypted_password: string;
  verified: boolean;
  full_name: string;
  avatar_url: string;
  username: string;
  website: string;
  source_json: string;
  google_identities_json: string;
  has_stored_avatar: boolean;
}

interface StorageObjectRow {
  id: string;
  bucket_id: string;
  name: string;
  owner_id: string | null;
  metadata_json: string;
  source_json: string;
  created_at: string;
  updated_at: string;
}

interface TableMigrationResult {
  name: string;
  targetCollection: string;
  sourceCount: number;
  targetCount: number;
  sourceDigest: string;
  targetDigest: string;
}

class DigestAccumulator {
  count = 0;
  xor = 0n;
  sum = 0n;

  add(hash: string): void {
    if (!/^[0-9a-f]{64}$/.test(hash)) throw new Error("Invalid row digest");
    const value = BigInt(`0x${hash}`);
    this.count += 1;
    this.xor ^= value;
    this.sum = (this.sum + value) % MODULUS;
  }

  digest(): string {
    return sha256(
      `${this.count}:${this.xor.toString(16).padStart(64, "0")}:${this.sum.toString(16).padStart(64, "0")}`,
    );
  }
}

function required(name: string, minimumLength = 1): string {
  const value = process.env[name];
  if (!value || value.length < minimumLength) {
    throw new Error(`${name} is missing or too short`);
  }
  return value;
}

function pocketBasePassword(name: string): string {
  const value = required(name, 32);
  if (value.length > 72) {
    throw new Error(`${name} must contain between 32 and 72 characters`);
  }
  return value;
}

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function safeHttpsUrl(value: string): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function pocketBaseId(namespace: string, sourceKey: string): string {
  const bytes = createHash("sha256")
    .update(namespace)
    .update("\0")
    .update(sourceKey)
    .digest();
  let value = BigInt(`0x${bytes.toString("hex")}`) % PB_ID_SPACE;
  let id = "";
  for (let index = 0; index < 15; index += 1) {
    id = PB_ID_ALPHABET[Number(value % 36n)] + id;
    value /= 36n;
  }
  return id;
}

function recordId(namespace: string, sourceKey: string, source: unknown): string {
  if (typeof source === "string" && /^[a-z0-9]{15}$/.test(source)) {
    return source;
  }
  if (
    (typeof source === "string" && source.length > 0) ||
    typeof source === "number"
  ) {
    return pocketBaseId("source-record-id", String(source));
  }
  return pocketBaseId(namespace, sourceKey);
}

function targetCollectionName(sourceTable: string): string {
  const normalized = sourceTable.replace(/[^A-Za-z0-9_]/g, "_");
  if (!normalized || normalized.length > 220) {
    return `source_${sha256(sourceTable).slice(0, 24)}`;
  }
  return normalized;
}

function targetFieldName(sourceColumn: string): string | null {
  const lower = sourceColumn.toLowerCase();
  const isReserved = [...RESERVED_FIELDS, ...MIGRATION_FIELDS].some(
    (field) => field.toLowerCase() === lower,
  );
  if (/^[A-Za-z][A-Za-z0-9_]*$/.test(sourceColumn) && !isReserved) {
    return sourceColumn;
  }
  const normalized = sourceColumn
    .replace(/[^A-Za-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  const stem = normalized || "field";
  const prefix = isReserved ? "source_reserved" : "source_legacy";
  return `${prefix}_${stem.slice(0, 72)}_${sha256(sourceColumn).slice(0, 10)}`;
}

function targetUrl(): string {
  const raw = required("POCKETBASE_MIGRATION_URL");
  const url = new URL(raw);
  if (
    url.protocol !== "http:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !["pocketbase", "127.0.0.1", "localhost"].includes(url.hostname)
  ) {
    throw new Error(
      "POCKETBASE_MIGRATION_URL must be a private PocketBase or loopback HTTP origin",
    );
  }
  return url.origin;
}

async function authenticateTarget(): Promise<PocketBase> {
  const pb = new PocketBase(targetUrl());
  pb.autoCancellation(false);
  await pb
    .collection("_superusers")
    .authWithPassword(
      required("POCKETBASE_SUPERUSER_EMAIL"),
      pocketBasePassword("POCKETBASE_SUPERUSER_PASSWORD"),
    );
  if (!pb.authStore.isSuperuser) {
    throw new Error("PocketBase did not return a superuser identity");
  }
  return pb;
}

function isNotFound(error: unknown): boolean {
  return error instanceof ClientResponseError && error.status === 404;
}

function pocketBaseField(column: ColumnInfo): Record<string, unknown> | null {
  const name = targetFieldName(column.column_name);
  if (!name || name.length > 100) return null;
  const common = { name, required: false };
  if (column.data_type === "boolean") return { ...common, type: "bool" };
  if (
    [
      "smallint",
      "integer",
      "bigint",
      "decimal",
      "numeric",
      "real",
      "double precision",
    ].includes(column.data_type)
  ) {
    return {
      ...common,
      type: "number",
      onlyInt: ["smallint", "integer", "bigint"].includes(column.data_type),
    };
  }
  if (
    column.data_type === "json" ||
    column.data_type === "jsonb" ||
    column.data_type === "ARRAY"
  ) {
    return { ...common, type: "json", maxSize: 2 * 1024 * 1024 };
  }
  return { ...common, type: "text" };
}

function indexName(table: string, fields: string[], unique = false): string {
  return `idx_${sha256(`${table}:${fields.join(",")}:${unique}`).slice(0, 20)}`;
}

function sqliteIndex(
  table: string,
  fields: string[],
  unique = false,
  where = "",
): string {
  return `CREATE ${unique ? "UNIQUE " : ""}INDEX \`${indexName(table, fields, unique)}\` ON \`${table}\` (${fields.map((field) => `\`${field}\``).join(", ")})${where ? ` WHERE ${where}` : ""}`;
}

function runtimeIndexes(table: string, fieldNames: Set<string>): string[] {
  const indexes: string[] = [];
  const add = (fields: string[], unique = false) => {
    if (fields.every((field) => fieldNames.has(field))) {
      indexes.push(sqliteIndex(table, fields, unique));
    }
  };

  if (/mht_cet.*cutoff/i.test(table)) {
    add(["college_code"]);
    add(["cutoff_score"]);
    add(["last_rank"]);
    add(["category", "cutoff_score"]);
    add(["course_name"]);
    add(["status"]);
    add(["home_university"]);
    add(["institute_home_university_id", "seat_allocation_section"]);
  } else if (/all_india_rounds/i.test(table)) {
    add(["rank"]);
    add(["percentile"]);
    add(["college_code"]);
    add(["course_name"]);
  } else if (table === "2024_mht_cet_colleges") {
    add(["college_id"], true);
    add(["college_name"]);
  } else if (table === "2024_mht_cet_colleges_seat_matrix") {
    add(["college_code"]);
    add(["course_name"]);
  } else if (table === "bot_usage_events") {
    add(["created_at"]);
    add(["event_name", "status"]);
  } else if (table === "bot_processed_events") {
    add(["platform", "external_id", "action"], true);
    add(["updated_at"]);
  }
  return indexes;
}

async function getCollection(
  pb: PocketBase,
  name: string,
): Promise<CollectionModel | null> {
  try {
    return await pb.collections.getOne(name);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

async function ensureSourceCollection(
  pb: PocketBase,
  sourceTable: string,
  collectionName: string,
  columns: ColumnInfo[],
): Promise<CollectionModel> {
  const writeRule = SERVICE_WRITABLE_TABLES.has(sourceTable)
    ? SERVICE_RULE
    : null;
  const sourceFields = columns
    .map(pocketBaseField)
    .filter((field): field is Record<string, unknown> => Boolean(field));
  const sourceFieldNames = sourceFields.map((field) => String(field.name));
  if (new Set(sourceFieldNames).size !== sourceFieldNames.length) {
    throw new Error(`Mapped field collision in public.${sourceTable}`);
  }
  const metadataFields = [
    { type: "text", name: "migration_source_key" },
    { type: "text", name: "migration_source_hash", pattern: "^[0-9a-f]{64}$" },
    { type: "text", name: "migration_source_json" },
    { type: "text", name: "migration_run_id", pattern: "^[0-9a-f]{32}$" },
  ];
  const existing = await getCollection(pb, collectionName);
  if (!existing) {
    try {
      return await pb.collections.create({
        type: "base",
        name: collectionName,
        listRule: SERVICE_RULE,
        viewRule: SERVICE_RULE,
        createRule: writeRule,
        updateRule: writeRule,
        deleteRule: writeRule,
        fields: [...sourceFields, ...metadataFields],
        indexes: [
          sqliteIndex(
            collectionName,
            ["migration_source_key"],
            true,
            "`migration_source_key` != ''",
          ),
        ],
      });
    } catch (error) {
      const detail =
        error instanceof ClientResponseError
          ? JSON.stringify(error.response).slice(0, 4000)
          : "unknown schema error";
      throw new Error(
        `Unable to create PocketBase collection ${collectionName} for public.${sourceTable}: ${detail}`,
      );
    }
  }

  const sourceColumnNames = new Set(
    sourceFields.map((field) => String(field.name)),
  );
  const unexpectedFields = existing.fields
    .filter((field) => !field.system)
    .map((field) => field.name)
    .filter(
      (name) =>
        !sourceColumnNames.has(name) &&
        ![
          "migration_source_key",
          "migration_source_hash",
          "migration_source_json",
          "migration_run_id",
        ].includes(name),
    );
  if (unexpectedFields.length > 0) {
    throw new Error(
      `PocketBase collection ${collectionName} for public.${sourceTable} has unexpected fields; refusing to overwrite it`,
    );
  }
  const migrationIndex = sqliteIndex(
    collectionName,
    ["migration_source_key"],
    true,
    "`migration_source_key` != ''",
  );
  const migrationIndexName = indexName(
    collectionName,
    ["migration_source_key"],
    true,
  );
  return pb.collections.update(existing.id, {
    ...existing,
    listRule: SERVICE_RULE,
    viewRule: SERVICE_RULE,
    createRule: writeRule,
    updateRule: writeRule,
    deleteRule: writeRule,
    fields: [
      ...existing.fields.filter((field) => field.system),
      ...sourceFields,
      ...metadataFields,
    ],
    indexes: [
      ...existing.indexes.filter(
        (index) => !index.includes(`\`${migrationIndexName}\``),
      ),
      migrationIndex,
    ],
  });
}

function typedPayload(
  row: Record<string, unknown>,
  columns: ColumnInfo[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const column of columns) {
    const targetName = targetFieldName(column.column_name);
    if (!targetName || targetName.length > 100) continue;
    const value = row[column.column_name];
    if (value === null || value === undefined) continue;
    if (
      [
        "smallint",
        "integer",
        "bigint",
        "decimal",
        "numeric",
        "real",
        "double precision",
      ].includes(column.data_type)
    ) {
      const number = Number(value);
      if (Number.isFinite(number)) result[targetName] = number;
    } else if (column.data_type === "boolean") {
      result[targetName] = Boolean(value);
    } else if (
      column.data_type === "json" ||
      column.data_type === "jsonb" ||
      column.data_type === "ARRAY"
    ) {
      result[targetName] = value;
    } else {
      result[targetName] =
        typeof value === "string" ? value : JSON.stringify(value);
    }
  }
  return result;
}

async function verifyCollection(
  pb: PocketBase,
  name: string,
): Promise<{ count: number; digest: string }> {
  const accumulator = new DigestAccumulator();
  let page = 1;
  let totalPages = 1;
  let reportedTotal = 0;
  do {
    const result = await pb.collection(name).getList(page, VERIFY_PAGE_SIZE, {
      sort: "id",
      fields:
        "id,migration_source_key,migration_source_hash,migration_source_json",
    });
    totalPages = result.totalPages;
    reportedTotal = result.totalItems;
    for (const record of result.items) {
      const sourceJson = String(record.migration_source_json || "");
      const expectedHash = String(record.migration_source_hash || "");
      const actualHash = sha256(sourceJson);
      if (actualHash !== expectedHash) {
        throw new Error(`Target row hash mismatch in ${name}`);
      }
      accumulator.add(actualHash);
    }
    page += 1;
  } while (page <= totalPages);
  if (reportedTotal !== accumulator.count) {
    throw new Error(`Target pagination count mismatch in ${name}`);
  }
  return { count: accumulator.count, digest: accumulator.digest() };
}

async function applyRuntimeIndexes(
  pb: PocketBase,
  collection: CollectionModel,
): Promise<void> {
  const fields = new Set(collection.fields.map((field) => field.name));
  const desired = runtimeIndexes(collection.name, fields);
  const existing = new Set(collection.indexes);
  const missing = desired.filter((index) => !existing.has(index));
  if (missing.length === 0) return;
  await pb.collections.update(collection.id, {
    ...collection,
    indexes: [...collection.indexes, ...missing],
  });
}

async function purgeStaleRecords(
  pb: PocketBase,
  collectionName: string,
  migrationRunId: string,
): Promise<void> {
  let removed = 0;
  while (true) {
    const stale = await pb.collection(collectionName).getList(1, BATCH_SIZE, {
      filter: `migration_run_id != "${migrationRunId}"`,
      fields: "id",
      skipTotal: true,
    });
    if (stale.items.length === 0) break;
    const batch = pb.createBatch();
    for (const record of stale.items) {
      batch.collection(collectionName).delete(record.id);
    }
    await batch.send();
    removed += stale.items.length;
  }
  if (removed > 0) {
    console.log(
      `${collectionName}: removed ${removed.toLocaleString("en-US")} stale migration rows`,
    );
  }
}

async function migrateTable(
  source: pg.Client,
  pb: PocketBase,
  table: string,
  columns: ColumnInfo[],
  primaryKey: string[],
  migrationRunId: string,
): Promise<TableMigrationResult> {
  if (primaryKey.length === 0) {
    throw new Error(`Source table public.${table} has no primary key`);
  }
  const collectionName = targetCollectionName(table);
  const collection = await ensureSourceCollection(
    pb,
    table,
    collectionName,
    columns,
  );
  const pkExpression = primaryKey
    .map((column) => `t.${quoteIdentifier(column)}`)
    .join(", ");
  const orderExpression = primaryKey
    .map((column) => `t.${quoteIdentifier(column)}`)
    .join(", ");
  const sql = `SELECT to_jsonb(t)::text AS source_json, jsonb_build_array(${pkExpression})::text AS pk_json FROM ${quoteIdentifier("public")}.${quoteIdentifier(table)} AS t ORDER BY ${orderExpression}`;
  const stream = source.query(
    new QueryStream(sql, [], { batchSize: BATCH_SIZE }),
  ) as unknown as AsyncIterable<StreamRow>;
  const sourceDigest = new DigestAccumulator();
  const seenIds = new Map<string, string>();
  let batch = pb.createBatch();
  let batchCount = 0;
  let imported = 0;

  const flush = async () => {
    if (batchCount === 0) return;
    try {
      await batch.send();
    } catch (error) {
      const status = error instanceof ClientResponseError ? error.status : 0;
      throw new Error(
        `PocketBase batch failed for ${table} near row ${imported} (status ${status})`,
      );
    }
    batch = pb.createBatch();
    batchCount = 0;
  };

  for await (const streamed of stream) {
    const parsed = JSON.parse(streamed.source_json) as Record<string, unknown>;
    const id = recordId(`public.${table}`, streamed.pk_json, parsed.id);
    const previousKey = seenIds.get(id);
    if (previousKey && previousKey !== streamed.pk_json) {
      throw new Error(`Deterministic PocketBase ID collision in ${table}`);
    }
    seenIds.set(id, streamed.pk_json);
    const rowHash = sha256(streamed.source_json);
    sourceDigest.add(rowHash);
    batch.collection(collectionName).upsert({
      id,
      ...typedPayload(parsed, columns),
      migration_source_key: streamed.pk_json,
      migration_source_hash: rowHash,
      migration_source_json: streamed.source_json,
      migration_run_id: migrationRunId,
    });
    batchCount += 1;
    imported += 1;
    if (batchCount >= BATCH_SIZE) await flush();
    if (imported % 10_000 === 0) {
      console.log(`${table}: imported ${imported.toLocaleString("en-US")} rows`);
    }
  }
  await flush();

  await purgeStaleRecords(pb, collectionName, migrationRunId);
  const target = await verifyCollection(pb, collectionName);
  const expectedDigest = sourceDigest.digest();
  if (target.count !== sourceDigest.count || target.digest !== expectedDigest) {
    throw new Error(`Exact count/hash verification failed for ${table}`);
  }
  await applyRuntimeIndexes(pb, await pb.collections.getOne(collection.id));
  console.log(`${table}: verified ${target.count.toLocaleString("en-US")} rows`);
  return {
    name: table,
    targetCollection: collectionName,
    sourceCount: sourceDigest.count,
    targetCount: target.count,
    sourceDigest: expectedDigest,
    targetDigest: target.digest,
  };
}

async function ensureServiceAccount(pb: PocketBase): Promise<void> {
  const email = required("POCKETBASE_SERVICE_EMAIL").toLowerCase();
  const password = pocketBasePassword("POCKETBASE_SERVICE_PASSWORD");
  let existing: RecordModel | null = null;
  try {
    existing = await pb
      .collection("app_services")
      .getFirstListItem(pb.filter("email = {:email}", { email }));
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }
  const payload = {
    email,
    emailVisibility: false,
    verified: true,
    role: "backend",
    password,
    passwordConfirm: password,
  };
  if (existing) {
    await pb.collection("app_services").update(existing.id, payload);
  } else {
    await pb.collection("app_services").create(payload);
  }
}

async function ensureUserMigrationSchema(pb: PocketBase): Promise<void> {
  const users = await pb.collections.getOne("users");
  const expectedFields = new Set([
    "supabase_id",
    "migration_source_json",
    "migration_source_hash",
    "migration_run_id",
  ]);
  for (const name of expectedFields) {
    if (!users.fields.some((field) => field.name === name)) {
      throw new Error(`PocketBase users collection is missing ${name}`);
    }
  }
  const oauthProviders = users.oauth2.providers;
  if (
    users.oauth2.enabled &&
    (oauthProviders.length !== 1 || oauthProviders[0]?.name !== "google")
  ) {
    throw new Error(
      "PocketBase users collection has an unexpected OAuth provider",
    );
  }
  await pb.collections.update(users.id, {
    ...users,
    oauth2: users.oauth2.enabled
      ? {
          ...users.oauth2,
          providers: [
            {
              ...oauthProviders[0],
              clientId: required("GOOGLE_OAUTH_CLIENT_ID", 20),
              clientSecret: required("GOOGLE_OAUTH_CLIENT_SECRET", 16),
            },
          ],
        }
      : users.oauth2,
    listRule: null,
    viewRule: "id = @request.auth.id",
    createRule: null,
    updateRule:
      "id = @request.auth.id" +
      " && @request.body.email:changed = false" +
      " && @request.body.emailVisibility:changed = false" +
      " && @request.body.verified:changed = false" +
      " && @request.body.supabase_id:changed = false" +
      " && @request.body.migration_source_json:changed = false" +
      " && @request.body.migration_source_hash:changed = false" +
      " && @request.body.migration_run_id:changed = false",
    deleteRule: null,
    fields: users.fields.map((field) =>
      field.name === "supabase_id" || field.name === "migration_run_id"
        ? { ...field, required: false }
        : field,
    ),
    indexes: [
      ...users.indexes.filter((index) => !index.includes("idx_users_supabase_id")),
      "CREATE UNIQUE INDEX `idx_users_supabase_id` ON `users` (`supabase_id`) WHERE `supabase_id` != ''",
    ],
  });
}

async function migrateUsers(
  source: pg.Client,
  pb: PocketBase,
  migrationRunId: string,
): Promise<TableMigrationResult> {
  const sql = `
    SELECT
      u.id::text AS supabase_id,
      lower(u.email) AS email,
      coalesce(u.encrypted_password, '') AS encrypted_password,
      (u.email_confirmed_at IS NOT NULL) AS verified,
      coalesce(p.full_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '') AS full_name,
      coalesce(p.avatar_url, u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', '') AS avatar_url,
      coalesce(p.username, '') AS username,
      coalesce(p.website, '') AS website,
      jsonb_build_object(
        'id', u.id,
        'email', lower(u.email),
        'created_at', u.created_at,
        'updated_at', u.updated_at,
        'email_confirmed_at', u.email_confirmed_at,
        'last_sign_in_at', u.last_sign_in_at,
        'is_anonymous', u.is_anonymous,
        'profile', case when p.id is null then null else to_jsonb(p) end,
        'app_metadata', u.raw_app_meta_data,
        'user_metadata', u.raw_user_meta_data
      )::text AS source_json,
      coalesce((
        SELECT jsonb_agg(i.provider_id ORDER BY i.provider_id)
        FROM auth.identities AS i
        WHERE i.user_id = u.id AND i.provider = 'google'
      ), '[]'::jsonb)::text AS google_identities_json,
      EXISTS (
        SELECT 1
        FROM storage.objects AS stored_avatar
        WHERE stored_avatar.owner_id = u.id::text
      ) AS has_stored_avatar
    FROM auth.users AS u
    LEFT JOIN public.profiles AS p ON p.id = u.id
    ORDER BY u.id`;
  const result = await source.query<SourceUserRow>(sql);
  const sourceDigest = new DigestAccumulator();
  let legacyEmailAliases = 0;
  for (let index = 0; index < result.rows.length; index += 1) {
    const user = result.rows[index];
    if (!user.email) throw new Error("A source auth user has no email");
    const targetEmail = toPocketBaseAuthEmail(user.email);
    if (targetEmail !== user.email) legacyEmailAliases += 1;
    const id = recordId("auth.users", user.supabase_id, user.supabase_id);
    const rowHash = sha256(user.source_json);
    sourceDigest.add(rowHash);
    try {
      await pb.send("/internal/migration/users", {
        method: "POST",
        headers: {
          "X-DEETNUTS-MIGRATION-KEY": required("DEETNUTS_MIGRATION_KEY", 32),
        },
        body: {
          id,
          supabase_id: user.supabase_id,
          email: targetEmail,
          verified: user.verified,
          full_name: user.full_name,
          avatar_url: user.has_stored_avatar
            ? "https://www.deetnuts.com/api/account/avatar"
            : safeHttpsUrl(user.avatar_url),
          username: user.username,
          website: safeHttpsUrl(user.website),
          password_hash: user.encrypted_password,
          migration_source_json: user.source_json,
          migration_source_hash: rowHash,
          migration_run_id: migrationRunId,
          google_identities: JSON.parse(user.google_identities_json),
        },
      });
    } catch (error) {
      const status = error instanceof ClientResponseError ? error.status : 0;
      const response =
        error instanceof ClientResponseError
          ? JSON.stringify(error.response).slice(0, 2000)
          : "unknown error";
      throw new Error(
        `PocketBase user import failed at row ${index + 1} (status ${status}): ${response}`,
      );
    }
    if ((index + 1) % 250 === 0) {
      console.log(`users: imported ${index + 1} rows`);
    }
  }

  await purgeStaleRecords(pb, "users", migrationRunId);
  const target = await verifyCollection(pb, "users");
  const expectedDigest = sourceDigest.digest();
  if (target.count !== sourceDigest.count || target.digest !== expectedDigest) {
    throw new Error("Exact count/hash verification failed for users");
  }
  const expectedGoogleIdentities = result.rows.reduce(
    (count, row) => count + (JSON.parse(row.google_identities_json) as unknown[]).length,
    0,
  );
  const googleIdentities = await pb
    .collection("_externalAuths")
    .getFullList({ filter: 'provider = "google"', fields: "id" });
  if (googleIdentities.length !== expectedGoogleIdentities) {
    throw new Error("Google external identity count mismatch");
  }
  console.log(
    `users: verified ${target.count} accounts, ${googleIdentities.length} Google identities, and ${legacyEmailAliases} legacy email aliases`,
  );
  return {
    name: "users",
    targetCollection: "users",
    sourceCount: sourceDigest.count,
    targetCount: target.count,
    sourceDigest: expectedDigest,
    targetDigest: target.digest,
  };
}

async function configureGoogleOAuth(pb: PocketBase): Promise<void> {
  const clientId = required("GOOGLE_OAUTH_CLIENT_ID", 20);
  const clientSecret = required("GOOGLE_OAUTH_CLIENT_SECRET", 16);
  if (!clientId.endsWith(".apps.googleusercontent.com")) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID is malformed");
  }
  const users = await pb.collections.getOne("users");
  if (users.type !== "auth") {
    throw new Error("PocketBase users collection is not an auth collection");
  }
  await pb.collections.update(users.id, {
    ...users,
    oauth2: {
      ...users.oauth2,
      enabled: true,
      mappedFields: {
        id: "",
        name: "full_name",
        username: "username",
        avatarURL: "avatar_url",
      },
      providers: [
        {
          name: "google",
          clientId,
          clientSecret,
          authURL: "",
          tokenURL: "",
          userInfoURL: "",
          displayName: "",
          logo: "",
          pkce: true,
        },
      ],
    },
  });
  const anonymous = new PocketBase(targetUrl());
  const methods = await anonymous.collection("users").listAuthMethods();
  const google = methods.oauth2.providers.find((provider) => provider.name === "google");
  if (!google || new URL(google.authURL).hostname !== "accounts.google.com") {
    throw new Error("PocketBase Google OAuth verification failed");
  }
}

async function ensureStorageCollection(pb: PocketBase): Promise<void> {
  const fields = [
    { type: "text", name: "bucket_id", required: true },
    { type: "text", name: "source_name", required: true },
    { type: "text", name: "owner_id" },
    { type: "text", name: "source_created_at" },
    { type: "text", name: "source_updated_at" },
    { type: "json", name: "source_metadata", maxSize: 1024 * 1024 },
    { type: "number", name: "source_size", onlyInt: true },
    { type: "text", name: "source_sha256", pattern: "^[0-9a-f]{64}$" },
    { type: "file", name: "object", required: true, maxSelect: 1, maxSize: 20 * 1024 * 1024 },
    { type: "text", name: "migration_source_key", required: true },
    { type: "text", name: "migration_source_hash", required: true, pattern: "^[0-9a-f]{64}$" },
    { type: "text", name: "migration_source_json", required: true },
    { type: "text", name: "migration_run_id", required: true, pattern: "^[0-9a-f]{32}$" },
  ];
  const existing = await getCollection(pb, "supabase_storage_objects");
  if (existing) {
    const existingNames = new Set(existing.fields.map((field) => field.name));
    const missing = fields.filter((field) => !existingNames.has(field.name));
    await pb.collections.update(existing.id, {
      ...existing,
      listRule: SERVICE_RULE,
      viewRule: SERVICE_RULE,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [...existing.fields, ...missing],
    });
    return;
  }
  await pb.collections.create({
    type: "base",
    name: "supabase_storage_objects",
    listRule: SERVICE_RULE,
    viewRule: SERVICE_RULE,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields,
    indexes: [
      sqliteIndex("supabase_storage_objects", ["migration_source_key"], true),
    ],
  });
}

function storageObjectUrl(baseUrl: string, bucket: string, name: string): string {
  const path = name.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${path}`;
}

async function migrateStorage(
  source: pg.Client,
  pb: PocketBase,
  migrationRunId: string,
): Promise<TableMigrationResult> {
  await ensureStorageCollection(pb);
  const sourceObjects = await source.query<StorageObjectRow>(`
    SELECT
      id::text,
      bucket_id,
      name,
      owner_id::text,
      created_at::text,
      updated_at::text,
      coalesce(metadata, '{}'::jsonb)::text AS metadata_json,
      to_jsonb(o)::text AS source_json
    FROM storage.objects AS o
    ORDER BY bucket_id, name`);
  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY", 32);
  const sourceDigest = new DigestAccumulator();

  for (const object of sourceObjects.rows) {
    const response = await fetch(
      storageObjectUrl(supabaseUrl, object.bucket_id, object.name),
      {
        headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok) {
      throw new Error(`Unable to download source storage object (${response.status})`);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    const metadata = JSON.parse(object.metadata_json) as Record<string, unknown>;
    const declaredSize = Number(metadata.size ?? bytes.byteLength);
    if (declaredSize !== bytes.byteLength) {
      throw new Error("Source storage object size mismatch");
    }
    const sourceKey = JSON.stringify([object.bucket_id, object.name]);
    const id = pocketBaseId("storage.objects", sourceKey);
    const rowHash = sha256(object.source_json);
    const fileHash = sha256(bytes);
    sourceDigest.add(rowHash);
    const form = new FormData();
    form.set("id", id);
    form.set("bucket_id", object.bucket_id);
    form.set("source_name", object.name);
    form.set("owner_id", object.owner_id || "");
    form.set("source_created_at", object.created_at);
    form.set("source_updated_at", object.updated_at);
    form.set("source_metadata", object.metadata_json);
    form.set("source_size", String(bytes.byteLength));
    form.set("source_sha256", fileHash);
    form.set("migration_source_key", sourceKey);
    form.set("migration_source_hash", rowHash);
    form.set("migration_source_json", object.source_json);
    form.set("migration_run_id", migrationRunId);
    form.set(
      "object",
      new Blob([bytes], {
        type:
          typeof metadata.mimetype === "string"
            ? metadata.mimetype
            : "application/octet-stream",
      }),
      basename(object.name) || "object.bin",
    );
    let record: RecordModel;
    try {
      await pb.collection("supabase_storage_objects").getOne(id);
      record = await pb.collection("supabase_storage_objects").update(id, form);
    } catch (error) {
      if (!isNotFound(error)) throw error;
      record = await pb.collection("supabase_storage_objects").create(form);
    }
    const fileName = String(record.object || "");
    const fileToken = await pb.files.getToken();
    const targetResponse = await fetch(
      pb.files.getURL(record, fileName, { token: fileToken }),
      { signal: AbortSignal.timeout(30_000) },
    );
    if (!targetResponse.ok) throw new Error("Unable to verify target storage object");
    const targetBytes = new Uint8Array(await targetResponse.arrayBuffer());
    if (targetBytes.byteLength !== bytes.byteLength || sha256(targetBytes) !== fileHash) {
      throw new Error("Target storage object byte verification failed");
    }
  }

  await purgeStaleRecords(pb, "supabase_storage_objects", migrationRunId);
  const target = await verifyCollection(pb, "supabase_storage_objects");
  const expectedDigest = sourceDigest.digest();
  if (target.count !== sourceDigest.count || target.digest !== expectedDigest) {
    throw new Error("Exact count/hash verification failed for storage objects");
  }
  console.log(`storage: verified ${target.count} metadata rows and file payloads`);
  return {
    name: "storage.objects",
    targetCollection: "supabase_storage_objects",
    sourceCount: sourceDigest.count,
    targetCount: target.count,
    sourceDigest: expectedDigest,
    targetDigest: target.digest,
  };
}

async function configureTargetForMigration(pb: PocketBase): Promise<void> {
  const settings = await pb.settings.getAll();
  await pb.settings.update({
    meta: {
      ...settings.meta,
      appName: "DEETNUTS",
      appURL: "https://www.deetnuts.com",
      senderName: "DEETNUTS",
      senderAddress: "help@deetnuts.com",
      hideControls: true,
    },
    logs: {
      ...settings.logs,
      maxDataSize: 2048,
      maxDays: 7,
      minLevel: 0,
      logIP: false,
      logAuthId: true,
    },
    backups: {
      ...settings.backups,
      cron: "17 3 * * *",
      cronMaxKeep: 7,
    },
    batch: {
      ...settings.batch,
      enabled: true,
      maxRequests: 500,
      timeout: 120,
      maxBodySize: 64 * 1024 * 1024,
    },
  });
}

async function disableMigrationFeatures(pb: PocketBase): Promise<void> {
  const settings = await pb.settings.getAll();
  await pb.settings.update({
    batch: { ...settings.batch, enabled: false },
  });
}

function combinedDigest(results: TableMigrationResult[], side: "source" | "target") {
  return sha256(
    results
      .map((result) =>
        [
          result.name,
          side === "source" ? result.sourceCount : result.targetCount,
          side === "source" ? result.sourceDigest : result.targetDigest,
        ].join(":"),
      )
      .sort()
      .join("\n"),
  );
}

async function recordTableAudits(
  pb: PocketBase,
  migrationRunId: string,
  results: TableMigrationResult[],
): Promise<void> {
  let batch = pb.createBatch();
  let batchCount = 0;
  for (const result of results) {
    batch.collection("migration_tables").upsert({
      id: pocketBaseId("migration-table", `${migrationRunId}:${result.name}`),
      migration_run_id: migrationRunId,
      source_table: result.name,
      target_collection: result.targetCollection,
      source_records: result.sourceCount,
      target_records: result.targetCount,
      source_digest: result.sourceDigest,
      target_digest: result.targetDigest,
      verified:
        result.sourceCount === result.targetCount &&
        result.sourceDigest === result.targetDigest,
    });
    batchCount += 1;
    if (batchCount >= BATCH_SIZE) {
      await batch.send();
      batch = pb.createBatch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) await batch.send();
}

async function main() {
  if (!process.argv.includes("--execute")) {
    throw new Error("Refusing to migrate without the explicit --execute flag");
  }
  const source = new Client({
    connectionString: required("DIRECT_URL_SUPABASE"),
    ssl: { rejectUnauthorized: false },
    application_name: "deetnuts-pocketbase-migration",
  });
  const pb = await authenticateTarget();
  await source.connect();
  await source.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  try {
    await source.query("SET LOCAL statement_timeout = 0");
    await source.query("SET LOCAL idle_in_transaction_session_timeout = 0");
    await source.query("SET LOCAL lock_timeout = '5s'");
    const snapshot = await source.query<{
      captured_at: string;
      snapshot_id: string;
    }>(
      "SELECT clock_timestamp()::text AS captured_at, txid_current_snapshot()::text AS snapshot_id",
    );
    const snapshotLabel = `${snapshot.rows[0].captured_at} (${snapshot.rows[0].snapshot_id})`;
    const migrationRunId = sha256(snapshotLabel).slice(0, 32);
    console.log(`Source snapshot acquired at ${snapshot.rows[0].captured_at}`);
    await ensureUserMigrationSchema(pb);
    await configureTargetForMigration(pb);
    await ensureServiceAccount(pb);

    const tables = await source.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name`);
    const columns = await source.query<ColumnInfo>(`
      SELECT table_name, column_name, data_type, udt_name, is_nullable, ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position`);
    const primaryKeys = await source.query<PrimaryKeyInfo>(`
      SELECT c.relname AS table_name, to_jsonb(array_agg(a.attname::text ORDER BY k.ordinality)) AS columns
      FROM pg_index AS i
      JOIN pg_class AS c ON c.oid = i.indrelid
      JOIN pg_namespace AS n ON n.oid = c.relnamespace
      JOIN unnest(i.indkey) WITH ORDINALITY AS k(attnum, ordinality) ON true
      JOIN pg_attribute AS a ON a.attrelid = c.oid AND a.attnum = k.attnum
      WHERE n.nspname = 'public' AND i.indisprimary
      GROUP BY c.relname
      ORDER BY c.relname`);
    const columnsByTable = new Map<string, ColumnInfo[]>();
    for (const column of columns.rows) {
      const entries = columnsByTable.get(column.table_name) || [];
      entries.push(column);
      columnsByTable.set(column.table_name, entries);
    }
    const keysByTable = new Map(
      primaryKeys.rows.map((row) => [row.table_name, row.columns]),
    );
    if (tables.rows.length !== columnsByTable.size) {
      throw new Error("Public schema inventory is internally inconsistent");
    }
    const mappedCollectionNames = tables.rows.map(({ table_name }) =>
      targetCollectionName(table_name),
    );
    if (new Set(mappedCollectionNames).size !== mappedCollectionNames.length) {
      throw new Error("Public table names collide after PocketBase normalization");
    }
    for (const reserved of [
      "users",
      "app_services",
      "migration_audit",
      "migration_tables",
      "supabase_storage_objects",
    ]) {
      if (mappedCollectionNames.includes(reserved)) {
        throw new Error(`Public table mapping collides with reserved collection ${reserved}`);
      }
    }

    const results: TableMigrationResult[] = [];
    for (const { table_name: table } of tables.rows) {
      results.push(
        await migrateTable(
          source,
          pb,
          table,
          columnsByTable.get(table) || [],
          keysByTable.get(table) || [],
          migrationRunId,
        ),
      );
    }
    results.push(await migrateUsers(source, pb, migrationRunId));
    results.push(await migrateStorage(source, pb, migrationRunId));
    await configureGoogleOAuth(pb);

    const sourceDigest = combinedDigest(results, "source");
    const targetDigest = combinedDigest(results, "target");
    const sourceRecords = results.reduce((sum, item) => sum + item.sourceCount, 0);
    const targetRecords = results.reduce((sum, item) => sum + item.targetCount, 0);
    if (sourceRecords !== targetRecords || sourceDigest !== targetDigest) {
      throw new Error("Global source/target parity verification failed");
    }
    await recordTableAudits(pb, migrationRunId, results);
    await pb.collection("migration_audit").create({
      source: "supabase",
      migration_run_id: migrationRunId,
      source_snapshot_at: snapshotLabel,
      completed_at: new Date().toISOString(),
      source_records: sourceRecords,
      target_records: targetRecords,
      source_digest: sourceDigest,
      target_digest: targetDigest,
      verified: true,
    });
    const backupBasename = `pre-cutover-${migrationRunId}.zip`;
    await pb.backups.create(backupBasename);
    const backups = await pb.backups.getFullList();
    const backup = backups.find((item) => item.key === backupBasename);
    if (!backup || backup.size <= 0) {
      throw new Error("PocketBase pre-cutover backup verification failed");
    }
    await disableMigrationFeatures(pb);
    await source.query("COMMIT");
    console.log(
      `Migration verified: ${sourceRecords.toLocaleString("en-US")} records, digest ${sourceDigest}`,
    );
  } catch (error) {
    await source.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await source.end();
  }
}

main().catch((error) => {
  const response =
    error instanceof ClientResponseError && Object.keys(error.response).length > 0
      ? `: ${JSON.stringify(error.response).slice(0, 2000)}`
      : "";
  const message =
    error instanceof Error ? `${error.message}${response}` : "Unknown migration failure";
  console.error(`Migration failed: ${message}`);
  process.exitCode = 1;
});
