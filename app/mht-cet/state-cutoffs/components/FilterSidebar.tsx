"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { type ChangeEvent, type ElementType, type ReactNode } from "react";
import {
  ChevronDown,
  GraduationCap,
  Building2,
  Users,
  MapPin,
  Percent,
  RotateCcw,
  Calendar,
  Layers,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  MHT_CET_CANDIDATURE_OPTIONS,
  MHT_CET_CATEGORY_OPTIONS,
  MHT_CET_HOME_UNIVERSITIES,
  MHT_CET_MINORITY_OPTIONS,
  type MhtCetCandidatureType,
  type MhtCetCategoryId,
  type MhtCetHomeUniversityId,
  type MhtCetMinorityCommunityId,
} from "@/lib/mht-cet/state-cutoffs/candidate-profile";
import {
  COURSE_GROUPS,
  STATUS_OPTIONS,
  HOME_UNIVERSITY_OPTIONS,
  YEAR_OPTIONS,
  ROUND_OPTIONS,
  ROUNDS_BY_YEAR,
} from "../constants";

export interface FilterSidebarProps {
  percentile: string;
  year: number;
  round: number;
  categories: string[];
  courses: string[];
  statuses: string[];
  universities: string[];
  scoreMode: "percentile" | "rank";
  rank: string;
  candidateHomeUniversity: MhtCetHomeUniversityId | "type-e" | "";
  candidatureType: MhtCetCandidatureType | "";
  candidateCategory: MhtCetCategoryId | "";
  ladiesSeatEligible: boolean | null;
  ewsEligible: boolean;
  tfwsEligible: boolean;
  pwdEligible: boolean;
  orphanEligible: boolean;
  minorityCommunity: MhtCetMinorityCommunityId | "";
  eligibleSeatPoolGroups: Record<string, string[]>;
  onPercentileChange: (value: string) => void;
  onYearChange: (value: number) => void;
  onRoundChange: (value: number) => void;
  onCategoriesChange: (value: string[]) => void;
  onCoursesChange: (value: string[]) => void;
  onStatusesChange: (value: string[]) => void;
  onUniversitiesChange: (value: string[]) => void;
  onScoreModeChange: (value: "percentile" | "rank") => void;
  onRankChange: (value: string) => void;
  onCandidateHomeUniversityChange: (
    value: MhtCetHomeUniversityId | "type-e",
  ) => void;
  onCandidatureChange: (value: MhtCetCandidatureType) => void;
  onCandidateCategoryChange: (value: MhtCetCategoryId) => void;
  onLadiesSeatEligibleChange: (value: boolean) => void;
  onEwsEligibleChange: (value: boolean) => void;
  onTfwsEligibleChange: (value: boolean) => void;
  onPwdEligibleChange: (value: boolean) => void;
  onOrphanEligibleChange: (value: boolean) => void;
  onMinorityCommunityChange: (
    value: MhtCetMinorityCommunityId | "",
  ) => void;
  onClearAll: () => void;
  activeFilterCount: number;
  headerActions?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const YearRoundSelector = memo(function YearRoundSelector({
  year,
  round,
  onYearChange,
  onRoundChange,
}: {
  year: number;
  round: number;
  onYearChange: (v: number) => void;
  onRoundChange: (v: number) => void;
}) {
  const allowedRounds = ROUNDS_BY_YEAR[year] ?? [1];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          Year
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {YEAR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onYearChange(opt.value)}
              className={cn(
                "relative h-10 rounded-lg font-semibold text-sm transition-all duration-150",
                "border hover:scale-[1.01] active:scale-[0.99]",
                year === opt.value
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50",
              )}
            >
              {opt.label}
              {year === opt.value && (
                <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Layers className="h-3.5 w-3.5" />
          Round
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {ROUND_OPTIONS.map((opt) => {
            const isDisabled = !allowedRounds.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => !isDisabled && onRoundChange(opt.value)}
                disabled={isDisabled}
                className={cn(
                  "relative h-9 rounded-lg font-semibold text-sm transition-all duration-150",
                  "border",
                  isDisabled
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : round === opt.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:scale-[1.01] active:scale-[0.99]",
                )}
              >
                R{opt.value}
                {round === opt.value && !isDisabled && (
                  <Check className="absolute right-1 top-1/2 -translate-y-1/2 h-3.5 w-3.5" />
                )}
              </button>
            );
          })}
        </div>
        {year === 2024 && (
          <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
            Rounds 1–3 available for 2024
          </p>
        )}
        {year === 2025 && (
          <p className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            Rounds 1–4 available for 2025
          </p>
        )}
      </div>
    </div>
  );
});

const PercentileInput = memo(function PercentileInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const numValue = parseFloat(value) || 0;

  const handleSliderChange = useCallback(
    (vals: number[]) => {
      onChange(vals[0].toFixed(2));
    },
    [onChange],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === "") {
        onChange("");
        return;
      }
      const regex = /^(100(\.0{0,10})?|[0-9]{1,2}(\.\d{0,10})?|\.)$/;
      if (regex.test(val)) {
        const numVal = parseFloat(val);
        if (isNaN(numVal) || (numVal >= 0 && numVal <= 100)) {
          onChange(val);
        }
      }
    },
    [onChange],
  );

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
        <Percent className="h-3.5 w-3.5" />
        Your Percentile
      </Label>
      <div className="relative">
        <Input
          type="text"
          placeholder="Enter percentile (e.g., 95.5)"
          value={value}
          onChange={handleInputChange}
          className={cn(
            "h-11 text-base font-semibold text-center pr-8",
            "border border-gray-300 focus:border-purple-500 rounded-lg",
            "transition-all duration-150",
            value ? "bg-purple-50 border-purple-300" : "bg-white",
          )}
          maxLength={14}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
          %
        </span>
      </div>
      <Slider
        value={[numValue]}
        onValueChange={handleSliderChange}
        max={100}
        min={0}
        step={0.1}
        className="py-1"
      />
      {value && (
        <div className="text-xs text-gray-600 bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
          Showing cutoffs from <span className="font-semibold">0%</span> to{" "}
          <span className="font-semibold">{value}%</span>
        </div>
      )}
    </div>
  );
});

const RankInput = memo(function RankInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === "") {
        onChange("");
        return;
      }
      const regex = /^\d{0,7}$/;
      const numericRank = Number(val);
      if (
        regex.test(val) &&
        numericRank >= 1 &&
        numericRank <= 1_000_000
      ) {
        onChange(val);
      }
    },
    [onChange],
  );

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
        <Layers className="h-3.5 w-3.5" />
        Your MHT-CET Merit Rank
      </Label>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Enter merit rank (e.g., 1234)"
        value={value}
        onChange={handleInputChange}
        className="h-11 text-base font-semibold text-center border border-gray-300 focus:border-blue-500 rounded-lg"
        maxLength={7}
      />
    </div>
  );
});

const ScoreModeTabs = memo(function ScoreModeTabs({
  mode,
  onChange,
}: {
  mode: "percentile" | "rank";
  onChange: (mode: "percentile" | "rank") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
      {[
        { value: "rank" as const, label: "Rank" },
        { value: "percentile" as const, label: "Percentile" },
      ].map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "h-9 rounded-md text-sm font-semibold transition-all",
            mode === opt.value
              ? "bg-white shadow-sm border border-gray-300 text-gray-900"
              : "text-gray-600 hover:text-gray-800",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
});

const profileSelectTriggerClassName =
  "h-auto min-h-11 items-start gap-3 bg-white py-3 text-left text-gray-950 [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:break-words [&>span]:leading-5";
const profileSelectContentClassName =
  "z-[140] max-w-[calc(100vw-2rem)] bg-white text-gray-950";
const profileSelectItemClassName =
  "items-start py-2.5 pr-3 text-gray-950 focus:bg-purple-100 focus:text-gray-950 [&>span:last-child]:whitespace-normal [&>span:last-child]:break-words [&>span:last-child]:leading-5";

const CandidateProfileSetup = memo(function CandidateProfileSetup({
  candidateHomeUniversity,
  candidatureType,
  candidateCategory,
  ladiesSeatEligible,
  ewsEligible,
  tfwsEligible,
  pwdEligible,
  orphanEligible,
  minorityCommunity,
  onCandidateHomeUniversityChange,
  onCandidatureChange,
  onCandidateCategoryChange,
  onLadiesSeatEligibleChange,
  onEwsEligibleChange,
  onTfwsEligibleChange,
  onPwdEligibleChange,
  onOrphanEligibleChange,
  onMinorityCommunityChange,
}: Pick<
  FilterSidebarProps,
  | "candidateHomeUniversity"
  | "candidatureType"
  | "candidateCategory"
  | "ladiesSeatEligible"
  | "ewsEligible"
  | "tfwsEligible"
  | "pwdEligible"
  | "orphanEligible"
  | "minorityCommunity"
  | "onCandidateHomeUniversityChange"
  | "onCandidatureChange"
  | "onCandidateCategoryChange"
  | "onLadiesSeatEligibleChange"
  | "onEwsEligibleChange"
  | "onTfwsEligibleChange"
  | "onPwdEligibleChange"
  | "onOrphanEligibleChange"
  | "onMinorityCommunityChange"
>) {
  const hasUniversity = candidateHomeUniversity !== "";
  const hasCandidature =
    candidateHomeUniversity === "type-e" ||
    (candidatureType !== "" && candidatureType !== "type-e");
  const hasCategory = candidateCategory !== "";
  const hasLadiesChoice = ladiesSeatEligible !== null;
  const canUseMinority =
    candidatureType === "type-a" || candidatureType === "type-b";
  const selectedHomeUniversityLabel =
    candidateHomeUniversity === "type-e"
      ? "Type E — no home university"
      : MHT_CET_HOME_UNIVERSITIES.find(
          ({ id }) => id === candidateHomeUniversity,
        )?.label;
  const selectedCandidature = MHT_CET_CANDIDATURE_OPTIONS.find(
    ({ value }) => value === candidatureType,
  );
  const typeECandidature = MHT_CET_CANDIDATURE_OPTIONS.find(
    ({ value }) => value === "type-e",
  );
  const selectedCandidatureLabel = selectedCandidature?.label;
  const selectedCategoryLabel = MHT_CET_CATEGORY_OPTIONS.find(
    ({ value }) => value === candidateCategory,
  )?.label;
  const selectedMinorityLabel = minorityCommunity
    ? MHT_CET_MINORITY_OPTIONS.find(
        ({ value }) => value === minorityCommunity,
      )?.label
    : "Not applicable";

  const eligibilityRows = [
    {
      id: "ews",
      label: "EWS certificate",
      description:
        candidateCategory === "open"
          ? "Include EWS source pools"
          : "Available only with Open category",
      checked: ewsEligible,
      disabled: candidateCategory !== "open",
      onChange: onEwsEligibleChange,
    },
    {
      id: "tfws",
      label: "TFWS eligible",
      description: "Include Tuition Fee Waiver Scheme pools",
      checked: tfwsEligible,
      disabled: false,
      onChange: onTfwsEligibleChange,
    },
    {
      id: "pwd",
      label: "PwD eligible",
      description:
        candidatureType === "type-e"
          ? "Unavailable to Type E candidature"
          : "Include supported PwD source pools",
      checked: pwdEligible,
      disabled: candidatureType === "type-e",
      onChange: onPwdEligibleChange,
    },
    {
      id: "orphan",
      label: "Orphan certificate",
      description: "Include orphan source pools",
      checked: orphanEligible,
      disabled: false,
      onChange: onOrphanEligibleChange,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label
          htmlFor="candidate-home-university"
          className="text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          1. Home university
        </Label>
        <Select
          value={candidateHomeUniversity}
          onValueChange={(value) =>
            onCandidateHomeUniversityChange(
              value as MhtCetHomeUniversityId | "type-e",
            )
          }
        >
          <SelectTrigger
            id="candidate-home-university"
            className={profileSelectTriggerClassName}
            title={selectedHomeUniversityLabel}
          >
            <span
              className={cn(
                "block",
                !selectedHomeUniversityLabel && "text-gray-500",
              )}
            >
              {selectedHomeUniversityLabel || "Select your home university"}
            </span>
          </SelectTrigger>
          <SelectContent className={profileSelectContentClassName}>
            {MHT_CET_HOME_UNIVERSITIES.map((option) => (
              <SelectItem
                key={option.id}
                value={option.id}
                textValue={option.label}
                className={profileSelectItemClassName}
              >
                {option.label}
              </SelectItem>
            ))}
            <SelectItem
              value="type-e"
              textValue={`Type E no home university ${typeECandidature?.description ?? ""}`}
              className={profileSelectItemClassName}
            >
              <span className="block">
                <span className="block font-medium">
                  Type E — no home university
                </span>
                {typeECandidature ? (
                  <span className="mt-0.5 block text-xs leading-4 text-gray-600">
                    {typeECandidature.description}
                  </span>
                ) : null}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          {candidateHomeUniversity === "type-e"
            ? "Type E is for Maharashtra–Karnataka border-area candidates and does not use a home university."
            : "This is your CAP geographic home university, not a college’s affiliating university."}
        </p>
      </div>

      {hasUniversity && candidateHomeUniversity !== "type-e" ? (
        <div className="space-y-2">
          <Label
            htmlFor="candidate-candidature"
            className="text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            2. CAP candidature
          </Label>
          <Select
            value={candidatureType}
            onValueChange={(value) =>
              onCandidatureChange(value as MhtCetCandidatureType)
            }
          >
            <SelectTrigger
              id="candidate-candidature"
              className={profileSelectTriggerClassName}
              title={
                selectedCandidature
                  ? `${selectedCandidature.label} — ${selectedCandidature.description}`
                  : undefined
              }
            >
              <span
                className={cn(
                  "block min-w-0 flex-1",
                  !selectedCandidatureLabel && "text-gray-500",
                )}
              >
                <span className="block font-medium">
                  {selectedCandidatureLabel || "Select candidature type"}
                </span>
                {selectedCandidature ? (
                  <span className="mt-0.5 block text-xs leading-4 text-gray-600">
                    {selectedCandidature.description}
                  </span>
                ) : null}
              </span>
            </SelectTrigger>
            <SelectContent className={profileSelectContentClassName}>
              {MHT_CET_CANDIDATURE_OPTIONS.filter(
                ({ value }) => value !== "type-e",
              ).map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  textValue={`${option.label} ${option.description}`}
                  className={profileSelectItemClassName}
                >
                  <span className="block">
                    <span className="block font-medium">{option.label}</span>
                    <span className="mt-0.5 block text-xs leading-4 text-gray-600">
                      {option.description}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {hasCandidature ? (
        <div className="space-y-2">
          <Label
            htmlFor="candidate-category"
            className="text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {candidateHomeUniversity === "type-e" ? "2" : "3"}. Base category
          </Label>
          <Select
            value={candidateCategory}
            onValueChange={(value) =>
              onCandidateCategoryChange(value as MhtCetCategoryId)
            }
          >
            <SelectTrigger
              id="candidate-category"
              className={profileSelectTriggerClassName}
              title={selectedCategoryLabel}
            >
              <span
                className={cn(
                  "block",
                  !selectedCategoryLabel && "text-gray-500",
                )}
              >
                {selectedCategoryLabel || "Select base category"}
              </span>
            </SelectTrigger>
            <SelectContent className={profileSelectContentClassName}>
              {MHT_CET_CATEGORY_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={profileSelectItemClassName}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {candidateCategory && candidateCategory !== "open" ? (
            <p className="text-xs text-gray-500">
              Open pools are included together with your reserved category.
            </p>
          ) : null}
        </div>
      ) : null}

      {hasCategory ? (
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {candidateHomeUniversity === "type-e" ? "3" : "4"}. Ladies-seat
            eligibility
          </legend>
          <div
            className="grid grid-cols-2 gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1"
            role="radiogroup"
            aria-label="Ladies-seat eligibility"
          >
            {[
              { value: false, label: "Not eligible" },
              { value: true, label: "Eligible" },
            ].map((option) => (
              <button
                key={String(option.value)}
                type="button"
                role="radio"
                aria-checked={ladiesSeatEligible === option.value}
                onClick={() => onLadiesSeatEligibleChange(option.value)}
                className={cn(
                  "h-10 rounded-md text-sm font-semibold transition-colors",
                  ladiesSeatEligible === option.value
                    ? "border border-purple-300 bg-white text-purple-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Eligible candidates see both general and ladies source pools.
          </p>
        </fieldset>
      ) : null}

      {hasLadiesChoice ? (
        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-left">
            <span>
              <span className="block text-sm font-semibold text-gray-800">
                Additional reservations
              </span>
              <span className="block text-xs text-gray-500">
                EWS, TFWS, PwD, orphan and minority
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {eligibilityRows.map((option) => (
              <div
                key={option.id}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-lg border px-3 py-3",
                  option.disabled
                    ? "border-gray-100 bg-gray-50 opacity-60"
                    : "border-gray-200 bg-white",
                )}
              >
                <Label htmlFor={`candidate-${option.id}`} className="min-w-0">
                  <span className="block text-sm font-medium text-gray-800">
                    {option.label}
                  </span>
                  <span className="block text-xs font-normal text-gray-500">
                    {option.description}
                  </span>
                </Label>
                <Switch
                  id={`candidate-${option.id}`}
                  checked={option.checked}
                  disabled={option.disabled}
                  onCheckedChange={option.onChange}
                />
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="candidate-minority" className="text-sm">
                Minority community
              </Label>
              <Select
                value={minorityCommunity || "none"}
                disabled={!canUseMinority}
                onValueChange={(value) =>
                  onMinorityCommunityChange(
                    value === "none"
                      ? ""
                      : (value as MhtCetMinorityCommunityId),
                  )
                }
              >
                <SelectTrigger
                  id="candidate-minority"
                  className={profileSelectTriggerClassName}
                  title={selectedMinorityLabel}
                >
                  <span className="block">{selectedMinorityLabel}</span>
                </SelectTrigger>
                <SelectContent className={profileSelectContentClassName}>
                  <SelectItem
                    value="none"
                    className={profileSelectItemClassName}
                  >
                    Not applicable
                  </SelectItem>
                  {MHT_CET_MINORITY_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={profileSelectItemClassName}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!canUseMinority ? (
                <p className="text-xs text-gray-500">
                  Minority reservation requires Type A or Type B candidature.
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Defence and stage-converted pools are disabled because the
              historical rows do not contain CAP stage semantics.
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
});

const FilterGroup = memo(function FilterGroup({
  title,
  description,
  icon: Icon,
  groups,
  selected,
  onChange,
  isGrouped = true,
}: {
  title: string;
  description?: string;
  icon: ElementType;
  groups: Record<string, string[]> | Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (values: string[]) => void;
  isGrouped?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const toggleItem = useCallback(
    (item: string) => {
      if (selected.includes(item)) {
        onChange(selected.filter((i) => i !== item));
      } else {
        onChange([...selected, item]);
      }
    },
    [selected, onChange],
  );

  const toggleGroup = useCallback(
    (groupItems: string[]) => {
      const allSelected = groupItems.every((item) => selected.includes(item));
      if (allSelected) {
        onChange(selected.filter((item) => !groupItems.includes(item)));
      } else {
        const newSelected = [...selected];
        groupItems.forEach((item) => {
          if (!newSelected.includes(item)) {
            newSelected.push(item);
          }
        });
        onChange(newSelected);
      }
    },
    [selected, onChange],
  );

  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups;
    const term = searchTerm.toLowerCase();

    if (Array.isArray(groups)) {
      return groups.filter(
        (item) =>
          item.label.toLowerCase().includes(term) ||
          item.value.toLowerCase().includes(term),
      );
    }

    const filtered: Record<string, string[]> = {};
    Object.entries(groups).forEach(([groupName, items]) => {
      const matchedItems = items.filter((item) =>
        item.toLowerCase().includes(term),
      );
      if (matchedItems.length > 0 || groupName.toLowerCase().includes(term)) {
        filtered[groupName] = groupName.toLowerCase().includes(term)
          ? items
          : matchedItems;
      }
    });
    return filtered;
  }, [groups, searchTerm]);

  return (
    <AccordionItem
      value={title}
      className="border border-gray-200 rounded-lg overflow-hidden bg-white"
    >
      <AccordionTrigger className="py-3 px-3 hover:no-underline hover:bg-gray-50 transition-colors group data-[state=open]:bg-gray-50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={cn(
              "p-2 rounded-lg transition-colors",
              selected.length > 0
                ? "bg-purple-600"
                : "bg-gray-100 group-hover:bg-gray-200",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                selected.length > 0 ? "text-white" : "text-gray-600",
              )}
            />
          </div>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-sm font-medium text-gray-800 break-words whitespace-normal">
              {title}
            </span>
            {description ? (
              <span className="mt-0.5 block text-xs font-normal leading-4 text-gray-500">
                {description}
              </span>
            ) : null}
          </span>
          {selected.length > 0 && (
            <Badge className="ml-auto mr-2 bg-purple-600 text-white hover:bg-purple-700 px-2 py-0.5 text-xs">
              {selected.length}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3 pt-1">
        <div className="space-y-3">
          <div className="flex gap-3">
            <Input
              placeholder={`Search ${title.toLowerCase()}...`}
              aria-label={`Search ${title.toLowerCase()}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 text-sm border-gray-300 focus:border-purple-500"
            />
            {selected.length > 0 && (
              <Button
                variant="neutral"
                size="sm"
                onClick={clearAll}
                className="h-10 px-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 whitespace-nowrap"
              >
                Clear
              </Button>
            )}
          </div>

          <ScrollArea className="h-[220px]">
            <div className="space-y-1 pr-3">
              {isGrouped && !Array.isArray(filteredGroups)
                ? Object.entries(filteredGroups).map(([groupName, items]) => (
                    <Collapsible
                      key={groupName}
                      defaultOpen={selected.some((s) => items.includes(s))}
                    >
                      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors min-w-0">
                        <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        <span className="text-sm font-medium text-gray-700 flex-1 text-left break-words whitespace-normal min-w-0">
                          {groupName}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {items.length}
                        </span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-5 pt-2 space-y-1">
                        <div
                          role="button"
                          tabIndex={0}
                          aria-pressed={items.every((item) =>
                            selected.includes(item),
                          )}
                          onClick={() => toggleGroup(items)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleGroup(items);
                            }
                          }}
                          className="flex items-center gap-3 w-full py-2 px-3 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Checkbox
                            checked={items.every((item) =>
                              selected.includes(item),
                            )}
                            className="h-4 w-4 data-[state=checked]:bg-purple-600 pointer-events-none"
                          />
                          <span className="font-medium">Select All</span>
                        </div>
                        {items.map((item) => (
                          <div
                            key={item}
                            role="button"
                            tabIndex={0}
                            aria-pressed={selected.includes(item)}
                            onClick={() => toggleItem(item)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleItem(item);
                              }
                            }}
                            className={cn(
                              "flex items-center gap-3 w-full py-2 px-3 text-sm rounded-lg transition-colors cursor-pointer min-w-0",
                              selected.includes(item)
                                ? "bg-purple-100 text-purple-700"
                                : "hover:bg-gray-50 text-gray-600",
                            )}
                          >
                            <Checkbox
                              checked={selected.includes(item)}
                              className="h-4 w-4 pointer-events-none"
                            />
                            <span className="truncate break-words whitespace-normal">
                              {item}
                            </span>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                : (Array.isArray(filteredGroups) ? filteredGroups : []).map(
                    (item) => (
                      <div
                        key={typeof item === "string" ? item : item.value}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selected.includes(
                          typeof item === "string" ? item : item.value,
                        )}
                        onClick={() =>
                          toggleItem(
                            typeof item === "string" ? item : item.value,
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleItem(
                              typeof item === "string" ? item : item.value,
                            );
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 w-full py-2.5 px-3 text-sm rounded-lg transition-colors cursor-pointer min-w-0",
                          selected.includes(
                            typeof item === "string" ? item : item.value,
                          )
                            ? "bg-purple-100 text-purple-700"
                            : "hover:bg-gray-50 text-gray-600",
                        )}
                      >
                        <Checkbox
                          checked={selected.includes(
                            typeof item === "string" ? item : item.value,
                          )}
                          className="h-4 w-4 pointer-events-none"
                        />
                        <span className="truncate break-words whitespace-normal">
                          {typeof item === "string" ? item : item.label}
                        </span>
                      </div>
                    ),
                  )}
            </div>
          </ScrollArea>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
});

export const FilterSidebar = memo(function FilterSidebar({
  percentile,
  year,
  round,
  categories,
  courses,
  statuses,
  universities,
  scoreMode,
  rank,
  candidateHomeUniversity,
  candidatureType,
  candidateCategory,
  ladiesSeatEligible,
  ewsEligible,
  tfwsEligible,
  pwdEligible,
  orphanEligible,
  minorityCommunity,
  eligibleSeatPoolGroups,
  onPercentileChange,
  onYearChange,
  onRoundChange,
  onCategoriesChange,
  onCoursesChange,
  onStatusesChange,
  onUniversitiesChange,
  onScoreModeChange,
  onRankChange,
  onCandidateHomeUniversityChange,
  onCandidatureChange,
  onCandidateCategoryChange,
  onLadiesSeatEligibleChange,
  onEwsEligibleChange,
  onTfwsEligibleChange,
  onPwdEligibleChange,
  onOrphanEligibleChange,
  onMinorityCommunityChange,
  onClearAll,
  activeFilterCount,
  headerActions,
  footer,
  className,
}: FilterSidebarProps) {
  return (
    <div
      className={cn("flex flex-col h-full overflow-hidden bg-white", className)}
    >
      <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-bold text-base text-gray-900">
            MHT-CET State Cutoffs
          </h1>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="neutral"
                size="sm"
                onClick={onClearAll}
                className="h-8 px-3 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 gap-1.5 rounded-md"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}
            {headerActions}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-5 py-5 space-y-6">
          <div className="space-y-4">
            <ScoreModeTabs mode={scoreMode} onChange={onScoreModeChange} />
            {scoreMode === "percentile" ? (
              <PercentileInput
                value={percentile}
                onChange={onPercentileChange}
              />
            ) : (
              <RankInput value={rank} onChange={onRankChange} />
            )}
          </div>

          <Separator className="bg-gray-200" />

          <CandidateProfileSetup
            candidateHomeUniversity={candidateHomeUniversity}
            candidatureType={candidatureType}
            candidateCategory={candidateCategory}
            ladiesSeatEligible={ladiesSeatEligible}
            ewsEligible={ewsEligible}
            tfwsEligible={tfwsEligible}
            pwdEligible={pwdEligible}
            orphanEligible={orphanEligible}
            minorityCommunity={minorityCommunity}
            onCandidateHomeUniversityChange={
              onCandidateHomeUniversityChange
            }
            onCandidatureChange={onCandidatureChange}
            onCandidateCategoryChange={onCandidateCategoryChange}
            onLadiesSeatEligibleChange={onLadiesSeatEligibleChange}
            onEwsEligibleChange={onEwsEligibleChange}
            onTfwsEligibleChange={onTfwsEligibleChange}
            onPwdEligibleChange={onPwdEligibleChange}
            onOrphanEligibleChange={onOrphanEligibleChange}
            onMinorityCommunityChange={onMinorityCommunityChange}
          />

          <Accordion type="single" collapsible>
            <FilterGroup
              title="Courses"
              description="Search courses or select a group"
              icon={GraduationCap}
              groups={COURSE_GROUPS}
              selected={courses}
              onChange={onCoursesChange}
              isGrouped
            />
          </Accordion>

          <Separator className="bg-gray-200" />

          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-left">
              <span>
                <span className="block text-sm font-semibold text-gray-800">
                  Advanced filters
                </span>
                <span className="block text-xs text-gray-500">
                  Year, round, seat pools, status and university
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-5 pt-5">
              <YearRoundSelector
                year={year}
                round={round}
                onYearChange={onYearChange}
                onRoundChange={onRoundChange}
              />
              <Accordion type="multiple" className="space-y-2">
                {Object.keys(eligibleSeatPoolGroups).length > 0 ? (
                  <FilterGroup
                    title="Eligible seat-pool refinement"
                    icon={Users}
                    groups={eligibleSeatPoolGroups}
                    selected={categories}
                    onChange={onCategoriesChange}
                    isGrouped
                  />
                ) : null}

                <FilterGroup
                  title="College Status"
                  icon={Building2}
                  groups={STATUS_OPTIONS}
                  selected={statuses}
                  onChange={onStatusesChange}
                  isGrouped={false}
                />

                <FilterGroup
                  title="Affiliating University"
                  icon={MapPin}
                  groups={HOME_UNIVERSITY_OPTIONS}
                  selected={universities}
                  onChange={onUniversitiesChange}
                  isGrouped={false}
                />
              </Accordion>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      {footer ? <div className="flex-shrink-0">{footer}</div> : null}
    </div>
  );
});
