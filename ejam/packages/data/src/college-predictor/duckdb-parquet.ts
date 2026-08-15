/**
 * Server-side Parquet reader for manifest-pinned predictor indexes.
 */

import { readFile } from "node:fs/promises";
import { compressors } from "hyparquet-compressors";

const hyparquet = import("hyparquet");

export async function readParquetRows<T = Record<string, unknown>>(
  filePath: string,
): Promise<T[]> {
  const { parquetRead } = await hyparquet;
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
