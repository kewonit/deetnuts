import {
  type PredictionProvenance,
  PredictionSuccessResponse,
} from "@ejam/data";
import { decodeJeeResult } from "./jee";
import { decodeMhtResult } from "./mht-cet";
import type { PredictorDisplayResult, PredictorExamId } from "./types";

export * from "./jee";
export * from "./mht-cet";
export * from "./types";

export function decodePredictionSuccess(
  examId: PredictorExamId,
  body: unknown,
): {
  result: PredictorDisplayResult;
  provenance: PredictionProvenance;
} | null {
  const envelope = PredictionSuccessResponse.safeParse(body);
  if (!envelope.success || envelope.data.exam_id !== examId) return null;
  const result =
    examId === "mht-cet"
      ? decodeMhtResult(envelope.data.result)
      : decodeJeeResult(envelope.data.result);
  return result ? { result, provenance: envelope.data.provenance } : null;
}

export function supportedSortModes(
  examId: PredictorExamId,
): ReadonlyArray<"balanced" | "chance" | "closing-rank" | "institute"> {
  return examId === "mht-cet"
    ? ["chance", "closing-rank", "institute"]
    : ["balanced", "chance", "closing-rank", "institute"];
}
