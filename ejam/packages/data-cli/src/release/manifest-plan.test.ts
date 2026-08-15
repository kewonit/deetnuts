import { describe, expect, it } from "vitest";
import {
  assertManifestRemovalSafe,
  buildManifestDatasets,
  summarizeManifestChanges,
  validateManifestGenerationOptions,
} from "./manifest-plan";

const entry = (path: string, sha256: string, bytes = 1) => ({
  path,
  sha256,
  bytes,
});

describe("manifest generation plan", () => {
  it("retains inherited paths, overrides matching paths, and sorts output", () => {
    const datasets = buildManifestDatasets({
      inherited: [
        entry("tools/jee.parquet", "old"),
        entry("datasets/a.parquet", "same"),
      ],
      current: [
        entry("tools/mht.parquet", "new"),
        entry("datasets/a.parquet", "replacement", 2),
      ],
    });

    expect(datasets).toEqual([
      entry("datasets/a.parquet", "replacement", 2),
      entry("tools/jee.parquet", "old"),
      entry("tools/mht.parquet", "new"),
    ]);
    expect(
      summarizeManifestChanges({
        previous: [
          entry("tools/jee.parquet", "old"),
          entry("datasets/a.parquet", "same"),
        ],
        current: [
          entry("tools/mht.parquet", "new"),
          entry("datasets/a.parquet", "replacement", 2),
        ],
        next: datasets,
      }),
    ).toEqual({ added: 1, changed: 1, retained: 1, removed: 0 });
  });

  it("reports paths omitted by an explicit replacement", () => {
    const replacement = buildManifestDatasets({
      inherited: [],
      current: [entry("tools/mht.parquet", "new")],
    });
    const changes = summarizeManifestChanges({
      previous: [entry("tools/jee.parquet", "old")],
      current: replacement,
      next: replacement,
    });

    expect(changes).toEqual({
      added: 1,
      changed: 0,
      retained: 0,
      removed: 1,
    });
    expect(() => assertManifestRemovalSafe(changes, false)).toThrow(
      /would remove 1 published path/,
    );
    expect(() => assertManifestRemovalSafe(changes, true)).not.toThrow();
  });

  it("requires explicit replacement for existing targets and forbids mixed modes", () => {
    expect(() =>
      validateManifestGenerationOptions({
        replace: false,
        explicitBaseVersion: undefined,
        targetExists: true,
      }),
    ).toThrow(/already exists/);
    expect(() =>
      validateManifestGenerationOptions({
        replace: true,
        explicitBaseVersion: "v0.2.0",
        targetExists: true,
      }),
    ).toThrow(/cannot be used together/);
    expect(() =>
      validateManifestGenerationOptions({
        replace: true,
        explicitBaseVersion: undefined,
        targetExists: true,
      }),
    ).not.toThrow();
  });
});
