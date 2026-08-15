/**
 * build-time lineage sidecars for predictor index parquets
 * records which cutoff files DuckDB consumed so runtime provenance need not hash 60+ cutoffs per request
 * readIndexLineageSidecar lives in @ejam/data — this module handles writes only
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import type { IndexLineage } from "@ejam/data/dependency-resolver";
import { DATA_DIR, findLatestManifestVersion } from "./manifest.js";

export type { IndexLineage };

export function lineageSidecarPath(indexParquetPath: string): string {
  return indexParquetPath.replace(/\.parquet$/, ".lineage.json");
}

export function sha256File(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function toManifestRelativePath(absolutePath: string): string {
  const rel = path.relative(DATA_DIR, absolutePath);
  if (rel.startsWith("..")) {
    throw new Error(`cutoff path outside data/: ${absolutePath}`);
  }
  return rel.split(path.sep).join("/");
}

export function collectSourceCutoffs(
  cutoffAbsolutePaths: string[],
): IndexLineage["source_cutoffs"] {
  return cutoffAbsolutePaths
    .map((absolutePath) => ({
      path: toManifestRelativePath(absolutePath),
      sha256: sha256File(absolutePath),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function writeIndexLineageSidecar(opts: {
  indexParquetPath: string;
  indexDataset: string;
  sourceCutoffPaths: string[];
  sourceReferences?: Array<{ dataset: string; path: string }>;
  modelConfigurationPath?: string;
  manifestVersion?: string;
}): string {
  const sidecarPath = lineageSidecarPath(opts.indexParquetPath);
  const lineage: IndexLineage = {
    index_dataset: opts.indexDataset,
    built_at: new Date().toISOString(),
    manifest_version: opts.manifestVersion,
    source_cutoffs: collectSourceCutoffs(opts.sourceCutoffPaths),
    ...(opts.sourceReferences
      ? {
          source_references: opts.sourceReferences
            .map((reference) => ({
              dataset: reference.dataset,
              path: toManifestRelativePath(reference.path),
              sha256: sha256File(reference.path),
            }))
            .sort((a, b) =>
              `${a.dataset}:${a.path}`.localeCompare(`${b.dataset}:${b.path}`),
            ),
        }
      : {}),
    ...(opts.modelConfigurationPath
      ? {
          model_configuration: {
            path: toManifestRelativePath(opts.modelConfigurationPath),
            sha256: sha256File(opts.modelConfigurationPath),
          },
        }
      : {}),
  };
  fs.writeFileSync(sidecarPath, `${JSON.stringify(lineage, null, 2)}\n`);
  return sidecarPath;
}

export async function resolveManifestVersionForBuild(): Promise<
  string | undefined
> {
  try {
    return await findLatestManifestVersion();
  } catch {
    return undefined;
  }
}
