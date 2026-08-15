"use client";

import { quotaRequiresHomeState } from "@ejam/predictors/shared/quota-input";
import { Suspense } from "react";
import { sidebarPanelTopInsetClass } from "@/components/app-layout";
import { AccuracyReportBanner } from "@/components/predictor/accuracy-report-banner";
import { ExamPicker } from "@/components/predictor/exam-picker";
import { HomeStateCombobox } from "@/components/predictor/home-state-combobox";
import { MhtCetProfileFields } from "@/components/predictor/mht-cet/profile-fields";
import { OptionPicker } from "@/components/predictor/option-picker";
import { usePredictor } from "@/components/predictor/predictor-context";
import { RankInput } from "@/components/predictor/rank-input";
import { SidebarFilterSection } from "@/components/predictor/sidebar-filter-section";
import {
  OptionToggle,
  PredictAction,
  SetupField,
} from "@/components/predictor/sidebar-form-controls";
import { useSidebar } from "@/components/ui/sidebar";
import type { CounsellingBody } from "@/hooks/use-predictor-state";
import { isJeeMainCounselling } from "@/hooks/use-predictor-state";
import { cn } from "@/lib/utils";

const sidebarControlClass =
  "transition-colors duration-200 ease-out bg-transparent shadow-none hover:bg-muted dark:bg-transparent dark:hover:bg-muted/50";

const CATEGORIES = [
  { value: "gen", label: "General" },
  { value: "gen-ews", label: "Gen-EWS" },
  { value: "obc-ncl", label: "OBC-NCL" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
];

const GENDERS = [
  { value: "neutral", label: "Neutral" },
  { value: "female", label: "Female" },
];

const QUOTA_OPTIONS = [
  { value: "os", label: "OS" },
  { value: "hs", label: "HS" },
  { value: "ai", label: "AI" },
];

const COUNSELLING_OPTIONS = [
  { value: "josaa", label: "JoSAA" },
  { value: "csab", label: "CSAB" },
];

export function PredictorSidebarPanel() {
  return (
    <Suspense fallback={null}>
      <PredictorSidebarPanelInner />
    </Suspense>
  );
}

function PredictorSidebarPanelInner() {
  const {
    state,
    query,
    onPredict,
    rankInputRef,
    filters,
    setFilters,
    hasResults,
    mhtCetEnabled,
  } = usePredictor();
  const { isMobile, setOpenMobile } = useSidebar();
  const programs = query.data?.programs ?? [];
  const isMhtCet = state.exam === "mht-cet";
  const showQuota = isJeeMainCounselling(state.exam);
  const needsHomeState = showQuota && quotaRequiresHomeState(state.quota);
  const needsMhtHomeUniversity =
    isMhtCet && state.mhtCandidatureType !== "type-e";
  const canPredict =
    Boolean(state.rank) &&
    !(needsHomeState && !state.homeState.trim()) &&
    !(needsMhtHomeUniversity && !state.mhtHomeUniversity.trim());
  const hasPredictedForInputs = query.data !== null;
  const predictDisabled =
    query.isLoading || !canPredict || hasPredictedForInputs;
  const predictDisabledReason = query.isLoading
    ? undefined
    : !state.rank.trim()
      ? isMhtCet
        ? "Enter your MHT-CET merit rank"
        : "Enter your counselling rank"
      : needsHomeState && !state.homeState.trim()
        ? "Select your home state for OS or HS quota"
        : needsMhtHomeUniversity && !state.mhtHomeUniversity.trim()
          ? "Select your home university for Maharashtra candidature"
          : hasPredictedForInputs
            ? "Change rank or profile to predict again"
            : undefined;

  return (
    <div className="flex min-h-full flex-col">
      <div className={cn("px-2 pb-2", sidebarPanelTopInsetClass)}>
        <p className="mb-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Choose exam
        </p>
        <ExamPicker
          value={state.exam}
          onValueChange={state.setExam}
          mhtCetEnabled={mhtCetEnabled}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-2 py-3">
        <SetupField label={isMhtCet ? "MHT-CET merit rank" : "Rank"} required>
          <RankInput
            key={isMhtCet ? "mht-cet-rank" : "jee-rank"}
            ref={rankInputRef}
            value={state.rank}
            onValueChange={state.setRank}
            aria-label={isMhtCet ? "MHT-CET merit rank" : "Rank"}
            emptyErrorMessage={
              isMhtCet
                ? "Enter your MHT-CET merit rank to predict colleges."
                : undefined
            }
          />
        </SetupField>

        {isMhtCet ? (
          <MhtCetProfileFields />
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-2">
            <SetupField label="Category" required>
              <OptionPicker
                value={state.category}
                onValueChange={state.setCategory}
                options={CATEGORIES}
                placeholder="Category"
                triggerClassName={sidebarControlClass}
              />
            </SetupField>
            <SetupField label="Gender" required>
              <OptionToggle
                value={state.gender}
                onChange={state.setGender}
                options={GENDERS}
                columns={2}
              />
            </SetupField>
          </div>
        )}

        {!isMhtCet && showQuota ? (
          <SetupField label="Quota" required>
            <OptionToggle
              value={state.quota}
              onChange={state.setQuota}
              options={QUOTA_OPTIONS}
              columns={3}
            />
          </SetupField>
        ) : null}

        {!isMhtCet && needsHomeState ? (
          <SetupField
            label="Home state"
            required
            hint={
              state.quota === "hs"
                ? "required for HS seat pool"
                : "your domicile state, used to find OS seats"
            }
          >
            <HomeStateCombobox
              value={state.homeState}
              onValueChange={state.setHomeState}
              placeholder="Select home state"
            />
          </SetupField>
        ) : null}

        {!isMhtCet && showQuota ? (
          <SetupField label="Counselling" required>
            <OptionToggle
              value={state.counselling}
              onChange={(value) =>
                state.setCounselling(value as CounsellingBody)
              }
              options={COUNSELLING_OPTIONS}
              columns={2}
            />
          </SetupField>
        ) : null}

        <PredictAction
          sticky={isMhtCet}
          loading={query.isLoading}
          disabled={predictDisabled}
          disabledReason={predictDisabledReason}
          animateLabel={!isMhtCet}
          onPredict={() => {
            void onPredict();
            if (isMobile) setOpenMobile(false);
          }}
        />
      </div>

      {hasResults ? (
        <SidebarFilterSection
          exam={state.exam}
          programs={programs}
          filters={filters}
          onChange={setFilters}
          includeAll={state.include_all}
          onToggleLongShots={() => {
            const next = !state.include_all;
            state.setIncludeAll(next);
            if (isMhtCet) {
              void query.trigger(state.rank, { include_all: next });
            }
          }}
          instituteTypeFacets={query.data?.metadata.facets?.instituteTypes}
          bandFacets={query.data?.metadata.facets?.bands}
        />
      ) : null}

      {!isMhtCet ? <AccuracyReportBanner className="mt-auto" /> : null}
    </div>
  );
}
