"use client";

import { memo, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { MhtPagination } from "@/components/admissions/MhtPagination";
import { getCanonicalMhtCetCollegePath } from "@/lib/admissions/proxy-canonical";
import { CutoffRecord } from "../types";
import { formatSearchEmptyStateMessage, type SearchInsight } from "../search-insights";
import { calculatePercentileDistance, formatPercentileDistance } from "../utils";
import { COLUMN_OPTIONS } from "./TopToolbar";

interface DataTableProps {
  records: CutoffRecord[];
  totalItems: number;
  currentPage: number;
  perPage: number;
  loading: boolean;
  paginationLoading: boolean;
  error?: string | null;
  search: string;
  searchInsight?: SearchInsight | null;
  percentileTarget: string;
  hasActiveQuery: boolean;
  visibleColumns: string[];
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

const PER_PAGE_OPTIONS = [10, 25, 50, 100, 200];
const NUMERIC = new Set(["last_rank", "cutoff_score", "total_admitted"]);
// On phones each row stacks into two lines; only these columns stay visible.
const PRIMARY = new Set(["college_name", "course_name", "last_rank", "cutoff_score"]);

function formatPercentile(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? (Math.trunc(number * 100) / 100).toFixed(2) : value || "—";
}

function formatInteger(value: string | number) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en-IN") : String(value || "—");
}

function Margin({ cutoff, target }: { cutoff: number; target: number }) {
  const distance = calculatePercentileDistance(cutoff, target);
  if (Math.abs(distance) < 0.01) return <span className="mht-margin" data-status="close">At cutoff</span>;
  return (
    <span className="mht-margin" data-status={distance > 0 ? "cleared" : "short"}>
      {distance > 0 ? "+" : "−"}
      {formatPercentileDistance(distance)}
    </span>
  );
}

function renderCell(column: string, record: CutoffRecord, target: number | null): ReactNode {
  switch (column) {
    case "college_name": {
      const path = getCanonicalMhtCetCollegePath(record.college_code);
      return path ? <Link href={path}>{record.college_name}</Link> : record.college_name;
    }
    case "course_name":
      return record.course_name;
    case "category":
      return <span className="mht-chip mht-chip-code">{record.category}</span>;
    case "last_rank":
      return formatInteger(record.last_rank);
    case "cutoff_score": {
      const cutoff = Number(record.cutoff_score);
      return (
        <>
          <strong title={record.cutoff_score}>{formatPercentile(record.cutoff_score)}</strong>
          {target !== null && Number.isFinite(cutoff) ? <Margin cutoff={cutoff} target={target} /> : null}
        </>
      );
    }
    case "total_admitted":
      return formatInteger(record.total_admitted);
    case "college_code":
    case "course_code":
      return <span className="mht-code">{record[column]}</span>;
    case "status":
    case "home_university":
      return <span className="mht-dim">{record[column]}</span>;
    default:
      return null;
  }
}

export const DataTable = memo(function DataTable({
  records,
  totalItems,
  currentPage,
  perPage,
  loading,
  paginationLoading,
  error,
  search,
  searchInsight,
  percentileTarget,
  hasActiveQuery,
  visibleColumns,
  onPageChange,
  onPerPageChange,
}: DataTableProps) {
  const target = percentileTarget && Number.isFinite(Number(percentileTarget)) ? Number(percentileTarget) : null;
  const columns = COLUMN_OPTIONS.filter((column) => visibleColumns.includes(column.value));
  const totalPages = Math.ceil(totalItems / perPage);

  // Arrow keys page through results when focus isn't in a field.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowLeft" && currentPage > 1) {
        event.preventDefault();
        onPageChange(currentPage - 1);
      } else if (event.key === "ArrowRight" && currentPage < totalPages) {
        event.preventDefault();
        onPageChange(currentPage + 1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, onPageChange]);

  if (!hasActiveQuery && !loading && !error) return null;

  if (!loading && (error || records.length === 0)) {
    const authError = !!error && /auth|log ?in/i.test(error);
    return (
      <div className="mht-card mht-data-card">
        <p className="mht-data-state" role={error ? "alert" : undefined}>
          {error
            ? authError
              ? "Log in to keep searching."
              : "Couldn’t load cutoffs. Change a filter to try again."
            : formatSearchEmptyStateMessage({
                hasFilters: hasActiveQuery,
                search,
                searchInsight: searchInsight ?? null,
                percentileTarget,
              })}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mht-card mht-data-card">
        <div className="mht-data-scroll">
          <table className="mht-data mht-data-stack" aria-busy={loading || paginationLoading}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.value}
                    scope="col"
                    className={NUMERIC.has(column.value) ? "mht-data-num" : undefined}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody data-pending={paginationLoading || (loading && records.length > 0) ? "" : undefined}>
              {loading && records.length === 0
                ? Array.from({ length: Math.min(perPage, 12) }, (_, index) => (
                    <tr key={index} aria-hidden="true">
                      {columns.map((column) => (
                        <td key={column.value}>
                          <span className="mht-skeleton mht-data-skeleton" />
                        </td>
                      ))}
                    </tr>
                  ))
                : records.map((record) => (
                    <tr key={record.id}>
                      {columns.map((column) => (
                        <td
                          key={column.value}
                          data-col={column.value}
                          data-primary={PRIMARY.has(column.value) ? "" : undefined}
                          className={NUMERIC.has(column.value) ? "mht-data-num" : undefined}
                        >
                          {renderCell(column.value, record, target)}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
      {totalItems > 0 ? (
        <MhtPagination
          page={currentPage}
          perPage={perPage}
          totalItems={totalItems}
          onPageChange={onPageChange}
          perPageOptions={PER_PAGE_OPTIONS}
          onPerPageChange={onPerPageChange}
          busy={loading || paginationLoading}
        />
      ) : null}
    </>
  );
});
