import { formatInteger } from "@/components/formatter";
import {
  RANK_LIMITS_DOC_URL,
  type RankValidationError,
} from "@/lib/rank-validation";

const learnMoreClassName =
  "underline decoration-dotted underline-offset-2 hover:text-destructive/80";

export function RankInputErrorMessage({
  error,
  emptyMessage = "Enter your JEE rank to predict colleges.",
}: {
  error: RankValidationError;
  emptyMessage?: string;
}) {
  if (error.type === "empty") {
    return <>{emptyMessage}</>;
  }

  if (error.type === "invalid") {
    return <>Enter a valid counselling rank (whole number, 1 or higher).</>;
  }

  return (
    <>
      Predictor only covers ranks up to {formatInteger(error.maxRank)}.{" "}
      <a
        href={RANK_LIMITS_DOC_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={learnMoreClassName}
      >
        Learn more
      </a>
    </>
  );
}
