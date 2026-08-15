import type { ManifestDatasetEntry } from "../lib/manifest.js";

export type ManifestChangeSummary = {
  added: number;
  changed: number;
  retained: number;
  removed: number;
};

export function validateManifestGenerationOptions(options: {
  replace: boolean;
  explicitBaseVersion: string | undefined;
  targetExists: boolean;
}): void {
  if (options.replace && options.explicitBaseVersion) {
    throw new Error("--replace and --base-version cannot be used together");
  }
  if (options.targetExists && !options.replace) {
    throw new Error(
      "target manifest already exists; choose a new version or pass --replace",
    );
  }
}

export function assertManifestRemovalSafe(
  changes: ManifestChangeSummary,
  replace: boolean,
): void {
  if (!replace && changes.removed > 0) {
    throw new Error(
      `manifest generation would remove ${changes.removed} published path(s); use the latest base or pass --replace intentionally`,
    );
  }
}

export function buildManifestDatasets(options: {
  inherited: ManifestDatasetEntry[];
  current: ManifestDatasetEntry[];
}): ManifestDatasetEntry[] {
  return Array.from(
    new Map(
      [...options.inherited, ...options.current].map((entry) => [
        entry.path,
        entry,
      ]),
    ).values(),
  ).sort((left, right) => left.path.localeCompare(right.path));
}

export function summarizeManifestChanges(options: {
  previous: ManifestDatasetEntry[];
  current: ManifestDatasetEntry[];
  next: ManifestDatasetEntry[];
}): ManifestChangeSummary {
  const previousByPath = new Map(
    options.previous.map((entry) => [entry.path, entry]),
  );
  const currentPaths = new Set(options.current.map((entry) => entry.path));
  const nextPaths = new Set(options.next.map((entry) => entry.path));
  let added = 0;
  let changed = 0;
  let retained = 0;
  let removed = 0;

  for (const entry of options.current) {
    const prior = previousByPath.get(entry.path);
    if (!prior) added += 1;
    else if (prior.sha256 !== entry.sha256 || prior.bytes !== entry.bytes) {
      changed += 1;
    }
  }
  for (const entry of options.previous) {
    if (!nextPaths.has(entry.path)) removed += 1;
    else if (!currentPaths.has(entry.path)) retained += 1;
  }
  return { added, changed, retained, removed };
}
