/**
 * zod schemas and path dispatch for structured jee json documents
 */

import { z } from "zod4";

export const SourceId = z.string().min(1);
export const Url = z.string().url();
export const Slug = z.string().regex(/^[a-z0-9-]+$/);

const Cited = z
  .object({
    source: SourceId,
  })
  .passthrough();

export const Source = z
  .object({
    id: SourceId,
    kind: z.enum(["pdf", "html"]),
    exam: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .nullable(),
    year: z.number().int().min(2000).max(2100).nullable(),
    title: z.string().min(1),
    url: Url,
    publisher: z.string().min(1),
  })
  .strict();
export type Source = z.infer<typeof Source>;

export const SourcesRegistry = z
  .object({
    $schema_version: z.number().int().positive(),
    description: z.string().min(1),
    policy: z.object({
      allowed_origins: z.array(z.string().min(1)).min(1),
      disallowed: z.string().min(1),
    }),
    sources: z.array(Source).min(1),
  })
  .strict()
  .refine(
    (r) => new Set(r.sources.map((s) => s.id)).size === r.sources.length,
    { message: "duplicate source.id" },
  );
export type SourcesRegistry = z.infer<typeof SourcesRegistry>;

const ExamFamilyBase = z
  .object({
    id: Slug,
    name: z.string().min(1),
    abbreviation: z.string().min(1),
    conducting_body: z.string().min(1),
    official_url: Url,
  })
  .passthrough();

export const JeeMainExam = ExamFamilyBase;
export type JeeMainExam = z.infer<typeof JeeMainExam>;

export const JeeAdvancedExam = ExamFamilyBase;
export type JeeAdvancedExam = z.infer<typeof JeeAdvancedExam>;

export const SyllabusDocument = Cited.extend({
  description: z.string().min(1),
}).passthrough();

export const ExamCitiesDocument = Cited.extend({
  description: z.string().min(1),
}).passthrough();

export const SubjectDetailsDocument = Cited.extend({
  description: z.string().min(1),
}).passthrough();

export const PoliciesDocument = Cited.extend({
  description: z.string().min(1),
}).passthrough();

export const ProgrammesIndexDocument = Cited.extend({
  description: z.string().min(1),
}).passthrough();

export const IitsCatalog = Cited.extend({
  description: z.string().min(1),
  count: z.number().int().positive(),
  iits: z
    .array(
      z
        .object({
          name: z.string().min(1),
          established: z.number().int().min(1850).max(2030),
          location: z.string().min(1),
        })
        .passthrough(),
    )
    .min(1),
}).refine((d) => d.iits.length === d.count, {
  message: "iits.length must equal count",
  path: ["count"],
});

export const CounsellingAuthority = z
  .object({
    id: Slug,
    name: z.string().min(1),
    abbreviation: z.string().min(1),
    conducting_body: z.string().min(1),
    official_url: Url,
    source: SourceId,
  })
  .passthrough();

export const BusinessRulesDocument = z
  .object({
    description: z.string().min(1),
    source: SourceId,
  })
  .passthrough();

export type FileSchemaEntry = {
  match: RegExp;
  schema: z.ZodTypeAny;
  kind: string;
};

export const FILE_SCHEMAS: readonly FileSchemaEntry[] = [
  {
    match: /\/_sources\.json$/,
    schema: SourcesRegistry,
    kind: "sources-registry",
  },
  {
    match: /\/jee-main\/exam\.json$/,
    schema: JeeMainExam,
    kind: "jee-main-exam",
  },
  {
    match: /\/jee-main\/syllabus\.json$/,
    schema: SyllabusDocument,
    kind: "syllabus",
  },
  {
    match: /\/jee-main\/exam-cities\.json$/,
    schema: ExamCitiesDocument,
    kind: "exam-cities",
  },
  {
    match: /\/jee-advanced\/exam\.json$/,
    schema: JeeAdvancedExam,
    kind: "jee-advanced-exam",
  },
  {
    match: /\/jee-advanced\/subject-details\.json$/,
    schema: SubjectDetailsDocument,
    kind: "subject-details",
  },
  {
    match: /\/jee-advanced\/policies\.json$/,
    schema: PoliciesDocument,
    kind: "policies",
  },
  {
    match: /\/jee-advanced\/programmes\.json$/,
    schema: ProgrammesIndexDocument,
    kind: "programmes-index",
  },
  {
    match: /\/jee-advanced\/iits\.json$/,
    schema: IitsCatalog,
    kind: "iits-catalog",
  },
  {
    match: /\/(josaa|csab)\/authority\.json$/,
    schema: CounsellingAuthority,
    kind: "counselling-authority",
  },
  {
    match: /\/(josaa|csab)\/business-rules\.json$/,
    schema: BusinessRulesDocument,
    kind: "business-rules",
  },
];
