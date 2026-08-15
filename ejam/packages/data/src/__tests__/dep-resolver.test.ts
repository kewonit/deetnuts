import { describe, expect, it } from "vitest";
import {
  loadLatestManifest,
  resolveExamDependencies,
} from "../dependency-resolver/index";
import { loadExamConfig } from "../exam-config/index";

describe("resolveExamDependencies", () => {
  it("resolves jee-main dependencies for 2025 round 1 against latest manifest", () => {
    const config = loadExamConfig("jee-main");
    const manifest = loadLatestManifest();

    const result = resolveExamDependencies({
      examId: config.id,
      dependencies: config.data_dependencies,
      manifest,
      year: 2025,
      round: 1,
    });

    expect(result.exam_id).toBe(config.id);
    expect(result.missing).toEqual([]);
    expect(result.publishable).toBe(true);
    expect(result.resolved.length).toBeGreaterThan(0);
  });
});
