#!/usr/bin/env tsx
/**
 * generates data/catalog/releases/v*.json from data/datasets and data/tools
 * run after ingest or index build: pnpm generate:manifest
 * auto-bumps patch semver when --version is omitted; pass --version=vX.Y.Z to pin
 * inherits the latest manifest by default; pass --replace for a full replacement
 */

import * as fs from "node:fs/promises";
import { bumpPatchVersion } from "@ejam/data/semver";
import {
  collectParquetDatasets,
  findLatestManifestVersion,
  getGitSha,
  manifestFilePath,
  readManifest,
  writeManifest,
} from "../lib/manifest.js";
import {
  assertManifestRemovalSafe,
  buildManifestDatasets,
  summarizeManifestChanges,
  validateManifestGenerationOptions,
} from "./manifest-plan.js";

function normalizeVersion(raw: string): string {
  return raw.startsWith("v") ? raw : `v${raw}`;
}

async function resolveManifestVersion(): Promise<string> {
  const explicitArg = process.argv
    .find((a) => a.startsWith("--version="))
    ?.slice("--version=".length);
  if (explicitArg) return normalizeVersion(explicitArg);

  if (process.env.EJAM_MANIFEST_VERSION) {
    return normalizeVersion(process.env.EJAM_MANIFEST_VERSION);
  }

  const latest = await findLatestManifestVersion().catch(() => null);
  if (!latest) return "v0.1.0";
  return bumpPatchVersion(latest);
}

async function main(): Promise<void> {
  const version = await resolveManifestVersion();
  const explicitBaseVersion = process.argv
    .find((argument) => argument.startsWith("--base-version="))
    ?.slice("--base-version=".length);
  const replace = process.argv.includes("--replace");
  let targetExists = true;
  try {
    await fs.access(manifestFilePath(version));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      targetExists = false;
    } else throw error;
  }
  validateManifestGenerationOptions({
    replace,
    explicitBaseVersion,
    targetExists,
  });

  console.log(`Generating catalog release ${version}...`);
  const currentDatasets = await collectParquetDatasets();
  const latestVersion = await findLatestManifestVersion().catch(() => null);
  const baseVersion = explicitBaseVersion
    ? normalizeVersion(explicitBaseVersion)
    : replace
      ? null
      : latestVersion;
  const priorDatasets = latestVersion
    ? (await readManifest(latestVersion)).datasets
    : [];
  const baseDatasets = baseVersion
    ? (await readManifest(baseVersion)).datasets
    : [];
  const datasets = buildManifestDatasets({
    inherited: baseDatasets,
    current: currentDatasets,
  });
  if (datasets.length === 0) {
    throw new Error(
      "No release payloads found under data/datasets or data/tools",
    );
  }

  const changes = summarizeManifestChanges({
    previous: priorDatasets,
    current: currentDatasets,
    next: datasets,
  });
  assertManifestRemovalSafe(changes, replace);
  console.log(
    `Changes: ${changes.added} added, ${changes.changed} changed, ${changes.retained} retained, ${changes.removed} removed`,
  );
  const manifestPath = await writeManifest({
    version,
    generated_at: new Date().toISOString(),
    git_sha: await getGitSha(),
    datasets,
  });

  console.log(`Wrote ${datasets.length} datasets to ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
