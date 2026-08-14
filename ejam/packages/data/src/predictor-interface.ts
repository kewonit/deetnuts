/**
 * shared predictor interface contract
 * every exam-specific predictor package must satisfy this interface
 * the generic dispatch orchestrator depends only on this shape — never on exam internals
 */

import { z } from "zod4";

export class PredictionInputError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string>) {
    super(message);
    this.name = "PredictionInputError";
    this.fieldErrors = fieldErrors;
  }
}

export const PredictionError = z.object({
  code: z.enum([
    "EXAM_NOT_FOUND",
    "PREDICTOR_NOT_REGISTERED",
    "INVALID_INPUT",
    "DEPENDENCY_UNAVAILABLE",
    "INTERNAL_ERROR",
  ]),
  message: z.string(),
  // field-level detail for INVALID_INPUT — maps field path to issue message
  field_errors: z.record(z.string(), z.string()).optional(),
});
export type PredictionError = z.infer<typeof PredictionError>;

export const PredictionProvenance = z.object({
  exam_id: z.string(),
  manifest_version: z.string(),
  // dataset paths + SHAs used in this prediction — for auditability (user story 7, 14, 28)
  datasets_used: z.array(
    z.object({
      dataset: z.string(),
      path: z.string(),
      sha256: z.string(),
      role: z.enum(["loaded", "linked"]),
    }),
  ),
  index_lineage: z
    .array(z.object({ path: z.string(), sha256: z.string() }))
    .optional(),
  generated_at: z.string(),
});
export type PredictionProvenance = z.infer<typeof PredictionProvenance>;

export const PredictionSuccessResponse = z.object({
  ok: z.literal(true),
  exam_id: z.string(),
  result: z.unknown(),
  provenance: PredictionProvenance,
});
export type PredictionSuccessResponse = z.infer<
  typeof PredictionSuccessResponse
>;

export const PredictionErrorResponse = z.object({
  ok: z.literal(false),
  error: PredictionError,
});
export type PredictionErrorResponse = z.infer<typeof PredictionErrorResponse>;

export type PredictionResponse =
  | PredictionSuccessResponse
  | PredictionErrorResponse;

/**
 * contract every exam predictor module must export
 * input type is exam-specific; result is exam-specific
 * orchestrator calls predict() after loading exam config and resolving deps
 */
export interface ExamPredictor<TInput = unknown, TResult = unknown> {
  inputSchema: z.ZodType<TInput>;
  predict(
    input: TInput,
    deps: {
      resolvedDatasets: Array<{
        dataset: string;
        path: string;
        sha256: string;
      }>;
      examId: string;
    },
  ): Promise<{ result: TResult }>;
}
