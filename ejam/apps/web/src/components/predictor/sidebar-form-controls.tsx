"use client";

import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
} from "react";
import { PredictButtonLabel } from "@/components/predictor/predict-button-label";
import { Button } from "@/components/ui/button";
import { deferAfterPress, pressableClass } from "@/lib/pressable";
import { cn } from "@/lib/utils";

export function PredictAction({
  sticky,
  loading,
  disabled,
  disabledReason,
  onPredict,
  animateLabel = true,
}: {
  sticky: boolean;
  loading: boolean;
  disabled: boolean;
  disabledReason?: string;
  onPredict: () => void;
  animateLabel?: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-1",
        sticky &&
          "sticky bottom-0 z-10 -mx-2 border-t border-border bg-background/95 px-2 py-2 backdrop-blur",
      )}
    >
      <Button
        type="button"
        onClick={() => deferAfterPress(onPredict)}
        disabled={disabled}
        title={disabledReason}
        aria-describedby={disabledReason ? "predict-hint" : undefined}
        className="w-full overflow-visible rounded-none"
      >
        <PredictButtonLabel loading={loading} animate={animateLabel} />
      </Button>
      {disabledReason ? (
        <p
          id="predict-hint"
          className={cn(
            "mt-1.5 text-center text-[10px] leading-snug text-muted-foreground",
            !sticky && "sr-only",
          )}
          aria-live="polite"
        >
          {disabledReason}
        </p>
      ) : null}
    </div>
  );
}

export function OptionToggle({
  value,
  onChange,
  options,
  columns,
  "aria-labelledby": ariaLabelledBy,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{
    value: string;
    label: string;
    enabled?: boolean;
  }>;
  columns: 2 | 3;
  "aria-labelledby"?: string;
}) {
  const activeIndex = options.findIndex((option) => option.value === value);
  return (
    <fieldset aria-labelledby={ariaLabelledBy} className="min-w-0 border-0 p-0">
      <div className="sliding-toggle-track" data-gap="1">
        {activeIndex >= 0 ? (
          <span
            aria-hidden
            className="sliding-toggle-indicator"
            data-cols={String(columns)}
            data-gap="1"
            data-index={String(activeIndex)}
          />
        ) : null}
        <div
          className={cn(
            "sliding-toggle-grid grid",
            columns === 2 ? "grid-cols-2" : "grid-cols-3",
          )}
        >
          {options.map((option) => {
            const isActive = option.value === value;
            const isEnabled = option.enabled !== false;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                disabled={!isEnabled}
                onClick={() => {
                  if (isEnabled) deferAfterPress(() => onChange(option.value));
                }}
                className={cn(
                  "sliding-toggle-tile flex h-8 items-center justify-center rounded-none text-xs font-medium text-muted-foreground outline-none",
                  pressableClass,
                  isEnabled && "hover:text-foreground",
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive && "text-foreground",
                  !isEnabled && "cursor-not-allowed opacity-40 grayscale",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}

export function SetupField({
  label,
  required,
  hint,
  children,
  fieldId,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  fieldId?: string;
}) {
  const generatedId = useId();
  const controlId = fieldId ?? generatedId;
  const labelId = `${controlId}-label`;
  const usesGroupLabel =
    isValidElement(children) && children.type === OptionToggle;
  const control = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{ id?: string; "aria-labelledby"?: string }>,
        usesGroupLabel
          ? { "aria-labelledby": labelId }
          : {
              id:
                (children as ReactElement<{ id?: string }>).props.id ??
                controlId,
            },
      )
    : children;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label
        id={labelId}
        htmlFor={usesGroupLabel ? undefined : controlId}
        className="flex items-center gap-2 text-xs leading-none font-medium text-muted-foreground select-none"
      >
        {label}
        {required ? (
          <span className="text-muted-foreground/70" aria-hidden>
            {" "}
            *
          </span>
        ) : null}
      </label>
      {control}
      {hint ? (
        <p className="text-xs leading-snug text-muted-foreground/70">{hint}</p>
      ) : null}
    </div>
  );
}
