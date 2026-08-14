/**
 * browser cache manager for college predictor index buffers and session result lists
 * storage APIs are optional so server-side adapters can import this without browser globals
 **/

export type IndexBufferCacheSource = "indexeddb" | "network";

export interface BrowserCacheEnvironment {
  indexedDB?: IDBFactory;
  sessionStorage?: Storage;
  fetch?: typeof fetch;
  now?: () => number;
}

export interface LoadCollegePredictorIndexBufferOptions {
  sha256: string;
  url: string;
  manifestVersion?: string;
  maxVersions?: number;
  env?: BrowserCacheEnvironment;
}

export interface LoadCollegePredictorIndexBufferResult {
  buffer: ArrayBuffer;
  source: IndexBufferCacheSource;
}

interface IndexCacheRecord {
  key: string;
  sha256: string;
  manifestVersion?: string;
  buffer: ArrayBuffer;
  updatedAt: number;
  lastAccessedAt: number;
}

const DB_NAME = "ejam-college-predictor";
const DB_VERSION = 1;
const STORE_NAME = "index-buffers";
const INDEX_KEY_PREFIX = "index:";
const RESULT_KEY_PREFIX = "results:";
const DEFAULT_MAX_INDEX_VERSIONS = 2;

function now(env?: BrowserCacheEnvironment): number {
  return env?.now?.() ?? Date.now();
}

function browserIndexedDB(
  env?: BrowserCacheEnvironment,
): IDBFactory | undefined {
  return env?.indexedDB ?? globalThis.indexedDB;
}

function browserSessionStorage(
  env?: BrowserCacheEnvironment,
): Storage | undefined {
  return env?.sessionStorage ?? globalThis.sessionStorage;
}

function browserFetch(env?: BrowserCacheEnvironment): typeof fetch | undefined {
  return env?.fetch ?? globalThis.fetch;
}

export function createIndexCacheKey(sha256: string): string {
  return `${INDEX_KEY_PREFIX}${sha256}`;
}

function requestPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function openIndexDb(
  env?: BrowserCacheEnvironment,
): Promise<IDBDatabase | null> {
  const indexedDB = browserIndexedDB(env);
  if (!indexedDB) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function objectStore(
  db: IDBDatabase,
  mode: IDBTransactionMode,
): IDBObjectStore {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

async function getIndexRecord(
  db: IDBDatabase,
  key: string,
): Promise<IndexCacheRecord | null> {
  const record = await requestPromise<IndexCacheRecord | undefined>(
    objectStore(db, "readonly").get(key),
  );
  return record ?? null;
}

async function putIndexRecord(
  db: IDBDatabase,
  record: IndexCacheRecord,
): Promise<void> {
  await requestPromise<IDBValidKey>(objectStore(db, "readwrite").put(record));
}

async function deleteIndexRecord(db: IDBDatabase, key: string): Promise<void> {
  await requestPromise<undefined>(objectStore(db, "readwrite").delete(key));
}

async function getAllIndexRecords(
  db: IDBDatabase,
): Promise<IndexCacheRecord[]> {
  return requestPromise<IndexCacheRecord[]>(
    objectStore(db, "readonly").getAll(),
  );
}

async function evictOldIndexRecords(
  db: IDBDatabase,
  maxVersions: number,
): Promise<void> {
  const records = (await getAllIndexRecords(db))
    .filter((record) => record.key.startsWith(INDEX_KEY_PREFIX))
    .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

  for (const record of records.slice(
    0,
    Math.max(0, records.length - maxVersions),
  )) {
    await deleteIndexRecord(db, record.key);
  }
}

export async function getCachedCollegePredictorIndex(
  sha256: string,
  env?: BrowserCacheEnvironment,
): Promise<ArrayBuffer | null> {
  const db = await openIndexDb(env);
  if (!db) return null;

  const key = createIndexCacheKey(sha256);
  const record = await getIndexRecord(db, key);
  if (!record) return null;

  await putIndexRecord(db, { ...record, lastAccessedAt: now(env) });
  return record.buffer;
}

export async function storeCollegePredictorIndex(options: {
  sha256: string;
  buffer: ArrayBuffer;
  manifestVersion?: string;
  maxVersions?: number;
  env?: BrowserCacheEnvironment;
}): Promise<void> {
  const db = await openIndexDb(options.env);
  if (!db) return;

  const timestamp = now(options.env);
  await putIndexRecord(db, {
    key: createIndexCacheKey(options.sha256),
    sha256: options.sha256,
    ...(options.manifestVersion
      ? { manifestVersion: options.manifestVersion }
      : {}),
    buffer: options.buffer,
    updatedAt: timestamp,
    lastAccessedAt: timestamp,
  });
  await evictOldIndexRecords(
    db,
    options.maxVersions ?? DEFAULT_MAX_INDEX_VERSIONS,
  );
}

export async function loadCollegePredictorIndexBuffer(
  options: LoadCollegePredictorIndexBufferOptions,
): Promise<LoadCollegePredictorIndexBufferResult> {
  const cached = await getCachedCollegePredictorIndex(
    options.sha256,
    options.env,
  );
  if (cached) return { buffer: cached, source: "indexeddb" };

  const fetcher = browserFetch(options.env);
  if (!fetcher) {
    throw new Error("fetch is unavailable for college predictor index loading");
  }

  const response = await fetcher(options.url);
  if (!response.ok) {
    throw new Error(
      `failed to fetch college predictor index: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = await response.arrayBuffer();
  await storeCollegePredictorIndex({
    sha256: options.sha256,
    buffer,
    ...(options.manifestVersion
      ? { manifestVersion: options.manifestVersion }
      : {}),
    maxVersions: options.maxVersions,
    env: options.env,
  });

  return { buffer, source: "network" };
}

function stableNormalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableNormalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, stableNormalize(entry)]),
    );
  }
  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableNormalize(value));
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (const char of value) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createPredictionResultCacheKey(input: unknown): string {
  return `${RESULT_KEY_PREFIX}${fnv1a(stableStringify(input))}`;
}

export function readPredictionResultCache<TProgram>(
  input: unknown,
  env?: BrowserCacheEnvironment,
): TProgram[] | null {
  const storage = browserSessionStorage(env);
  if (!storage) return null;

  const raw = storage.getItem(createPredictionResultCacheKey(input));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as TProgram[]) : null;
  } catch {
    return null;
  }
}

export function writePredictionResultCache<TProgram>(
  input: unknown,
  programs: TProgram[],
  env?: BrowserCacheEnvironment,
): void {
  const storage = browserSessionStorage(env);
  if (!storage) return;

  storage.setItem(
    createPredictionResultCacheKey(input),
    JSON.stringify(programs),
  );
}

export function clearPredictionResultCache(
  input: unknown,
  env?: BrowserCacheEnvironment,
): void {
  browserSessionStorage(env)?.removeItem(createPredictionResultCacheKey(input));
}
