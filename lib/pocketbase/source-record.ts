import { createHash } from "node:crypto";

const RESERVED_SOURCE_FIELDS = [
  "id",
  "created",
  "updated",
  "collectionId",
  "collectionName",
  "expand",
] as const;

const MIGRATION_FIELDS = new Set([
  "migration_source_key",
  "migration_source_hash",
  "migration_source_json",
  "migration_run_id",
]);

const PASSTHROUGH_COLLECTIONS = new Set([
  "users",
  "app_services",
  "migration_audit",
  "migration_tables",
  "supabase_storage_objects",
  "bot_usage_events",
  "bot_processed_events",
]);

const targetToSource = new Map(
  RESERVED_SOURCE_FIELDS.map((name) => [sourceTargetField(name), name]),
);

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function sourceTargetField(name: string): string {
  const reserved = RESERVED_SOURCE_FIELDS.find(
    (field) => field.toLowerCase() === name.toLowerCase(),
  );
  if (!reserved) return name;
  return `source_reserved_${name}_${sha256(name).slice(0, 10)}`;
}

export function isMigratedSourceCollection(name: string): boolean {
  return !PASSTHROUGH_COLLECTIONS.has(name);
}

export function translateSourceFilter(filter?: string): string | undefined {
  if (!filter) return filter;
  return filter.replace(
    /(^|[\s(])([A-Za-z][A-Za-z0-9_]*)(?=\s*(?:=|!=|>=|<=|>|<|~))/g,
    (match, prefix: string, field: string) =>
      `${prefix}${sourceTargetField(field)}`,
  );
}

export function translateSourceSort(sort?: string): string | undefined {
  if (!sort) return sort;
  return sort
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      const descending = trimmed.startsWith("-");
      const field = descending ? trimmed.slice(1) : trimmed;
      return `${descending ? "-" : ""}${sourceTargetField(field)}`;
    })
    .join(",");
}

function selectedFields(fields?: string): string[] | null {
  if (!fields || fields.trim() === "*") return null;
  const selected = fields
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);
  return selected.every((field) => /^[A-Za-z][A-Za-z0-9_]*$/.test(field))
    ? selected
    : null;
}

export function translateSourceFields(fields?: string): string | undefined {
  const selected = selectedFields(fields);
  if (!selected) return fields;
  return [
    ...new Set([...selected.map(sourceTargetField), "migration_source_json"]),
  ].join(",");
}

function projectRecord(
  record: Record<string, unknown>,
  fields?: string,
): Record<string, unknown> {
  const selected = selectedFields(fields);
  if (!selected) return record;
  return Object.fromEntries(
    selected
      .filter((field) => Object.hasOwn(record, field))
      .map((field) => [field, record[field]]),
  );
}

export function restoreSourceRecord(
  record: Record<string, unknown>,
  fields?: string,
): Record<string, unknown> {
  const sourceJson = record.migration_source_json;
  if (typeof sourceJson === "string" && sourceJson) {
    const parsed = JSON.parse(sourceJson) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("PocketBase migration source row is not a JSON object");
    }
    return projectRecord(parsed as Record<string, unknown>, fields);
  }

  const restored: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (MIGRATION_FIELDS.has(key)) continue;
    if (["collectionId", "collectionName", "expand"].includes(key)) continue;
    restored[targetToSource.get(key) || key] = value;
  }
  return projectRecord(restored, fields);
}
