/**
 * zod types for exam configuration and taxonomy declarations
 * all IDs are slug-format strings — exam-specific enums live in taxonomy YAML, not here
 */

import { z } from "zod4";

export const Slug = z.string().regex(/^[a-z0-9-]+$/, "must be kebab-case slug");

export const TaxonomyValue = z.object({
  id: Slug,
  label: z.string().min(1),
});
export type TaxonomyValue = z.infer<typeof TaxonomyValue>;

export const TaxonomySystem = z.object({
  schema_version: z.number().int().positive(),
  id: Slug,
  name: z.string().min(1),
  description: z.string().min(1),
  values: z.array(TaxonomyValue),
});
export type TaxonomySystem = z.infer<typeof TaxonomySystem>;

export const DataDependency = z.object({
  dataset: z.string().min(1),
  path_template: z.string().min(1),
  // required: if false, missing dep is a warning not a build failure
  required: z.boolean().default(true),
});
export type DataDependency = z.infer<typeof DataDependency>;

export const ExamConfig = z.object({
  schema_version: z.number().int().positive(),
  id: Slug,
  name: z.string().min(1),
  abbreviation: z.string().min(1),
  domain: z.string().min(1),
  conducting_body: z.string().min(1),
  official_url: z.string().url(),

  // refs to taxonomy system IDs — resolved by TaxonomyLoader
  category_system: Slug,
  quota_system: Slug,
  gender_system: Slug,

  counselling_bodies: z.array(Slug).min(1),

  scoring_type: z.enum(["marks", "percentile", "score", "rank"]),
  cutoff_score_type: z.enum(["rank", "percentile", "marks", "score"]),

  data_dependencies: z.array(DataDependency).min(1),
});
export type ExamConfig = z.infer<typeof ExamConfig>;

export type TaxonomyKind =
  | "category-systems"
  | "quota-systems"
  | "gender-systems";

export type ResolvedExamConfig = ExamConfig & {
  /** taxonomy values resolved at load time — validated against declared system IDs */
  resolved_taxonomies: {
    categories: TaxonomySystem;
    quotas: TaxonomySystem;
    genders: TaxonomySystem;
  };
};
