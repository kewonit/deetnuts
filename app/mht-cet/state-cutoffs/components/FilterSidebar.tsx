"use client";

import { memo, type ReactNode } from "react";
import MhtPill from "@/components/admissions/MhtPill";
import { MhtOptionList, type MhtOptions } from "@/components/admissions/MhtOptions";
import { cn } from "@/lib/utils";
import {
  MHT_CET_MINORITY_OPTIONS,
  type MhtCetCandidatureType,
  type MhtCetCategoryId,
  type MhtCetMinorityCommunityId,
} from "@/lib/mht-cet/state-cutoffs/candidate-profile";
import { COURSE_GROUPS, HOME_UNIVERSITY_OPTIONS, STATUS_OPTIONS } from "../constants";

export interface FilterSidebarProps {
  candidatureType: MhtCetCandidatureType | "";
  candidateCategory: MhtCetCategoryId | "";
  ewsEligible: boolean;
  tfwsEligible: boolean;
  pwdEligible: boolean;
  orphanEligible: boolean;
  minorityCommunity: MhtCetMinorityCommunityId | "";
  categories: string[];
  courses: string[];
  statuses: string[];
  universities: string[];
  eligibleSeatPoolGroups: Record<string, string[]>;
  onEwsEligibleChange: (value: boolean) => void;
  onTfwsEligibleChange: (value: boolean) => void;
  onPwdEligibleChange: (value: boolean) => void;
  onOrphanEligibleChange: (value: boolean) => void;
  onMinorityCommunityChange: (value: MhtCetMinorityCommunityId | "") => void;
  onCategoriesChange: (value: string[]) => void;
  onCoursesChange: (value: string[]) => void;
  onStatusesChange: (value: string[]) => void;
  onUniversitiesChange: (value: string[]) => void;
  onClearAll: () => void;
  activeFilterCount: number;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

function Section({
  title,
  count,
  open = false,
  children,
}: {
  title: string;
  count?: number;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="mht-side-section" open={open}>
      <summary>
        <span>{title}</span>
        {count ? <span className="mht-side-count">{count}</span> : null}
      </summary>
      <div className="mht-side-body">{children}</div>
    </details>
  );
}

function Toggle({
  label,
  checked,
  disabled = false,
  reason,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  reason?: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="mht-check" title={disabled ? reason : undefined}>
      <input
        type="checkbox"
        checked={checked && !disabled}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

const MINORITY_OPTIONS = MHT_CET_MINORITY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
  short: option.label.replace(/^(Linguistic|Religious) minority — /, ""),
}));

export const FilterSidebar = memo(function FilterSidebar({
  candidatureType,
  candidateCategory,
  ewsEligible,
  tfwsEligible,
  pwdEligible,
  orphanEligible,
  minorityCommunity,
  categories,
  courses,
  statuses,
  universities,
  eligibleSeatPoolGroups,
  onEwsEligibleChange,
  onTfwsEligibleChange,
  onPwdEligibleChange,
  onOrphanEligibleChange,
  onMinorityCommunityChange,
  onCategoriesChange,
  onCoursesChange,
  onStatusesChange,
  onUniversitiesChange,
  onClearAll,
  activeFilterCount,
  header,
  footer,
  className,
}: FilterSidebarProps) {
  const typeE = candidatureType === "type-e";
  const canUseMinority = candidatureType === "type-a" || candidatureType === "type-b";
  const reservations =
    [ewsEligible && candidateCategory === "open", tfwsEligible, pwdEligible && !typeE, orphanEligible].filter(
      Boolean,
    ).length + (minorityCommunity && canUseMinority ? 1 : 0);
  const hasSeatPools = Object.keys(eligibleSeatPoolGroups).length > 0;

  return (
    <div className={cn("mht-side", className)}>
      {header}
      <div className="mht-side-scroll">
        <Section title="Reservations" count={reservations} open>
          <div className="mht-checks">
            <Toggle
              label="EWS"
              checked={ewsEligible}
              disabled={candidateCategory !== "open"}
              reason="Open category only"
              onChange={onEwsEligibleChange}
            />
            <Toggle label="TFWS" checked={tfwsEligible} onChange={onTfwsEligibleChange} />
            <Toggle label="PwD" checked={pwdEligible} disabled={typeE} reason="Not for Type E" onChange={onPwdEligibleChange} />
            <Toggle label="Orphan" checked={orphanEligible} onChange={onOrphanEligibleChange} />
          </div>
          <MhtPill
            label="Minority"
            value={canUseMinority ? minorityCommunity : ""}
            emptyLabel="None"
            options={MINORITY_OPTIONS}
            onChange={(value) => onMinorityCommunityChange(value as MhtCetMinorityCommunityId | "")}
            disabled={!canUseMinority}
            wide
          />
        </Section>
        <Section title="Courses" count={courses.length} open>
          <MhtOptionList options={COURSE_GROUPS as MhtOptions} selected={courses} onChange={onCoursesChange} />
        </Section>
        {hasSeatPools ? (
          <Section title="Seat pools" count={categories.length}>
            <MhtOptionList options={eligibleSeatPoolGroups} selected={categories} onChange={onCategoriesChange} />
          </Section>
        ) : null}
        <Section title="College status" count={statuses.length}>
          <MhtOptionList options={STATUS_OPTIONS} selected={statuses} onChange={onStatusesChange} />
        </Section>
        <Section title="Affiliation" count={universities.length}>
          <MhtOptionList options={HOME_UNIVERSITY_OPTIONS} selected={universities} onChange={onUniversitiesChange} />
        </Section>
      </div>
      {footer ??
        (activeFilterCount > 0 ? (
          <div className="mht-side-foot">
            <button type="button" className="mht-btn mht-btn-sm mht-btn-ghost" onClick={onClearAll}>
              Reset all
            </button>
          </div>
        ) : null)}
    </div>
  );
});
