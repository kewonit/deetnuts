import { z } from "zod4";

export const MhtCetStageSemanticsId = z.enum([
  "standard",
  "ladies-to-male-same-category",
  "pwd-released-to-base-category",
  "defence-released-to-base-category",
  "minority-to-maharashtra",
  "unrestricted-maharashtra-merit",
]);
export type MhtCetStageSemanticsId = z.infer<typeof MhtCetStageSemanticsId>;

export const MhtCetStageCategoryPolicy = z.enum(["source", "any"]);
export const MhtCetStageLadiesPolicy = z.enum([
  "source",
  "non-ladies-only",
  "any",
]);
export const MhtCetStageSpecialPolicy = z.enum(["source", "removed"]);
export const MhtCetStageCandidaturePolicy = z.enum([
  "source",
  "maharashtra-state",
]);

export const MhtCetStageRule = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  source_label: z.string().min(1),
  semantics_id: MhtCetStageSemanticsId,
  source_ladies_requirement: z.enum(["any", "required", "forbidden"]),
  allowed_source_special_eligibilities: z
    .array(
      z.enum(["none", "ews", "tfws", "pwd", "defence", "orphan", "minority"]),
    )
    .min(1),
  effect: z.object({
    category_policy: MhtCetStageCategoryPolicy,
    ladies_policy: MhtCetStageLadiesPolicy,
    special_policy: MhtCetStageSpecialPolicy,
    candidature_policy: MhtCetStageCandidaturePolicy,
  }),
});
export type MhtCetStageRule = z.infer<typeof MhtCetStageRule>;

export const MhtCetStageRuleRegistry = z.object({
  schema_version: z.literal(1),
  source_year: z.number().int().min(2024).max(2100),
  source_id: z.string().min(1),
  source_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  entries: z.array(MhtCetStageRule).min(1),
});
export type MhtCetStageRuleRegistry = z.infer<typeof MhtCetStageRuleRegistry>;

export const MhtCetAllocationRule = z.object({
  id: z.string().regex(/^stage-[ivx]+$/),
  label: z.string().min(1),
  supported_semantics: z.array(MhtCetStageSemanticsId).min(1),
});
export type MhtCetAllocationRule = z.infer<typeof MhtCetAllocationRule>;

export const MhtCetAllocationRuleRegistry = z.object({
  schema_version: z.literal(1),
  rules_year: z.number().int().min(2025).max(2100),
  source_id: z.string().min(1),
  source_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  entries: z.array(MhtCetAllocationRule).min(1),
});
export type MhtCetAllocationRuleRegistry = z.infer<
  typeof MhtCetAllocationRuleRegistry
>;
