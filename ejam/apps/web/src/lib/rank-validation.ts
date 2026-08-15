import type { PredictorExamId } from "@/lib/predictor-adapters";

export const RANK_LIMITS_DOC_URL =
  "https://github.com/su6u/ejam/blob/main/docs/college-predictor/faqs/faqs.md#what-are-the-rank-limits";

export type RankValidationError =
  | { type: "empty" }
  | { type: "invalid" }
  | { type: "out_of_range"; maxRank: number };

function getMaxRankForExam(predictorExamId: PredictorExamId): number {
  if (predictorExamId === "mht-cet") return 1_000_000;
  return predictorExamId === "jee-advanced" ? 50_000 : 500_000;
}

export function validatePredictorRank(
  rank: string,
  predictorExamId: PredictorExamId,
): RankValidationError | null {
  const trimmed = rank.trim();
  if (!trimmed) return { type: "empty" };

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || String(parsed) !== trimmed || parsed < 1) {
    return { type: "invalid" };
  }

  const maxRank = getMaxRankForExam(predictorExamId);
  if (parsed > maxRank) return { type: "out_of_range", maxRank };

  return null;
}
