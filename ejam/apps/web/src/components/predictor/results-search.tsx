/**
 *searches across institute, program, band, closing rank, seat pool, degree, and duration
 **/

"use client";

import { X } from "lucide-react";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

interface ResultsSearchProps {
  value: string;
  onChange: (query: string) => void;
  maxLength?: number;
}

export function ResultsSearch({
  value,
  onChange,
  maxLength,
}: ResultsSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        if (value) {
          onChange("");
        } else {
          inputRef.current?.blur();
        }
      }
    },
    [value, onChange],
  );

  // global Cmd+K / Ctrl+K to focus
  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className={cn(
        "group/search relative flex h-9 w-full min-w-0 items-center gap-2 rounded-none border border-border/50 bg-transparent px-3 py-1.5 transition-all duration-200 ease-out hover:border-border/80 hover:bg-muted dark:hover:bg-muted/50 sm:max-w-xs",
        focused &&
          "border-ring/50 bg-background ring-4 ring-ring/10 hover:bg-background hover:border-ring/50 dark:hover:bg-background shadow-sm",
      )}
    >
      <span
        className={cn(
          "size-4 shrink-0 bg-muted-foreground/60 transition-colors duration-200",
          focused && "bg-ring",
        )}
        style={{
          maskImage: "url(/icons/search.svg)",
          WebkitMaskImage: "url(/icons/search.svg)",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        }}
        aria-hidden
      />
      <input
        ref={inputRef}
        type="text"
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder="Search institutes, programs, bands…"
        aria-label="Search results"
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60 selection:bg-primary/20"
      />
      <div className="flex w-7 shrink-0 items-center justify-end">
        {value ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={handleClear}
            className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-all duration-200 ease-out hover:bg-muted hover:text-foreground active:scale-[0.97]"
            aria-label="Clear search"
          >
            <X className="size-3.5" strokeWidth={2.5} />
          </button>
        ) : (
          <kbd className="pointer-events-none hidden shrink-0 select-none items-center rounded-[4px] border border-border/40 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:inline-flex">
            ⌘K
          </kbd>
        )}
      </div>
    </div>
  );
}
