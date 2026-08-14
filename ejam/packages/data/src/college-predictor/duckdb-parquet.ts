/**
 * Server-side Parquet reader for manifest-pinned predictor indexes.
 */

import { readFile } from "node:fs/promises";
import { parquetRead } from "hyparquet";
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
    onComplete: (data) => {
      rows = data;
    },
  });

  return rows as T[];
}
