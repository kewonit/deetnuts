"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import * as Popover from "@radix-ui/react-popover";
import { toast } from "sonner";
import { MHT_LAYER } from "@/components/admissions/mht-font";
import { getDisplayNameForRound } from "../constants";
import { CutoffRecord } from "../types";

export const COLUMN_OPTIONS = [
  { value: "college_name", label: "College", required: true },
  { value: "course_name", label: "Course", required: true },
  { value: "category", label: "Seat pool" },
  { value: "last_rank", label: "Rank" },
  { value: "cutoff_score", label: "Percentile", required: true },
  { value: "total_admitted", label: "Admitted" },
  { value: "college_code", label: "College code" },
  { value: "course_code", label: "Course code" },
  { value: "status", label: "Status" },
  { value: "home_university", label: "University" },
] as const;

interface TopToolbarProps {
  totalItems: number;
  currentPage: number;
  year: number;
  round: number;
  loading: boolean;
  queryReady: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  sortLabel: string;
  visibleColumns: string[];
  onColumnVisibilityChange: (columns: string[]) => void;
  records: CutoffRecord[];
  filterCount: number;
  onOpenFilters: () => void;
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export const TopToolbar = memo(function TopToolbar({
  totalItems,
  currentPage,
  year,
  round,
  loading,
  queryReady,
  search,
  onSearchChange,
  sortLabel,
  visibleColumns,
  onColumnVisibilityChange,
  records,
  filterCount,
  onOpenFilters,
}: TopToolbarProps) {
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

  const handleExport = useCallback(() => {
    if (records.length === 0) return;
    const headers = [
      "College",
      "Course",
      "Seat pool",
      "Percentile",
      "Rank",
      "Admitted",
      "College code",
      "Course code",
      "Status",
      "University",
    ];
    const rows = records.map((record) =>
      [
        record.college_name,
        record.course_name,
        record.category,
        record.cutoff_score,
        record.last_rank,
        record.total_admitted,
        record.college_code,
        record.course_code,
        record.status,
        record.home_university,
      ]
        .map(csvCell)
        .join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mht-cet-cutoffs-${year}-${getDisplayNameForRound(round).replace(/\s+/g, "-")}-page-${currentPage}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [records, year, round, currentPage]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn’t copy the link");
    }
  }, []);

  return (
    <div className="mht-toolbar">
      <p className="mht-toolbar-count" aria-live="polite">
        {queryReady ? (
          loading ? (
            <span className="mht-dim">Loading…</span>
          ) : (
            <>
              <strong>{totalItems.toLocaleString("en-IN")}</strong> {totalItems === 1 ? "result" : "results"}
              {totalItems > 0 ? <span className="mht-toolbar-sort"> · {sortLabel}</span> : null}
            </>
          )
        ) : null}
      </p>
      <div className="mht-toolbar-tools">
        <label className="mht-search">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.75" />
            <path d="m10.5 10.5 3 3" />
          </svg>
          <span className="mht-sr">Search colleges and courses</span>
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="College or course"
            autoComplete="off"
          />
          <kbd className="mht-kbd">/</kbd>
        </label>
        <button type="button" className="mht-btn mht-btn-ghost mht-tool-filters" onClick={onOpenFilters}>
          Filters{filterCount > 0 ? <span className="mht-btn-count">{filterCount}</span> : null}
        </button>
        <Popover.Root>
          <Popover.Trigger asChild>
            <button type="button" className="mht-btn mht-btn-ghost">
              Columns
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content align="end" sideOffset={6} collisionPadding={12} className={`${MHT_LAYER} mht-popover`}>
              <div className="mht-options-list">
                {COLUMN_OPTIONS.map((column) => (
                  <label key={column.value} className="mht-option" data-disabled={"required" in column ? "" : undefined}>
                    <input
                      type="checkbox"
                      className="mht-box"
                      checked={visibleColumns.includes(column.value)}
                      disabled={"required" in column}
                      onChange={(event) =>
                        onColumnVisibilityChange(
                          event.target.checked
                            ? [...visibleColumns, column.value]
                            : visibleColumns.filter((value) => value !== column.value),
                        )
                      }
                    />
                    <span>{column.label}</span>
                  </label>
                ))}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <button
          type="button"
          className="mht-btn mht-btn-ghost"
          onClick={handleExport}
          disabled={records.length === 0}
          title="Download this page as CSV"
        >
          Export
        </button>
        <button type="button" className="mht-btn mht-btn-ghost" onClick={handleShare} title="Copy a link to this search">
          Share
        </button>
      </div>
    </div>
  );
});
