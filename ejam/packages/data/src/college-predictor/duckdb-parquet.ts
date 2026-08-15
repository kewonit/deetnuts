/**
 * Server-side Parquet reader for manifest-pinned predictor indexes.
 */

import { readFile } from "node:fs/promises";
// tsx loads this workspace package through CJS in node:test; the package's
// ESM-only root export is therefore unavailable there, so use its node entry.
// @ts-expect-error hyparquet does not expose types for the direct node entry.
import { parquetRead } from "../../node_modules/hyparquet/src/node.js";
import { compressors } from "hyparquet-compressors";

export async function readParquetRows<T = Record<string, unknown>>(
  filePath: string,
): Promise<T[]> {
  const file = await readFile(filePath);
  const arrayBuffer = Uint8Array.from(file).buffer;

  let rows: unknown[] = [];
  await parquetRead({
    file: arrayBuffer,
    rowFormat: "object",
    compressors,
    onComplete: (data: unknown[]) => {
      rows = data;
    },
  });

  return rows as T[];
}
