"use client";

import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { RankInputErrorMessage } from "@/components/predictor/rank-input-error";
import { Input } from "@/components/ui/input";
import { useErrorShake } from "@/hooks/use-error-shake";
import type { RankValidationError } from "@/lib/rank-validation";
import { cn } from "@/lib/utils";

const MAX_RANK_LENGTH = 7;
const URL_SYNC_MS = 400;

export type RankInputHandle = {
  flush: () => string;
  showValidationError: (error: RankValidationError) => void;
};

interface RankInputProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  id?: string;
  "aria-label"?: string;
  emptyErrorMessage?: string;
  ref?: Ref<RankInputHandle>;
}

/** Keeps a local draft while focused so URL sync does not reset caret position. */
export function RankInput({
  value,
  onValueChange,
  className,
  id,
  "aria-label": ariaLabel,
  emptyErrorMessage,
  ref,
}: RankInputProps) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const [validationError, setValidationError] = useState<RankValidationError>({
    type: "empty",
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { wrapRef, showError, clearError } = useErrorShake();

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const commit = useCallback(
    (next: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      onValueChange(next);
    },
    [onValueChange],
  );

  const revealValidationError = useCallback(
    (error: RankValidationError) => {
      setValidationError(error);
      showError();
    },
    [showError],
  );

  useImperativeHandle(
    ref,
    () => ({
      flush: () => {
        const next = focused ? draft : value;
        commit(next);
        return next;
      },
      showValidationError: revealValidationError,
    }),
    [draft, focused, value, commit, revealValidationError],
  );

  const handleChange = (raw: string) => {
    const next = raw.replace(/\D/g, "").slice(0, MAX_RANK_LENGTH);
    setDraft(next);
    clearError();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onValueChange(next), URL_SYNC_MS);
  };

  return (
    <div ref={wrapRef} className="t-input-wrap flex flex-col gap-1">
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        name="predictor-rank"
        value={focused ? draft : value}
        onFocus={() => {
          setDraft(value);
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
          commit(draft);
        }}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="e.g. 4521"
        maxLength={MAX_RANK_LENGTH}
        required
        aria-required
        aria-label={ariaLabel}
        data-transparent-input=""
        className={cn(
          "t-input w-full rounded-none tabular-nums transition-colors duration-200 ease-out",
          "border-input bg-transparent shadow-none hover:bg-muted dark:bg-transparent dark:hover:bg-muted/50",
          "focus:bg-transparent focus:hover:bg-transparent dark:focus:bg-transparent dark:focus:hover:bg-transparent",
          className,
        )}
      />
      <p className="t-error-msg text-[10px] leading-snug text-destructive">
        <RankInputErrorMessage
          error={validationError}
          emptyMessage={emptyErrorMessage}
        />
      </p>
    </div>
  );
}
