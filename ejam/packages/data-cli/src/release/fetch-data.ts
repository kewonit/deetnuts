#!/usr/bin/env tsx
/**
 * verifies local parquet files match the pinned manifest, or downloads a release bundle
 * usage:
 *   pnpm data:fetch              # verify all manifest datasets exist locally
 *   pnpm data:fetch --download   # download release tarball when files are missing
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  dataRootPath,
  findLatestManifestVersion,
  type ManifestDatasetEntry,
  ROOT,
  readManifest,
} from "../lib/manifest.js";

async function sha256File(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function verifyDataset(
  entry: ManifestDatasetEntry,
): Promise<string | null> {
  const absolutePath = dataRootPath(entry.path);
  try {
    await fs.access(absolutePath);
  } catch {
    return `missing: ${entry.path}`;
  }

  const actual = await sha256File(absolutePath);
  if (actual !== entry.sha256) {
    return `checksum mismatch for ${entry.path}: expected ${entry.sha256}, got ${actual}`;
  }
  return null;
}

async function downloadRelease(version: string): Promise<void> {
  const repo = process.env.EJAM_DATA_REPO ?? "su6u/ejam";
  const tag =
    process.env.EJAM_DATA_RELEASE_TAG ?? `data-${version.replace(/^v/, "")}`;
  const url =
    process.env.EJAM_DATA_RELEASE_URL ??
    `https://github.com/${repo}/releases/download/${tag}/${tag}.tar.gz`;

  console.log(`Downloading ${url} ...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `release download failed (${response.status}): ${url}\nSet EJAM_DATA_RELEASE_URL to override.`,
    );
  }

  const archivePath = path.join(ROOT, ".data-release.tar.gz");
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(archivePath, buffer);

  const { execSync } = await import("node:child_process");
  execSync(`tar -xzf "${archivePath}" -C "${path.join(ROOT, "data")}"`, {
    stdio: "inherit",
  });
  await fs.unlink(archivePath);
  console.log("Release extracted into data/");
}

async function main(): Promise<void> {
  const shouldDownload = process.argv.includes("--download");
  const versionArg = process.argv.find((a) => a.startsWith("--version="));
  const version =
    versionArg?.slice("--version=".length) ??
    process.env.EJAM_MANIFEST_VERSION ??
    (await findLatestManifestVersion());

  console.log(`Using manifest ${version}`);
  const manifest = await readManifest(version);
  const failures: string[] = [];

  for (const entry of manifest.datasets) {
    const failure = await verifyDataset(entry);
    if (failure) failures.push(failure);
  }

  if (failures.length === 0) {
    console.log(`✓ all ${manifest.datasets.length} datasets verified`);
    return;
  }

  console.error(`${failures.length} dataset issue(s):`);
  for (const failure of failures) {
    console.error(`  ✗ ${failure}`);
  }

  if (!shouldDownload) {
    console.error(
      "\nRun with --download after publishing a GitHub release, or clone with data files included.",
    );
    process.exit(1);
  }

  await downloadRelease(version);

  const remaining: string[] = [];
  for (const entry of manifest.datasets) {
    const failure = await verifyDataset(entry);
    if (failure) remaining.push(failure);
  }
  if (remaining.length > 0) {
    console.error("Download completed but verification still failed:");
    for (const failure of remaining) {
      console.error(`  ✗ ${failure}`);
    }
    process.exit(1);
  }
  console.log(
    `✓ all ${manifest.datasets.length} datasets verified after download`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
