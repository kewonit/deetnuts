/**
 * runtime reader for index lineage sidecars — Node-only
 * sidecars are written at index build time; cutoffs appear as linked provenance
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod4";
import { resolveDataRoot } from "../data-root";

const IndexLineageEntry = z.object({
  path: z.string(),
  sha256: z.string(),
});

const IndexLineageReference = IndexLineageEntry.extend({
  dataset: z.string(),
});

export const IndexLineage = z.object({
  index_dataset: z.string(),
  built_at: z.string(),
  manifest_version: z.string().optional(),
  source_cutoffs: z.array(IndexLineageEntry),
  source_references: z.array(IndexLineageReference).optional(),
  model_configuration: IndexLineageEntry.optional(),
});
export type IndexLineage = z.infer<typeof IndexLineage>;

function dataRoot(): string {
  return resolveDataRoot();
}

export function readIndexLineageSidecar(
  indexManifestPath: string,
): IndexLineage | null {
  const sidecarPath = indexManifestPath.replace(/\.parquet$/, ".lineage.json");
  const absolute = join(dataRoot(), sidecarPath);
  if (!existsSync(absolute)) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(absolute, "utf-8"));
  } catch {
    return null;
  }
  const parsed = IndexLineage.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
