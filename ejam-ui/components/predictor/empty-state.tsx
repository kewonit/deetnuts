"use client";

import type { CollegePredictionResult } from "@ejam/data/college-predictor";
import { formatInteger } from "@/ejam-ui/components/formatter";
import { LoadingAnimation } from "@/ejam-ui/components/loading-animation";
import { LoopIllustration } from "@/ejam-ui/components/predictor/loop-illustration";
import { ResultsCardShell } from "@/ejam-ui/components/predictor/results-card-shell";
import { Button } from "@/ejam-ui/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/ejam-ui/components/ui/empty";
import type { ExamType } from "@/ejam-ui/hooks/use-predictor-state";
import { deferAfterPress } from "@/ejam-ui/lib/pressable";
import {
  type LoopIllustrationSource,
  PREDICTOR_ILLUSTRATIONS,
} from "@/ejam-ui/lib/static-image";

const emptyStateActionClass =
  "rounded-none border-border bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground dark:bg-transparent dark:hover:bg-transparent";

export function getEmptyStateDescription({
  hasPredicted,
  metadata,
  exam,
}: {
  hasPredicted: boolean;
  metadata?: CollegePredictionResult["metadata"];
  exam?: ExamType;
}): string {
  if (!hasPredicted) {
    if (exam === "mht-cet") {
      return "MHT-CET is selected. Add your CAP merit rank and complete your candidature profile to see Maharashtra engineering options.";
    }
    return "Pick an exam, enter your rank, then run Predict colleges to see options ranked by admission chance.";
  }

  if (metadata && metadata.hidden_programs > 0) {
    return `Nothing clears our 10% chance cutoff at this rank. ${formatInteger(metadata.hidden_programs)} "doesn't matter yaar" picks are hidden. Try a better (lower) rank to see likely options.`;
  }

  if (metadata && metadata.total_matching_programs === 0) {
    return "No seats match your category, gender, and quota at this rank.";
  }

  return "No colleges with a meaningful chance at this rank. Try a better (lower) rank.";
}

function StateIllustration({
  src,
  priority,
}: {
  src: LoopIllustrationSource;
  priority?: boolean;
}) {
  return (
    <EmptyMedia className="mb-0 aspect-square w-full max-w-72">
      <LoopIllustration src={src} priority={priority} />
    </EmptyMedia>
  );
}

export function EmptyState({
  exam,
  hasPredicted = false,
  metadata,
  includeAll = false,
  onShowLongShots,
  onOpenSetup,
}: {
  exam?: ExamType;
  hasPredicted?: boolean;
  metadata?: CollegePredictionResult["metadata"];
  includeAll?: boolean;
  onShowLongShots?: () => void;
  onOpenSetup?: () => void;
}) {
  const showLongShotsAction =
    hasPredicted &&
    !includeAll &&
    (metadata?.hidden_programs ?? 0) > 0 &&
    onShowLongShots;

  return (
    <ResultsCardShell description={null}>
      <Empty>
        <EmptyHeader>
          <StateIllustration src={PREDICTOR_ILLUSTRATIONS.empty} priority />
          <EmptyDescription>
            {getEmptyStateDescription({ hasPredicted, metadata, exam })}
          </EmptyDescription>
        </EmptyHeader>
        {showLongShotsAction ? (
          <EmptyContent>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={emptyStateActionClass}
              onClick={() => deferAfterPress(onShowLongShots)}
            >
              Show doesn't matter yaar
            </Button>
          </EmptyContent>
        ) : onOpenSetup ? (
          <EmptyContent>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={emptyStateActionClass}
              onClick={() => deferAfterPress(onOpenSetup)}
            >
              {exam === "mht-cet"
                ? "Set up MHT-CET prediction"
                : "Set up prediction"}
            </Button>
          </EmptyContent>
        ) : (
          <EmptyContent />
        )}
      </Empty>
    </ResultsCardShell>
  );
}

export function ErrorState({
  message,
}: {
  message: string;
}) {
  return (
    <ResultsCardShell description={null}>
      <Empty className="min-h-0" role="alert">
        <EmptyHeader className="my-auto">
          <StateIllustration src={PREDICTOR_ILLUSTRATIONS.error} />
          <EmptyDescription>
            <span className="mb-1 block font-heading text-sm font-medium tracking-tight text-foreground">
              Prediction failed
            </span>
            {message}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </ResultsCardShell>
  );
}

export function LoadingState() {
  return (
    <ResultsCardShell description={null}>
      <Empty role="status" aria-live="polite" aria-busy="true">
        <EmptyHeader>
          <EmptyMedia className="mb-0 bg-transparent">
            <LoadingAnimation className="size-8" aria-hidden />
          </EmptyMedia>
          <EmptyDescription>Loading predictions…</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </ResultsCardShell>
  );
}
