"use client";

import {
  MHT_CET_HOME_UNIVERSITIES_2026,
  MHT_CET_MINORITY_COMMUNITIES_2026,
  MHT_CET_PWD_CATEGORIES_2026,
} from "@ejam/data/mht-cet/browser";
import { ChevronDownIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { OptionPicker } from "@/components/predictor/option-picker";
import { usePredictor } from "@/components/predictor/predictor-context";
import { SetupField } from "@/components/predictor/sidebar-form-controls";
import { Switch } from "@/components/ui/switch";
import { pressableClass } from "@/lib/pressable";
import { cn } from "@/lib/utils";

const sidebarControlClass =
  "transition-colors duration-200 ease-out bg-transparent shadow-none hover:bg-muted dark:bg-transparent dark:hover:bg-muted/50";

const CANDIDATURE_OPTIONS = [
  {
    value: "type-a",
    label: "Type A",
    description: "Schooling or birth in Maharashtra",
  },
  {
    value: "type-b",
    label: "Type B",
    description: "Maharashtra domicile",
  },
  {
    value: "type-c",
    label: "Type C",
    description: "Central Government employee parent",
  },
  {
    value: "type-d",
    label: "Type D",
    description: "Maharashtra Government employee parent",
  },
  {
    value: "type-e",
    label: "Type E",
    description: "Maharashtra–Karnataka border-area candidate",
  },
];

const CATEGORY_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
  { value: "vj-dt", label: "VJ/DT" },
  { value: "nt-b", label: "NT-B" },
  { value: "nt-c", label: "NT-C" },
  { value: "nt-d", label: "NT-D" },
  { value: "obc", label: "OBC" },
  { value: "sebc", label: "SEBC" },
];

const HOME_UNIVERSITIES = MHT_CET_HOME_UNIVERSITIES_2026.map(
  ({ id, label }) => ({ value: id, label }),
);
const PWD_CATEGORIES = [
  { value: "", label: "Not claimed" },
  ...MHT_CET_PWD_CATEGORIES_2026.map(({ id, label }) => ({
    value: id,
    label,
  })),
];
const MINORITY_COMMUNITIES = [
  { value: "", label: "Not claimed" },
  ...MHT_CET_MINORITY_COMMUNITIES_2026.map(({ id, label }) => ({
    value: id,
    label,
  })),
];

export function MhtCetProfileFields() {
  const { state } = usePredictor();
  const requiresHomeUniversity = state.mhtCandidatureType !== "type-e";
  const additionalEligibilityCount = [
    state.has_ews_certificate,
    state.mhtTfwsEligible,
    state.mhtOrphanCertificate,
    Boolean(state.mhtPwdCategory),
    Boolean(state.mhtMinorityCommunity),
  ].filter(Boolean).length;
  const [showAdditionalEligibility, setShowAdditionalEligibility] = useState(
    additionalEligibilityCount > 0,
  );

  useEffect(() => {
    if (additionalEligibilityCount > 0) setShowAdditionalEligibility(true);
  }, [additionalEligibilityCount]);

  return (
    <>
      <SetupField
        label="CAP candidature"
        required
        hint="Use the type shown on your CAP application."
      >
        <OptionPicker
          value={state.mhtCandidatureType}
          onValueChange={(value) =>
            state.setMhtCandidatureType(
              value as typeof state.mhtCandidatureType,
            )
          }
          options={CANDIDATURE_OPTIONS}
          placeholder="Candidature"
          triggerClassName={sidebarControlClass}
        />
      </SetupField>

      {requiresHomeUniversity ? (
        <SetupField
          label="Home university"
          required
          hint="Required for HU/OHU seat-pool eligibility."
        >
          <OptionPicker
            value={state.mhtHomeUniversity}
            onValueChange={(value) =>
              state.setMhtHomeUniversity(
                value as typeof state.mhtHomeUniversity,
              )
            }
            options={HOME_UNIVERSITIES}
            placeholder="Select university"
            triggerClassName={sidebarControlClass}
            listClassName="max-h-64 overflow-y-auto"
          />
        </SetupField>
      ) : null}

      <SetupField label="Category" required>
        <OptionPicker
          value={state.mhtCategory}
          onValueChange={(value) =>
            state.setMhtCategory(value as typeof state.mhtCategory)
          }
          options={CATEGORY_OPTIONS}
          placeholder="Category"
          triggerClassName={sidebarControlClass}
        />
      </SetupField>

      <EligibilitySwitch
        label="Eligible for ladies seats"
        description="Include ladies-only seat pools."
        checked={state.mhtLadiesSeatEligible}
        onCheckedChange={state.setMhtLadiesSeatEligible}
      />

      <div className="border border-border/80">
        <button
          type="button"
          aria-expanded={showAdditionalEligibility}
          aria-controls="mht-additional-eligibility"
          onClick={() =>
            setShowAdditionalEligibility((currentlyShown) => !currentlyShown)
          }
          className={cn(
            "flex min-h-10 w-full items-center justify-between gap-3 px-2.5 text-left text-xs font-medium outline-none",
            pressableClass,
            "hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        >
          <span>
            Additional reservations
            {additionalEligibilityCount > 0 ? (
              <span className="ml-1.5 text-muted-foreground">
                · {additionalEligibilityCount} added
              </span>
            ) : null}
          </span>
          <ChevronDownIcon
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              showAdditionalEligibility && "rotate-180",
            )}
          />
        </button>

        {showAdditionalEligibility ? (
          <div
            id="mht-additional-eligibility"
            className="flex flex-col gap-3 border-t border-border/80 p-2.5"
          >
            <p className="text-[11px] leading-snug text-muted-foreground">
              Add only reservations backed by a valid CAP document.
            </p>
            <EligibilitySwitch
              label="EWS certificate"
              description={
                state.mhtCategory === "open"
                  ? "Economically Weaker Section reservation."
                  : "Available only with the Open category."
              }
              checked={state.has_ews_certificate}
              disabled={state.mhtCategory !== "open"}
              onCheckedChange={state.setHasEwsCertificate}
            />
            <EligibilitySwitch
              label="TFWS eligible"
              description="Tuition Fee Waiver Scheme."
              checked={state.mhtTfwsEligible}
              onCheckedChange={state.setMhtTfwsEligible}
            />
            <EligibilitySwitch
              label="Orphan certificate"
              checked={state.mhtOrphanCertificate}
              onCheckedChange={state.setMhtOrphanCertificate}
            />

            {state.mhtCandidatureType !== "type-e" ? (
              <>
                <SetupField
                  label="PwD category"
                  hint="Requires a permanent benchmark disability certificate of at least 40%."
                >
                  <OptionPicker
                    value={state.mhtPwdCategory}
                    onValueChange={(value) =>
                      state.setMhtPwdCategory(
                        value as typeof state.mhtPwdCategory,
                      )
                    }
                    options={PWD_CATEGORIES}
                    placeholder="Not claimed"
                    triggerClassName={sidebarControlClass}
                    listClassName="max-h-64 overflow-y-auto"
                  />
                </SetupField>
                {state.mhtCandidatureType === "type-a" ||
                state.mhtCandidatureType === "type-b" ? (
                  <SetupField
                    label="Minority community"
                    hint="Choose only the community stated on your valid CAP minority document."
                  >
                    <OptionPicker
                      value={state.mhtMinorityCommunity}
                      onValueChange={(value) =>
                        state.setMhtMinorityCommunity(
                          value as typeof state.mhtMinorityCommunity,
                        )
                      }
                      options={MINORITY_COMMUNITIES}
                      placeholder="Not claimed"
                      triggerClassName={sidebarControlClass}
                      listClassName="max-h-64 overflow-y-auto"
                    />
                  </SetupField>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}

function EligibilitySwitch({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-9 items-center justify-between gap-3 text-xs text-foreground",
        disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
      )}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span>{label}</span>
        {description ? (
          <span className="text-[10px] leading-snug text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      <Switch
        id={id}
        size="sm"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </label>
  );
}
