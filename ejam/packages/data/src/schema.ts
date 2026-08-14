/**
 * generic canonical schema for shared platform entities
 * all exam-varying axes (quota, category, gender) are slug IDs resolved via taxonomy registry
 * no exam-specific enums live here — those belong in taxonomy YAML files
 */

import { z } from "zod4";

const Slug = z.string().regex(/^[a-z0-9-]+$/);

// Institute and Program registries stay flat JSON — unchanged from prior shape
export const Institute = z.object({
  id: Slug,
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  // type kept as free string — exam-specific classification lives in registry JSON
  type: z.string().min(1),
  state: z.string(),
  city: z.string(),
  established: z.number().int().min(1850).max(2030),
  nirf_rank: z.number().int().min(1).nullable().optional(),
});
export type Institute = z.infer<typeof Institute>;

export const Program = z.object({
  id: Slug,
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  degree: z.string(),
  duration_years: z.number().int().min(3).max(6),
});
export type Program = z.infer<typeof Program>;

/**
 * CutoffRow — generic across all exams
 * opening_value / closing_value replace opening_rank / closing_rank
 * score_type declares how those values should be interpreted
 * quota_id / category_id / gender_id are taxonomy-resolved slugs, not enums
 */
export const CutoffRow = z
  .object({
    year: z.number().int().min(2015).max(2100),
    round: z.number().int().min(1).max(20),
    institute_id: Slug,
    program_id: Slug,
    // taxonomy-resolved IDs — validated by exam config at scrape time, not by enum here
    quota_id: Slug,
    category_id: Slug,
    gender_id: Slug,
    // metric-agnostic: rank, percentile, marks, or raw score depending on exam
    opening_value: z.number().int().min(0),
    closing_value: z.number().int().min(0),
    score_type: z.enum(["rank", "percentile", "marks", "score"]),
    exam_id: Slug,
    // free string — exam config declares allowed sources, scraper validates at write time
    source: z.string().min(1),
    source_id: z.string().min(1).default("unknown"),
    run_id: z.string().min(1).default("unknown"),
    source_locator: z.string().min(1).default("unknown"),
  })
  .refine((r) => r.closing_value >= r.opening_value, {
    // only meaningful for rank (lower = better); skipped when score_type is score/marks/percentile
    // refine kept as a guard for rank rows; exam config layer enforces score_type semantics
    message: "closing_value must be >= opening_value",
    path: ["closing_value"],
  });
export type CutoffRow = z.infer<typeof CutoffRow>;

/**
 * SeatMatrixRow — generic, quota/category/gender as slug IDs
 */
export const SeatMatrixRow = z.object({
  year: z.number().int().min(2015).max(2100),
  institute_id: Slug,
  program_id: Slug,
  quota_id: Slug,
  category_id: Slug,
  gender_id: Slug,
  seats: z.number().int().min(0),
  exam_id: Slug,
  source: z.string().min(1),
});
export type SeatMatrixRow = z.infer<typeof SeatMatrixRow>;
