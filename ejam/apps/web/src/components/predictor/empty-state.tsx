"use client";

import type { PredictionProvenance } from "@ejam/data";
import type { CollegePredictionResult } from "@ejam/data/college-predictor";
import { formatInteger } from "@/components/formatter";
import { LoadingAnimation } from "@/components/loading-animation";
import { DataVersionFooter } from "@/components/predictor/data-version-footer";
import { LoopIllustration } from "@/components/predictor/loop-illustration";
import { ResultsCardShell } from "@/components/predictor/results-card-shell";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import type { ExamType } from "@/hooks/use-predictor-state";
import { deferAfterPress } from "@/lib/pressable";
import {
  type LoopIllustrationSource,
  PREDICTOR_ILLUSTRATIONS,
} from "@/lib/static-image";

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
  provenance,
}: {
  exam?: ExamType;
  hasPredicted?: boolean;
  metadata?: CollegePredictionResult["metadata"];
  includeAll?: boolean;
  onShowLongShots?: () => void;
  onOpenSetup?: () => void;
  provenance?: PredictionProvenance | null;
}) {
  const showLongShotsAction =
    hasPredicted &&
    !includeAll &&
    (metadata?.hidden_programs ?? 0) > 0 &&
    onShowLongShots;

  return (
    <ResultsCardShell
      description={null}
      footer={<DataVersionFooter provenance={provenance} />}
    >
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
  provenance,
}: {
  message: string;
  provenance?: PredictionProvenance | null;
}) {
  return (
    <ResultsCardShell
      description={null}
      footer={<DataVersionFooter provenance={provenance} />}
    >
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

export function LoadingState({
  provenance,
}: {
  provenance?: PredictionProvenance | null;
}) {
  return (
    <ResultsCardShell
      description={null}
      footer={<DataVersionFooter provenance={provenance} />}
    >
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
