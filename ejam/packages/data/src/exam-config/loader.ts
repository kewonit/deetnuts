/**
 * exam config loader — reads YAML files from data/reference/taxonomy, validates, resolves taxonomies
 * Node-only; not imported in browser bundles (reader.ts handles browser side)
 */

import { readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { load as parseYaml } from "js-yaml";
import { resolveTaxonomyRoot } from "../data-root";
import type {
  ExamConfig,
  ResolvedExamConfig,
  TaxonomyKind,
  TaxonomySystem,
} from "./types";
import {
  ExamConfig as ExamConfigSchema,
  Slug,
  TaxonomySystem as TaxonomySystemSchema,
} from "./types";

/** resolve taxonomy root from env or default to repo-relative data/reference/taxonomy */
function taxonomyRoot(): string {
  return resolve(resolveTaxonomyRoot());
}

function assertSlug(value: string, label: string): void {
  const result = Slug.safeParse(value);
  if (!result.success) {
    throw new Error(`${label} must be a kebab-case slug`);
  }
}

function resolveContainedPath(root: string, ...segments: string[]): string {
  const resolvedRoot = resolve(root);
  const filePath = resolve(resolvedRoot, ...segments);
  const rel = relative(resolvedRoot, filePath);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(
      `resolved path escapes taxonomy root: ${segments.join("/")}`,
    );
  }
  return filePath;
}

function readYaml(filePath: string, root: string): unknown {
  const resolvedRoot = resolve(root);
  const resolvedPath = resolve(filePath);
  const rel = relative(resolvedRoot, resolvedPath);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error("refusing to read YAML outside taxonomy root");
  }
  const raw = readFileSync(filePath, "utf-8");
  return parseYaml(raw);
}

function loadTaxonomy(kind: TaxonomyKind, id: string): TaxonomySystem {
  assertSlug(id, "taxonomy id");
  const root = taxonomyRoot();
  const filePath = resolveContainedPath(root, kind, `${id}.yaml`);
  const raw = readYaml(filePath, root);
  const result = TaxonomySystemSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `taxonomy ${kind}/${id}.yaml failed validation: ${result.error.message}`,
    );
  }
  // id in file must match the requested id — prevents mis-named files silently passing
  if (result.data.id !== id) {
    throw new Error(
      `taxonomy ${kind}/${id}.yaml declares id "${result.data.id}" but filename expects "${id}"`,
    );
  }
  return result.data;
}

function loadExamYaml(examId: string): ExamConfig {
  assertSlug(examId, "exam id");
  const root = taxonomyRoot();
  const filePath = resolveContainedPath(root, "exams", `${examId}.yaml`);
  const raw = readYaml(filePath, root);
  const result = ExamConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `exam config ${examId}.yaml failed validation: ${result.error.message}`,
    );
  }
  if (result.data.id !== examId) {
    throw new Error(
      `exam config ${examId}.yaml declares id "${result.data.id}" but filename expects "${examId}"`,
    );
  }
  return result.data;
}

/**
 * load and fully resolve an exam config — throws on any validation or taxonomy mismatch
 * this is the single entry point downstream slices should use
 */
export function loadExamConfig(examId: string): ResolvedExamConfig {
  const config = loadExamYaml(examId);

  const categories = loadTaxonomy("category-systems", config.category_system);
  const quotas = loadTaxonomy("quota-systems", config.quota_system);
  const genders = loadTaxonomy("gender-systems", config.gender_system);

  return {
    ...config,
    resolved_taxonomies: { categories, quotas, genders },
  };
}

/**
 * validate an exam config without resolving taxonomy files
 * useful for CI checks that only have the exam YAML and not the full registry
 */
export function validateExamConfig(raw: unknown): ExamConfig {
  const result = ExamConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`exam config validation failed: ${result.error.message}`);
  }
  return result.data;
}

/**
 * validate a taxonomy YAML object — used in build-time data contract checks
 */
export function validateTaxonomy(raw: unknown): TaxonomySystem {
  const result = TaxonomySystemSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`taxonomy validation failed: ${result.error.message}`);
  }
  return result.data;
}
