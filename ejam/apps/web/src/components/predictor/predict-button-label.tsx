"use client";

import { cn } from "@/lib/utils";

const LABEL_IDLE = "Predict colleges";
const LABEL_LOADING = "Predicting…";

interface PredictButtonLabelProps {
  loading: boolean;
  className?: string;
  animate?: boolean;
}

/**
 * Both labels stay in the DOM so the button width stays stable during the blur slide.
 */
export function PredictButtonLabel({
  loading,
  className,
  animate = true,
}: PredictButtonLabelProps) {
  if (!animate) {
    return (
      <span className={className} aria-live="polite">
        {loading ? LABEL_LOADING : LABEL_IDLE}
      </span>
    );
  }

  return (
    <span
      className={cn("t-predict-label-swap", className)}
      data-loading={loading ? "true" : "false"}
      aria-live="polite"
    >
      <span className="t-predict-label-layer label-idle" aria-hidden={loading}>
        {LABEL_IDLE}
      </span>
      <span
        className="t-predict-label-layer label-loading"
        aria-hidden={!loading}
      >
        {LABEL_LOADING}
      </span>
    </span>
  );
}
