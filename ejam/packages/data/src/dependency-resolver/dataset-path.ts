/**
 * helpers for resolving manifest-pinned dataset paths at runtime
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type ResolvedDatasetRef = {
  dataset: string;
  path: string;
  sha256: string;
};

import { resolveDataRoot } from "../data-root";

function dataRoot(): string {
  return resolveDataRoot();
}

/** manifest paths omit the data/ prefix — prepend it for filesystem access */
export function manifestPathToDataRoot(manifestPath: string): string {
  return join(dataRoot(), manifestPath);
}

export function findResolvedDataset(
  resolvedDatasets: ResolvedDatasetRef[],
  dataset: string,
): ResolvedDatasetRef | undefined {
  return resolvedDatasets.find((entry) => entry.dataset === dataset);
}

export function assertResolvedDataset(
  resolvedDatasets: ResolvedDatasetRef[],
  dataset: string,
): ResolvedDatasetRef {
  const entry = findResolvedDataset(resolvedDatasets, dataset);
  if (!entry) {
    throw new Error(
      `required dataset "${dataset}" was not resolved — manifest may be stale or predictor_index was not built`,
    );
  }
  return entry;
}

export function verifyDatasetSha256(
  manifestPath: string,
  expectedSha256: string,
): void {
  const absolutePath = manifestPathToDataRoot(manifestPath);
  const bytes = readFileSync(absolutePath);
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== expectedSha256) {
    throw new Error(
      `dataset integrity check failed for ${manifestPath}: expected ${expectedSha256}, got ${actual}`,
    );
  }
}
