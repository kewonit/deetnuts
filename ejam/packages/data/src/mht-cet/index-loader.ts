import { readParquetRows } from "../college-predictor/duckdb-parquet";
import {
  type MhtCetPredictorIndexRow,
  MhtCetPredictorIndexRow as MhtCetPredictorIndexRowSchema,
} from "./schema";

export type MhtCetIndexDeps = {
  resolvedDatasets: Array<{
    dataset: string;
    path: string;
    sha256: string;
  }>;
};

const _indexCache = new Map<string, MhtCetPredictorIndexRow[]>();

const NULLABLE_INDEX_FIELDS = [
  "minority_community_id",
  "round1_rank",
  "round2_rank",
  "round3_rank",
  "round4_rank",
  "round1_percentile",
  "round2_percentile",
  "round3_percentile",
  "round4_percentile",
  "round1_relative_residuals",
  "round2_relative_residuals",
  "round3_relative_residuals",
  "round4_relative_residuals",
  "round1_uncertainty_source",
  "round2_uncertainty_source",
  "round3_uncertainty_source",
  "round4_uncertainty_source",
  "round1_data_quality",
  "round2_data_quality",
  "round3_data_quality",
  "round4_data_quality",
] as const;

function normalizeParquetRow(
  row: Record<string, unknown>,
  index: number,
): Record<string, unknown> {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (typeof value !== "bigint") return [key, value];
      const number = Number(value);
      if (!Number.isSafeInteger(number)) {
        throw new Error(
          `MHT-CET predictor index row ${index} field ${key} exceeds JSON safe-integer range`,
        );
      }
      return [key, number];
    }),
  );
  for (const field of NULLABLE_INDEX_FIELDS) {
    if (normalized[field] === undefined) normalized[field] = null;
  }
  return normalized;
}

export async function getMhtCetPredictorIndexFromDeps(
  deps: MhtCetIndexDeps,
): Promise<MhtCetPredictorIndexRow[]> {
  const { assertResolvedDataset, manifestPathToDataRoot, verifyDatasetSha256 } =
    await import("../dependency-resolver/dataset-path");
  const entry = assertResolvedDataset(deps.resolvedDatasets, "predictor_index");
  const cacheKey = `${entry.path}:${entry.sha256}`;
  const cached = _indexCache.get(cacheKey);
  if (cached) return cached;

  verifyDatasetSha256(entry.path, entry.sha256);
  const filePath = manifestPathToDataRoot(entry.path);
  const rawRows = await readParquetRows(filePath);
  const rows = rawRows.map((row, index) => {
    const parsed = MhtCetPredictorIndexRowSchema.safeParse(
      normalizeParquetRow(row, index),
    );
    if (!parsed.success) {
      throw new Error(
        `MHT-CET predictor index row ${index} failed validation: ${parsed.error.message}`,
      );
    }
    return parsed.data;
  });
  const metadata = rows[0];
  if (!metadata) {
    throw new Error("MHT-CET predictor index is empty");
  }
  for (const [index, row] of rows.entries()) {
    if (
      row.model_id !== metadata.model_id ||
      row.target_year !== metadata.target_year ||
      row.rules_year !== metadata.rules_year
    ) {
      throw new Error(
        `MHT-CET predictor index row ${index} has mixed model or rules metadata`,
      );
    }
    if (row.target_year !== 2026 || row.rules_year !== 2026) {
      throw new Error(
        `MHT-CET predictor index row ${index} does not target the active 2026 rules cycle`,
      );
    }
    if (row.latest_year !== 2025) {
      throw new Error(
        `MHT-CET predictor index row ${index} is not based on the latest 2025 CAP cycle`,
      );
    }
  }
  _indexCache.set(cacheKey, rows);
  return rows;
}

export function _resetMhtCetPredictorIndexCache(): void {
  _indexCache.clear();
}
