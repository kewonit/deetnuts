import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  assertMhtCetSourceAccounting,
  canonicalRowsSha256,
  MHT_CET_CUTOFF_SELECT,
  MHT_CET_CUTOFF_SOURCES,
  MHT_CET_EXPECTED_CUTOFF_ROWS,
  MHT_CET_REFERENCE_SOURCES,
} from "./source-spec.js";

const PAGE_SIZE = 1_000;
const MAX_RETRIES = 5;
const REQUEST_TIMEOUT_MS = 30_000;

export type SnapshotTable = {
  table: string;
  rows: Array<Record<string, unknown>>;
  sha256: string;
  sourceCount: number;
};

function retryDelay(attempt: number): number {
  return Math.min(4_000, 250 * 2 ** attempt);
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function parseContentRange(value: string | null): number | null {
  if (!value) return null;
  const match = /\/(\d+)$/.exec(value);
  return match ? Number.parseInt(match[1], 10) : null;
}

async function fetchPage(options: {
  baseUrl: string;
  secretKey: string;
  table: string;
  select: string;
  offset: number;
}): Promise<{
  rows: Array<Record<string, unknown>>;
  sourceCount: number | null;
}> {
  const query = new URLSearchParams({
    select: options.select,
    order: "id.asc",
    offset: String(options.offset),
    limit: String(PAGE_SIZE),
  });
  const url = `${options.baseUrl.replace(/\/$/, "")}/rest/v1/${encodeURIComponent(options.table)}?${query}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      headers: {
        apikey: options.secretKey,
        Authorization: `Bearer ${options.secretKey}`,
        Prefer: "count=exact",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }).catch((error: unknown) => {
      if (attempt === MAX_RETRIES - 1) throw error;
      return null;
    });
    if (!response) {
      await wait(retryDelay(attempt));
      continue;
    }
    if (response.ok) {
      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        throw new Error(`${options.table}: Supabase response was not an array`);
      }
      return {
        rows: data as Array<Record<string, unknown>>,
        sourceCount: parseContentRange(response.headers.get("content-range")),
      };
    }
    if (
      response.status !== 408 &&
      response.status !== 429 &&
      response.status < 500
    ) {
      throw new Error(
        `${options.table}: Supabase request failed with ${response.status}`,
      );
    }
    if (attempt === MAX_RETRIES - 1) {
      throw new Error(
        `${options.table}: Supabase request failed after ${MAX_RETRIES} attempts (${response.status})`,
      );
    }
    await wait(retryDelay(attempt));
  }
  throw new Error(`${options.table}: retry loop exhausted`);
}

export async function fetchAllowlistedTable(options: {
  baseUrl: string;
  secretKey: string;
  table: string;
  select: string;
}): Promise<SnapshotTable> {
  const rows: Array<Record<string, unknown>> = [];
  let sourceCount: number | null = null;
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await fetchPage({ ...options, offset });
    if (sourceCount === null && page.sourceCount !== null) {
      sourceCount = page.sourceCount;
    } else if (
      sourceCount !== null &&
      page.sourceCount !== null &&
      sourceCount !== page.sourceCount
    ) {
      throw new Error(
        `${options.table}: source count changed during pagination (${sourceCount} -> ${page.sourceCount})`,
      );
    }
    rows.push(...page.rows);
    if (page.rows.length < PAGE_SIZE) break;
  }
  if (sourceCount === null) {
    throw new Error(`${options.table}: Supabase omitted exact source count`);
  }
  if (rows.length !== sourceCount) {
    throw new Error(
      `${options.table}: pagination returned ${rows.length} rows but source reported ${sourceCount}`,
    );
  }
  return {
    table: options.table,
    rows,
    sourceCount,
    sha256: canonicalRowsSha256(rows),
  };
}

export async function createMhtCetSnapshot(options: {
  baseUrl: string;
  secretKey: string;
  outputDir: string;
  runId: string;
}): Promise<{
  tables: SnapshotTable[];
  cutoffRows: number;
  reportPath: string;
}> {
  await mkdir(options.outputDir, { recursive: true });
  const tables: SnapshotTable[] = [];
  for (const source of MHT_CET_CUTOFF_SOURCES) {
    const table = await fetchAllowlistedTable({
      baseUrl: options.baseUrl,
      secretKey: options.secretKey,
      table: source.table,
      select: MHT_CET_CUTOFF_SELECT,
    });
    tables.push(table);
  }
  const cutoffCounts = new Map(
    tables.map((table) => [table.table, table.sourceCount]),
  );
  assertMhtCetSourceAccounting(cutoffCounts);

  for (const source of MHT_CET_REFERENCE_SOURCES) {
    tables.push(
      await fetchAllowlistedTable({
        baseUrl: options.baseUrl,
        secretKey: options.secretKey,
        table: source.table,
        select: source.select,
      }),
    );
  }

  for (const table of tables) {
    await writeFile(
      join(options.outputDir, `${table.table}.json`),
      `${JSON.stringify(table.rows)}\n`,
    );
  }
  const reportPath = join(options.outputDir, "snapshot-report.json");
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        schema_version: 1,
        run_id: options.runId,
        cutoff_rows: MHT_CET_EXPECTED_CUTOFF_ROWS,
        tables: tables.map(({ table, sourceCount, sha256 }) => ({
          table,
          source_count: sourceCount,
          canonical_sha256: sha256,
        })),
      },
      null,
      2,
    )}\n`,
  );
  return {
    tables,
    cutoffRows: MHT_CET_EXPECTED_CUTOFF_ROWS,
    reportPath,
  };
}
