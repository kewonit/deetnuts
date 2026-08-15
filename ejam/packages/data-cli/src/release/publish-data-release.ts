#!/usr/bin/env tsx
/**
 * publishes a manifest-pinned data tarball to GitHub Releases from local data/
 *
 * usage: pnpm publish:data-release -- --version=v0.1.1
 */

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { REPO_ROOT } from "../repo-root.js";

function normalizeVersion(raw: string): string {
  return raw.startsWith("v") ? raw : `v${raw}`;
}

function resolveVersion(): string {
  const arg = process.argv
    .find((a) => a.startsWith("--version="))
    ?.slice("--version=".length);
  const raw = arg ?? process.env.EJAM_MANIFEST_VERSION;
  if (!raw) {
    throw new Error("pass --version=vX.Y.Z or set EJAM_MANIFEST_VERSION");
  }
  return normalizeVersion(raw);
}

function run(command: string, args: string[]): void {
  execFileSync(command, args, { cwd: REPO_ROOT, stdio: "inherit" });
}

function capture(command: string, args: string[]): string {
  return execFileSync(command, args, {
    cwd: REPO_ROOT,
    encoding: "utf-8",
  }).trim();
}

function repoFromRemote(remote: string): string | null {
  const httpsMatch = remote.match(
    /github\.com[:/](?<owner>[^/]+)\/(?<repo>[^/.]+)(?:\.git)?$/,
  );
  if (httpsMatch?.groups) {
    return `${httpsMatch.groups.owner}/${httpsMatch.groups.repo}`;
  }
  return null;
}

function resolveRepo(): string {
  if (process.env.EJAM_DATA_REPO) return process.env.EJAM_DATA_REPO;

  try {
    const remote = capture("git", ["remote", "get-url", "origin"]);
    return repoFromRemote(remote) ?? "su6u/ejam";
  } catch {
    return "su6u/ejam";
  }
}

function resolveTarget(): string | null {
  const arg = process.argv
    .find((a) => a.startsWith("--target="))
    ?.slice("--target=".length);
  if (arg) return arg;
  if (process.env.EJAM_DATA_RELEASE_TARGET) {
    return process.env.EJAM_DATA_RELEASE_TARGET;
  }

  try {
    return capture("git", ["branch", "--show-current"]) || null;
  } catch {
    return null;
  }
}

function releaseNotes(version: string): string {
  return [
    `Catalog release: data/catalog/releases/${version}.json`,
    "",
    "This release contains the manifest-pinned data tarball for local, CI, and Vercel builds.",
    "",
    "Use:",
    "",
    "```bash",
    "pnpm data:fetch --download",
    "```",
  ].join("\n");
}

function releaseExists(repo: string, tag: string): boolean {
  try {
    execFileSync("gh", ["release", "view", tag, "--repo", repo], {
      cwd: REPO_ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function main(): void {
  const version = resolveVersion();
  const tagVersion = version.replace(/^v/, "");
  const tag = `data-${tagVersion}`;
  const archivePath = path.join(REPO_ROOT, `${tag}.tar.gz`);
  const repo = resolveRepo();
  const target = resolveTarget();
  const notes = releaseNotes(version);

  console.log(`Verifying manifest ${version}...`);
  run("pnpm", ["data:fetch", `--version=${version}`]);

  console.log(`Packaging ${tag}.tar.gz...`);
  run("pnpm", ["package:data-release", `--version=${version}`]);

  if (!fs.existsSync(archivePath)) {
    throw new Error(`expected archive was not created: ${archivePath}`);
  }

  console.log(`Publishing ${tag}.tar.gz to ${repo}...`);
  run("gh", ["auth", "status", "--hostname", "github.com"]);

  if (releaseExists(repo, tag)) {
    run("gh", [
      "release",
      "upload",
      tag,
      archivePath,
      "--repo",
      repo,
      "--clobber",
    ]);
  } else {
    const createArgs = [
      "release",
      "create",
      tag,
      archivePath,
      "--repo",
      repo,
      "--title",
      `Data ${version}`,
      "--notes",
      notes,
    ];
    if (target) createArgs.push("--target", target);
    run("gh", createArgs);
  }

  run("gh", [
    "release",
    "edit",
    tag,
    "--repo",
    repo,
    "--title",
    `Data ${version}`,
    "--notes",
    notes,
  ]);

  console.log(`Published GitHub Release ${tag}`);
}

main();
