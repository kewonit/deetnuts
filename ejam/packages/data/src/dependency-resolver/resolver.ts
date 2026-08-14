/**
 * data dependency resolver — loads manifest, resolves exam config deps, gates publish
 * Node-only; not imported in browser bundles
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveManifestRoot } from "../data-root";
import type { DataDependency } from "../exam-config/types";
import { expandPathTemplate } from "../paths";
import { pickLatestManifestFile } from "../semver";
import {
  type DependencyResolutionResult,
  Manifest,
  type ManifestDataset,
  type MissingDependency,
  type ResolvedDependency,
} from "./types";

function manifestRoot(): string {
  return resolveManifestRoot();
}

/** load and validate the manifest JSON at the given file path */
export function loadManifest(manifestPath: string): import("./types").Manifest {
  const raw = JSON.parse(readFileSync(manifestPath, "utf-8")) as unknown;
  const result = Manifest.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `manifest at ${manifestPath} failed validation: ${result.error.message}`,
    );
  }
  return result.data;
}

/** load the latest manifest from EJAM_MANIFEST_ROOT — picks highest semver filename */
export function loadLatestManifest(): import("./types").Manifest {
  const root = manifestRoot();
  const latest = pickLatestManifestFile(readdirSync(root));
  if (!latest) {
    throw new Error(`no manifest JSON files found in ${root}`);
  }
  return loadManifest(join(root, latest));
}

/**
 * resolve exam data_dependencies against manifest datasets for a given year
 * round is optional — templates without {round} are resolved at year granularity
 * this is the primary entry point downstream slices should call
 */
export function resolveExamDependencies(opts: {
  examId: string;
  dependencies: DataDependency[];
  manifest: import("./types").Manifest;
  year: number;
  round?: number;
}): DependencyResolutionResult {
  const { examId, dependencies, manifest, year, round } = opts;

  // build O(1) lookup from manifest path → dataset entry
  const byPath = new Map<string, ManifestDataset>(
    manifest.datasets.map((d) => [d.path, d]),
  );

  const resolved: ResolvedDependency[] = [];
  const missing: MissingDependency[] = [];

  for (const dep of dependencies) {
    const vars: Record<string, number> = { year };
    if (round !== undefined) vars.round = round;

    const path = expandPathTemplate(dep.path_template, vars);

    // unresolved placeholders — template still has {tokens} after year substitution
    // when no round is provided, round-keyed deps cannot resolve here; the predictor
    // handles per-round loading itself so these are non-blocking at the route level
    if (/\{[^}]+\}/.test(path)) {
      const hasOnlyRound = !/\{(?!round\})[^}]+\}/.test(path);
      missing.push({
        dataset: dep.dataset,
        path_template: dep.path_template,
        required: dep.required && !(hasOnlyRound && round === undefined),
        reason: `path template has unresolved placeholders after substitution: "${path}"`,
      });
      continue;
    }

    // strip leading "data/" from template paths — manifest paths omit root prefix
    const manifestPath = path.replace(/^data\//, "");
    const entry = byPath.get(manifestPath);

    if (!entry) {
      missing.push({
        dataset: dep.dataset,
        path_template: dep.path_template,
        required: dep.required,
        reason: `path "${manifestPath}" not found in manifest ${manifest.version}`,
      });
      continue;
    }

    resolved.push({
      dataset: dep.dataset,
      path: manifestPath,
      sha256: entry.sha256,
      bytes: entry.bytes,
    });
  }

  const publishable = missing.filter((m) => m.required).length === 0;

  return {
    exam_id: examId,
    manifest_version: manifest.version,
    resolved,
    missing,
    publishable,
  };
}

/**
 * assert all required deps resolve — throws with a descriptive message on failure
 * use in CI / build scripts where a non-zero exit is required
 */
export function assertPublishable(result: DependencyResolutionResult): void {
  if (result.publishable) return;
  const required = result.missing.filter((m) => m.required);
  const lines = required.map((m) => `  [${m.dataset}] ${m.reason}`).join("\n");
  throw new Error(
    `exam ${result.exam_id} is not publishable — ${required.length} required dep(s) missing:\n${lines}`,
  );
}
