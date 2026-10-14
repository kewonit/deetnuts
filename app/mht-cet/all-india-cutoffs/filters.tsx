"use client";

import { useEffect, useRef } from "react";
import { MhtMultiSelect } from "@/components/admissions/MhtOptions";
import { COURSE_GROUPS, ENGINEERING_BRANCHES } from "./constants";
import { FilterState } from "./types";

const KNOWN = new Set<string>(ENGINEERING_BRANCHES);
const GROUPED = new Set<string>(Object.values(COURSE_GROUPS).flat());

// Branch groups, limited to branches present in the data, plus everything ungrouped.
const BRANCH_GROUPS: Record<string, string[]> = Object.fromEntries(
  [
    ...Object.entries(COURSE_GROUPS).map(
      ([group, branches]) => [group, branches.filter((branch) => KNOWN.has(branch))] as const,
    ),
    ["Other", ENGINEERING_BRANCHES.filter((branch) => !GROUPED.has(branch))] as const,
  ].filter(([, branches]) => branches.length > 0),
);

export const EMPTY_FILTERS: FilterState = {
  search: "",
  branch: "",
  branches: [],
  minPercentile: "",
  maxPercentile: "",
  minRank: "",
  maxRank: "",
  collegeName: "",
};

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

interface FilterChip {
  key: string;
  label: string;
  clear: Partial<FilterState>;
}

interface FiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSearch: () => void;
}

export function Filters({ filters, onFiltersChange, onSearch }: FiltersProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || isTypingTarget(event.target)) return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  function update(patch: Partial<FilterState>) {
    onFiltersChange({ ...filters, ...patch });
  }

  const chips: Array<FilterChip | null> = [
    filters.search ? { key: "search", label: `“${filters.search}”`, clear: { search: "" } } : null,
    filters.branches.length > 0
      ? {
          key: "branches",
          label: filters.branches.length === 1 ? filters.branches[0] : `${filters.branches.length} branches`,
          clear: { branches: [] },
        }
      : null,
    filters.maxPercentile ? { key: "pct", label: `≤ ${filters.maxPercentile}`, clear: { maxPercentile: "" } } : null,
    filters.minPercentile ? { key: "minPct", label: `≥ ${filters.minPercentile}`, clear: { minPercentile: "" } } : null,
    filters.minRank || filters.maxRank
      ? { key: "rank", label: `Rank ${filters.minRank || "1"}–${filters.maxRank || "∞"}`, clear: { minRank: "", maxRank: "" } }
      : null,
    filters.collegeName ? { key: "college", label: filters.collegeName, clear: { collegeName: "" } } : null,
  ];
  const active = chips.filter((chip): chip is FilterChip => chip !== null);

  return (
    <div className="mht-filterbar">
      <div className="mht-filterbar-row">
        <form
          role="search"
          className="mht-search"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch();
          }}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.75" />
            <path d="m10.5 10.5 3 3" />
          </svg>
          <span className="mht-sr">Search</span>
          <input
            ref={searchRef}
            type="search"
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="College, program or choice code"
            autoComplete="off"
            enterKeyHint="search"
          />
          <kbd className="mht-kbd">/</kbd>
        </form>
        <MhtMultiSelect
          label="Branch"
          options={BRANCH_GROUPS}
          selected={filters.branches}
          onChange={(branches) => update({ branches })}
        />
        <label className="mht-score mht-score-sm" data-filled={filters.maxPercentile ? "" : undefined}>
          <span className="mht-score-label">Your percentile</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="98.54"
            value={filters.maxPercentile}
            onChange={(event) => {
              const { value } = event.target;
              if (/^$|^(\d{0,3})(\.\d*)?$/.test(value) && (value === "" || Number(value) <= 100)) {
                update({ maxPercentile: value });
              }
            }}
          />
        </label>
      </div>
      {active.length > 0 ? (
        <div className="mht-chips" aria-label="Active filters">
          {active.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="mht-chip mht-chip-x"
              aria-label={`Remove ${chip.label}`}
              onClick={() => update(chip.clear)}
            >
              {chip.label}
            </button>
          ))}
          {active.length > 1 ? (
            <button type="button" className="mht-link" onClick={() => onFiltersChange(EMPTY_FILTERS)}>
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
