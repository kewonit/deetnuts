/**
 * single entry point for exam configuration kernel
 * downstream slices import from here — not from loader or types directly
 */

export { loadExamConfig, validateExamConfig, validateTaxonomy } from "./loader";
export type {
  DataDependency,
  ExamConfig,
  ResolvedExamConfig,
  TaxonomyKind,
  TaxonomySystem,
  TaxonomyValue,
} from "./types";
