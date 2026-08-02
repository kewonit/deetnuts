import { z } from "zod";
import { DEFAULT_YEAR } from "./config";

export const STATE_CUTOFF_MAX_REQUEST_BYTES = 64 * 1024;

const boundedFilter = z.string().trim().min(1).max(240);
const scoreInput = z
  .union([z.string().max(32), z.number().finite()])
  .transform((value) => String(value));

export const StateCutoffApiRequestSchema = z.object({
  page: z.number().int().min(1).max(1_000_000).default(1),
  perPage: z.number().int().min(1).max(200).default(25),
  search: z.string().trim().max(200).default(""),
  categories: z.array(boundedFilter).max(100).default([]),
  courses: z.array(boundedFilter).max(200).default([]),
  statuses: z.array(boundedFilter).max(100).default([]),
  homeUniversities: z.array(boundedFilter).max(100).default([]),
  percentileInput: scoreInput.default(""),
  scoreMode: z.enum(["percentile", "rank"]).default("percentile"),
  scoreValue: scoreInput.default(""),
  profile: z.unknown().optional(),
  round: z.number().int().min(1).max(10).default(1),
  year: z.number().int().min(2020).max(2100).default(DEFAULT_YEAR),
  sortBy: z
    .enum([
      "college_name",
      "course_name",
      "last_rank",
      "cutoff_score",
      "total_admitted",
    ])
    .default("last_rank"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  requestKind: z.enum(["search", "pagination", "prefetch"]).default("search"),
});

export type StateCutoffApiRequest = z.infer<
  typeof StateCutoffApiRequestSchema
>;

export function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
