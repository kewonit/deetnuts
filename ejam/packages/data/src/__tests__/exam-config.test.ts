import { describe, expect, it } from "vitest";
import { loadExamConfig } from "../exam-config/index";

describe("loadExamConfig", () => {
  it("loads jee-main with resolved taxonomies and dependencies", () => {
    const config = loadExamConfig("jee-main");

    expect(config.id).toBe("jee-main");
    expect(config.resolved_taxonomies.categories.values.length).toBeGreaterThan(
      0,
    );
    expect(config.resolved_taxonomies.quotas.values.length).toBeGreaterThan(0);
    expect(config.resolved_taxonomies.genders.values.length).toBeGreaterThan(0);
    expect(config.data_dependencies.length).toBeGreaterThan(0);
  });

  it("loads jee-advanced without a quota taxonomy", () => {
    const config = loadExamConfig("jee-advanced");

    expect(config.id).toBe("jee-advanced");
    expect(config.resolved_taxonomies.categories.values.length).toBeGreaterThan(
      0,
    );
    expect(config.resolved_taxonomies.quotas.values).toEqual([]);
    expect(config.resolved_taxonomies.genders.values.length).toBeGreaterThan(0);
    expect(config.data_dependencies.length).toBeGreaterThan(0);
  });
});
