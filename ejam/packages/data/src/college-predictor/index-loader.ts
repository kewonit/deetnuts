/**
 * shared JoSAA/CSAB index loader — loads manifest-pinned predictor_index parquet
 * verifies sha256 before read so provenance declared in the API is enforced at load time
 **/

import { readParquetRows } from "./duckdb-parquet";
import type { CollegePredictorIndexRow } from "./engine";

export type PredictorIndexDeps = {
  resolvedDatasets: Array<{
    dataset: string;
    path: string;
    sha256: string;
  }>;
};

const _indexCache = new Map<string, CollegePredictorIndexRow[]>();

function cacheKeyForDataset(path: string, sha256: string): string {
  return `${path}:${sha256}`;
}

export async function getPredictorIndexFromDeps(
  deps: PredictorIndexDeps,
  dataset = "predictor_index",
): Promise<CollegePredictorIndexRow[]> {
  const { assertResolvedDataset, manifestPathToDataRoot, verifyDatasetSha256 } =
    await import("../dependency-resolver/dataset-path");

  const entry = assertResolvedDataset(deps.resolvedDatasets, dataset);
  const key = cacheKeyForDataset(entry.path, entry.sha256);
  const cached = _indexCache.get(key);
  if (cached) return cached;

  verifyDatasetSha256(entry.path, entry.sha256);
  const filePath = manifestPathToDataRoot(entry.path);
  const rows = await readParquetRows<CollegePredictorIndexRow>(filePath);
  _indexCache.set(key, rows);
  return rows;
}

/** @deprecated use getPredictorIndexFromDeps — kept for scripts that run outside the API */
export async function getJosaaIndex(): Promise<CollegePredictorIndexRow[]> {
  const { join, resolve } = await import("node:path");
  const { resolveDataRoot } = await import("../data-root");
  const indexPath = resolve(
    process.env.EJAM_DIST_DATA_ROOT ??
      join(resolveDataRoot(), "tools", "college-predictor", "josaa"),
    "predictor-index.parquet",
  );
  const rows = await readParquetRows<CollegePredictorIndexRow>(indexPath);
  return rows;
}

/** exposed for tests only — resets the module-level cache */
export function _resetPredictorIndexCache(): void {
  _indexCache.clear();
}

/** @deprecated alias for _resetPredictorIndexCache */
export function _resetJosaaIndexCache(): void {
  _resetPredictorIndexCache();
}
