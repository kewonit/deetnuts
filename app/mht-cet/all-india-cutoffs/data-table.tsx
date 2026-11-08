"use client";

import type { SortingState } from "@tanstack/react-table";
import { IntentPrefetchLink } from "@/components/admissions/IntentPrefetchLink";
import type { CutoffRecord } from "./types";

type Column = { id: string; label: string; numeric?: boolean; sortable?: boolean };

const BASE_COLUMNS: Column[] = [
  { id: "rank", label: "Rank", numeric: true, sortable: true },
  { id: "percentile", label: "Percentile", numeric: true, sortable: true },
  { id: "college_name", label: "College", sortable: true },
  { id: "course_name", label: "Program", sortable: true },
  { id: "choice_code", label: "Choice code", sortable: true },
  { id: "merit_exam", label: "Exam", sortable: true },
];
const ADMITTED_COLUMN: Column = { id: "total_admitted", label: "Admitted", numeric: true, sortable: true };

// "JEE(Main)-2026" reads as "JEE Main"; the year is in the page header.
function examLabel(value: string) {
  return value.replace(/[-\s]*20\d\d$/, "").replace(/JEE\s*\(\s*Main\s*\)/i, "JEE Main");
}

function formatPercentile(value: number) {
  return Number.isFinite(value) ? (Math.trunc(value * 100) / 100).toFixed(2) : "—";
}

export function DataTable({
  data,
  loading,
  sorting,
  onSortChange,
  showAdmitted,
  skeletonRows,
}: {
  data: CutoffRecord[];
  loading: boolean;
  sorting: SortingState;
  onSortChange: (sorting: SortingState) => void;
  showAdmitted: boolean;
  skeletonRows: number;
}) {
  const sort = sorting[0];
  const columns = showAdmitted ? [...BASE_COLUMNS, ADMITTED_COLUMN] : BASE_COLUMNS;

  function toggleSort(id: string) {
    // Percentiles read best high-to-low; everything else starts ascending.
    onSortChange([{ id, desc: sort?.id === id ? !sort.desc : id === "percentile" }]);
  }

  return (
    <div className="mht-data-scroll">
      <table className="mht-data" aria-busy={loading}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={column.numeric ? "mht-data-num" : undefined}
                aria-sort={sort?.id === column.id ? (sort.desc ? "descending" : "ascending") : undefined}
              >
                <button type="button" className="mht-sort" onClick={() => toggleSort(column.id)}>
                  {column.label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody data-pending={loading && data.length > 0 ? "" : undefined}>
          {loading && data.length === 0
            ? Array.from({ length: skeletonRows }, (_, index) => (
                <tr key={index} aria-hidden="true">
                  {columns.map((column) => (
                    <td key={column.id} data-col={column.id}>
                      <span className="mht-skeleton mht-data-skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((row) => (
                <tr key={row.id}>
                  <td className="mht-data-num" data-col="rank">
                    <strong>{row.rank.toLocaleString("en-IN")}</strong>
                  </td>
                  <td className="mht-data-num" data-col="percentile" title={String(row.percentile)}>
                    {formatPercentile(row.percentile)}
                  </td>
                  <td className="mht-data-college" data-col="college_name">
                    {row.college_path ? (
                      <IntentPrefetchLink href={row.college_path}>{row.college_name}</IntentPrefetchLink>
                    ) : (
                      <span>{row.college_name}</span>
                    )}
                    <small className="mht-code">{row.institute_code}</small>
                  </td>
                  <td data-col="course_name">
                    {row.course_name}
                    {row.seat_type && row.seat_type !== "AI" ? (
                      <small className="mht-dim mht-data-pools" title="Minority seat released to All India candidates">
                        {row.seat_type}
                      </small>
                    ) : null}
                  </td>
                  <td className="mht-code" data-col="choice_code">
                    {row.choice_code}
                  </td>
                  <td data-col="merit_exam">
                    <span className="mht-chip">{examLabel(row.merit_exam)}</span>
                  </td>
                  {showAdmitted ? (
                    <td className="mht-data-num" data-col="total_admitted">
                      {row.total_admitted === null ? "—" : row.total_admitted.toLocaleString("en-IN")}
                    </td>
                  ) : null}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
