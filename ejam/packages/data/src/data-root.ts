/**
 * resolve repo data/ from process.cwd() — Next.js dev runs with cwd at apps/web
 */

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

let cachedDataRoot: string | null = null;

/** for tests only */
export function _resetDataRootCache(): void {
  cachedDataRoot = null;
}

function hasCatalogDir(dataDir: string): boolean {
  return existsSync(join(dataDir, "catalog", "releases"));
}

function hasTaxonomyDir(dataDir: string): boolean {
  return existsSync(join(dataDir, "reference", "taxonomy", "exams"));
}

function isValidDataRoot(dataDir: string): boolean {
  return hasCatalogDir(dataDir) || hasTaxonomyDir(dataDir);
}

export function resolveDataRoot(): string {
  if (process.env.EJAM_DATA_ROOT) {
    cachedDataRoot = resolve(
      /* turbopackIgnore: true */ process.cwd(),
      process.env.EJAM_DATA_ROOT,
    );
    return cachedDataRoot;
  }
  if (cachedDataRoot) return cachedDataRoot;

  let dir = process.cwd();
  for (let depth = 0; depth < 8; depth++) {
    const candidate = join(/* turbopackIgnore: true */ dir, "data");
    if (isValidDataRoot(candidate)) {
      cachedDataRoot = candidate;
      return candidate;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }

  return join(/* turbopackIgnore: true */ process.cwd(), "data");
}

export function resolveManifestRoot(): string {
  return (
    process.env.EJAM_MANIFEST_ROOT ??
    join(resolveDataRoot(), "catalog", "releases")
  );
}

export function resolveRegistryRoot(): string {
  return process.env.EJAM_REGISTRY_ROOT ?? join(resolveDataRoot(), "reference");
}

export function resolveTaxonomyRoot(): string {
  return (
    process.env.EJAM_TAXONOMY_ROOT ??
    join(resolveDataRoot(), "reference", "taxonomy")
  );
}
