#!/usr/bin/env tsx
/**
 * packages manifest-pinned datasets into data-X.Y.Z.tar.gz for github releases
 * tarball paths are relative to data/ — matches pnpm data:fetch --download extract
 *
 * usage: pnpm package:data-release --version=v0.1.1
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { DATA_DIR, ROOT, readManifest } from "../lib/manifest.js";

function resolveVersion(): string {
  const arg = process.argv
    .find((a) => a.startsWith("--version="))
    ?.slice("--version=".length);
  const raw = arg ?? process.env.EJAM_MANIFEST_VERSION;
  if (!raw) {
    throw new Error("pass --version=vX.Y.Z or set EJAM_MANIFEST_VERSION");
  }
  return raw.startsWith("v") ? raw : `v${raw}`;
}

async function assertPathsExist(
  manifestVersion: string,
  paths: string[],
): Promise<void> {
  const missing: string[] = [];
  for (const rel of paths) {
    try {
      await fs.access(path.join(DATA_DIR, rel));
    } catch {
      missing.push(rel);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `manifest ${manifestVersion} references ${missing.length} missing file(s):\n${missing.map((p) => `  - ${p}`).join("\n")}`,
    );
  }
}

async function main(): Promise<void> {
  const version = resolveVersion();
  const manifest = await readManifest(version);
  const manifestRel = `catalog/releases/${version}.json`;
  const archivePaths = [...manifest.datasets.map((d) => d.path), manifestRel];

  await assertPathsExist(version, archivePaths);

  const tagVersion = version.replace(/^v/, "");
  const archiveName = `data-${tagVersion}.tar.gz`;
  const archivePath = path.join(ROOT, archiveName);

  const quotedPaths = archivePaths.map((p) => JSON.stringify(p)).join(" ");
  execSync(
    `tar -czf ${JSON.stringify(archivePath)} -C ${JSON.stringify(DATA_DIR)} ${quotedPaths}`,
    {
      stdio: "inherit",
    },
  );

  const stat = await fs.stat(archivePath);
  console.log(
    `Wrote ${archiveName} (${(stat.size / 1024 / 1024).toFixed(2)} MB, ${archivePaths.length} paths)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
