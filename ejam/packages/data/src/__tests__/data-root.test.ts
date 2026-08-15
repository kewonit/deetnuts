import { existsSync } from "node:fs";
import { join } from "node:path";
import { chdir } from "node:process";
import { afterEach, describe, expect, it } from "vitest";
import { _resetDataRootCache, resolveDataRoot } from "../data-root";

describe("resolveDataRoot", () => {
  const originalCwd = process.cwd();
  const repoRoot = join(originalCwd, "..", "..");
  const originalEnv = process.env.EJAM_DATA_ROOT;

  afterEach(() => {
    chdir(originalCwd);
    _resetDataRootCache();
    if (originalEnv === undefined) {
      delete process.env.EJAM_DATA_ROOT;
    } else {
      process.env.EJAM_DATA_ROOT = originalEnv;
    }
  });

  it("walks up from a package cwd to repo data/", () => {
    delete process.env.EJAM_DATA_ROOT;
    chdir(join(repoRoot, "packages", "data"));
    expect(resolveDataRoot()).toBe(join(repoRoot, "data"));
  });

  it("prefers apps/web/data when staged predictor assets exist", () => {
    delete process.env.EJAM_DATA_ROOT;
    chdir(join(repoRoot, "apps", "web"));
    const appData = join(repoRoot, "apps", "web", "data");
    if (
      !existsSync(join(appData, "catalog", "releases")) &&
      !existsSync(join(appData, "reference", "taxonomy", "exams"))
    ) {
      expect(resolveDataRoot()).toBe(join(repoRoot, "data"));
      return;
    }
    expect(resolveDataRoot()).toBe(appData);
  });
});
