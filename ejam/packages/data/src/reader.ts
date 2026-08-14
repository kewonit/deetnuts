// duckdb-wasm reader for parquet files served from /data
// usage (browser/Next.js): const db = await getDb(); await db.query("SELECT * FROM 'data/...parquet'")

import * as duckdb from "@duckdb/duckdb-wasm";

let _dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

async function _initDb(): Promise<duckdb.AsyncDuckDB> {
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker ?? ""}");`], {
      type: "text/javascript",
    }),
  );
  const worker = new Worker(workerUrl);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);
  return db;
}

export function getDb(): Promise<duckdb.AsyncDuckDB> {
  _dbPromise ??= _initDb();
  return _dbPromise;
}

export type QueryResult<T = Record<string, unknown>> = T[];

/** Run an SQL query against parquet files referenced by HTTP URLs. */
export async function query<T = Record<string, unknown>>(
  sql: string,
): Promise<QueryResult<T>> {
  const db = await getDb();
  const conn = await db.connect();
  try {
    const result = await conn.query(sql);
    return result
      .toArray()
      .map((r: { toJSON: () => T }) => r.toJSON()) as QueryResult<T>;
  } finally {
    await conn.close();
  }
}

/** Convenience: register a parquet file URL as a queryable table. */
export async function registerParquet(
  name: string,
  url: string,
): Promise<void> {
  const db = await getDb();
  await db.registerFileURL(name, url, duckdb.DuckDBDataProtocol.HTTP, false);
}
