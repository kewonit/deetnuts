/**
 * types for manifest-based data dependency resolution
 * manifest pins every published dataset to a sha256 + byte count
 * resolver converts exam config data_dependencies into concrete artifact selections
 */

import { z } from "zod4";

export const ManifestDataset = z.object({
  path: z.string().min(1),
  sha256: z.string().length(64),
  bytes: z.number().int().min(0),
});
export type ManifestDataset = z.infer<typeof ManifestDataset>;

export const Manifest = z.object({
  version: z.string().min(1),
  generated_at: z.string().min(1),
  git_sha: z.string().optional(),
  datasets: z.array(ManifestDataset),
  chunks: z.array(ManifestDataset).optional(),
});
export type Manifest = z.infer<typeof Manifest>;

/** a fully resolved dependency — path confirmed present in manifest */
export type ResolvedDependency = {
  dataset: string;
  path: string;
  sha256: string;
  bytes: number;
};

/** a missing or unresolvable dependency */
export type MissingDependency = {
  dataset: string;
  path_template: string;
  required: boolean;
  reason: string;
};

export type DependencyResolutionResult = {
  exam_id: string;
  manifest_version: string;
  resolved: ResolvedDependency[];
  missing: MissingDependency[];
  /** true only when all required deps resolved — gates release publish */
  publishable: boolean;
};
