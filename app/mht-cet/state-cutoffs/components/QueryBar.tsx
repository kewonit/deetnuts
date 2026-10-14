"use client";

import { memo, useId, type ChangeEvent } from "react";
import MhtPill from "@/components/admissions/MhtPill";
import {
  MHT_CET_CANDIDATURE_OPTIONS,
  MHT_CET_CATEGORY_OPTIONS,
  MHT_CET_HOME_UNIVERSITIES,
  type MhtCetCandidatureType,
  type MhtCetCategoryId,
  type MhtCetHomeUniversityId,
} from "@/lib/mht-cet/state-cutoffs/candidate-profile";

type ScoreMode = "percentile" | "rank";
type HomeUniversity = MhtCetHomeUniversityId | "type-e";

export type QueryStep = "score" | "university" | "candidature" | "category" | "ladies";

const UNIVERSITY_OPTIONS: Array<{ value: HomeUniversity; label: string; short?: string }> = [
  ...MHT_CET_HOME_UNIVERSITIES.map((option) => ({ value: option.id, label: option.label })),
  { value: "type-e", label: "None — Type E border-area candidate", short: "None (Type E)" },
];

const CANDIDATURE_OPTIONS = MHT_CET_CANDIDATURE_OPTIONS.filter(({ value }) => value !== "type-e").map(
  (option) => ({ value: option.value, label: `${option.label} — ${option.description}`, short: option.label }),
);

const LADIES_OPTIONS = [
  { value: "yes", label: "Eligible" },
  { value: "no", label: "Not eligible" },
] as const;

// The first field still needed before results can load, in the order the bar reads.
export function nextQueryStep({
  scoreReady,
  homeUniversity,
  candidature,
  category,
  ladies,
}: {
  scoreReady: boolean;
  homeUniversity: HomeUniversity | "";
  candidature: MhtCetCandidatureType | "";
  category: MhtCetCategoryId | "";
  ladies: boolean | null;
}): QueryStep | null {
  if (!scoreReady) return "score";
  if (!homeUniversity) return "university";
  if (homeUniversity !== "type-e" && (!candidature || candidature === "type-e")) return "candidature";
  if (!category) return "category";
  if (ladies === null) return "ladies";
  return null;
}

export const QueryBar = memo(function QueryBar({
  scoreMode,
  score,
  scoreInvalid,
  homeUniversity,
  candidature,
  category,
  ladies,
  step,
  onScoreModeChange,
  onScoreChange,
  onHomeUniversityChange,
  onCandidatureChange,
  onCategoryChange,
  onLadiesChange,
}: {
  scoreMode: ScoreMode;
  score: string;
  scoreInvalid: boolean;
  homeUniversity: HomeUniversity | "";
  candidature: MhtCetCandidatureType | "";
  category: MhtCetCategoryId | "";
  ladies: boolean | null;
  step: QueryStep | null;
  onScoreModeChange: (mode: ScoreMode) => void;
  onScoreChange: (value: string) => void;
  onHomeUniversityChange: (value: HomeUniversity) => void;
  onCandidatureChange: (value: MhtCetCandidatureType) => void;
  onCategoryChange: (value: MhtCetCategoryId) => void;
  onLadiesChange: (value: boolean) => void;
}) {
  const scoreId = useId();

  function handleScore(event: ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    if (value === "") return onScoreChange("");
    if (scoreMode === "rank") {
      if (/^\d{1,7}$/.test(value) && Number(value) >= 1) onScoreChange(value);
      return;
    }
    if (/^(100(\.0*)?|\d{0,2}(\.\d{0,10})?)$/.test(value)) onScoreChange(value);
  }

  return (
    <div className="mht-query" role="group" aria-label="Your profile">
      <div
        className="mht-score"
        data-filled={score && !scoreInvalid ? "" : undefined}
        data-invalid={scoreInvalid ? "" : undefined}
        data-attention={step === "score" && !score ? "" : undefined}
      >
        <label className="mht-score-field" htmlFor={scoreId}>
          <span className="mht-score-label">{scoreMode === "rank" ? "Your rank" : "Your percentile"}</span>
          <input
            id={scoreId}
            type="text"
            inputMode={scoreMode === "rank" ? "numeric" : "decimal"}
            placeholder={scoreMode === "rank" ? "e.g. 4500" : "e.g. 97.5"}
            value={score}
            onChange={handleScore}
            autoComplete="off"
            maxLength={scoreMode === "rank" ? 7 : 14}
          />
        </label>
        {score ? (
          <button type="button" className="mht-score-clear" aria-label="Clear score" onClick={() => onScoreChange("")}>
            ×
          </button>
        ) : null}
        <div className="mht-seg" role="group" aria-label="Score type">
          <button type="button" aria-pressed={scoreMode === "rank"} onClick={() => onScoreModeChange("rank")}>
            Rank
          </button>
          <button
            type="button"
            aria-pressed={scoreMode === "percentile"}
            onClick={() => onScoreModeChange("percentile")}
          >
            Percentile
          </button>
        </div>
      </div>
      <div className="mht-query-pills">
        <MhtPill
          label="Home university"
          value={homeUniversity}
          emptyLabel="Choose"
          options={UNIVERSITY_OPTIONS}
          onChange={(value) => value && onHomeUniversityChange(value as HomeUniversity)}
          attention={step === "university"}
          wide
        />
        {homeUniversity !== "type-e" ? (
          <MhtPill
            label="Candidature"
            value={candidature === "type-e" ? "" : candidature}
            emptyLabel="Choose"
            options={CANDIDATURE_OPTIONS}
            onChange={(value) => value && onCandidatureChange(value as MhtCetCandidatureType)}
            attention={step === "candidature"}
          />
        ) : null}
        <MhtPill
          label="Category"
          value={category}
          emptyLabel="Choose"
          options={MHT_CET_CATEGORY_OPTIONS}
          onChange={(value) => value && onCategoryChange(value as MhtCetCategoryId)}
          attention={step === "category"}
        />
        <MhtPill
          label="Ladies seats"
          value={ladies === null ? "" : ladies ? "yes" : "no"}
          emptyLabel="Choose"
          options={LADIES_OPTIONS}
          onChange={(value) => value && onLadiesChange(value === "yes")}
          attention={step === "ladies"}
        />
      </div>
    </div>
  );
});

export function queryStepMessage(step: QueryStep, scoreMode: ScoreMode, scoreInvalid: boolean): string {
  switch (step) {
    case "score":
      if (scoreInvalid) {
        return scoreMode === "rank" ? "Enter a whole-number rank, 1 or higher." : "Enter a percentile from 0 to 100.";
      }
      return scoreMode === "rank" ? "Enter your rank." : "Enter your percentile.";
    case "university":
      return "Choose your home university.";
    case "candidature":
      return "Choose your candidature type.";
    case "category":
      return "Choose your category.";
    case "ladies":
      return "Choose ladies-seat eligibility.";
  }
}
