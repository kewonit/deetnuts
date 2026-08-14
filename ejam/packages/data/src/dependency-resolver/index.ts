/**
 * single entry point for data dependency resolution and manifest gating
 * downstream slices import from here — not from resolver or types directly
 */

export {
  assertResolvedDataset,
  findResolvedDataset,
  manifestPathToDataRoot,
  type ResolvedDatasetRef,
  verifyDatasetSha256,
} from "./dataset-path";
export {
  type IndexLineage,
  readIndexLineageSidecar,
} from "./index-lineage";
export { buildPredictionProvenance } from "./provenance";
export {
  assertPublishable,
  loadLatestManifest,
  loadManifest,
  resolveExamDependencies,
} from "./resolver";
export type {
  DependencyResolutionResult,
  Manifest,
  ManifestDataset,
  MissingDependency,
  ResolvedDependency,
} from "./types";
