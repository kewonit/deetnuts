"use client";

import Link from "next/link";
import type { SortingState } from "@tanstack/react-table";
import { getCanonicalMhtCetCollegePath } from "@/lib/admissions/proxy-canonical";
import { CutoffRecord } from "./types";

const COLUMNS: Array<{ id: keyof CutoffRecord; label: string; numeric?: boolean }> = [
  { id: "rank", label: "Rank", numeric: true },
  { id: "percentile", label: "Percentile", numeric: true },
  { id: "college_name", label: "College" },
  { id: "course_name", label: "Program" },
  { id: "choice_code", label: "Choice code" },
  { id: "merit_exam", label: "Exam" },
];

// "JEE(Main)-2024" reads as "JEE Main"; the year is in the page header.
function examLabel(value: string) {
  return value.replace(/[-\s]*20\d\d$/, "").replace(/JEE\s*\(\s*Main\s*\)/i, "JEE Main");
}

function formatPercentile(value: string | number) {
  const number = Number(value);
  return Number.isFinite(number) ? (Math.trunc(number * 100) / 100).toFixed(2) : "—";
}

export function DataTable({
  data,
  loading,
  sorting,
  onSortChange,
  collegeNames,
  skeletonRows = 12,
}: {
  data: CutoffRecord[];
  loading: boolean;
  sorting: SortingState;
  onSortChange: (sorting: SortingState) => void;
  // The 2024 list title-cases names; show them as the college pages spell them.
  collegeNames: Record<string, string>;
  skeletonRows?: number;
}) {
  const sort = sorting[0];

  function toggleSort(id: string) {
    // Percentiles read best high-to-low; everything else starts ascending.
    onSortChange([{ id, desc: sort?.id === id ? !sort.desc : id === "percentile" }]);
  }

  return (
    <div className="mht-data-scroll">
      <table className="mht-data" aria-busy={loading}>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
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
                  {COLUMNS.map((column) => (
                    <td key={column.id} data-col={column.id}>
                      <span className="mht-skeleton mht-data-skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((row) => {
                const path = getCanonicalMhtCetCollegePath(row.institute_code);
                const name = collegeNames[String(Number(row.institute_code))] ?? row.college_name;
                return (
                  <tr key={row.id}>
                    <td className="mht-data-num" data-col="rank">
                      <strong>{Number(row.rank).toLocaleString("en-IN")}</strong>
                    </td>
                    <td className="mht-data-num" data-col="percentile" title={String(row.percentile)}>
                      {formatPercentile(row.percentile)}
                    </td>
                    <td className="mht-data-college" data-col="college_name">
                      {path ? <Link href={path}>{name}</Link> : <span>{name}</span>}
                      <small className="mht-code">{String(row.institute_code).padStart(5, "0")}</small>
                    </td>
                    <td data-col="course_name">{row.course_name}</td>
                    <td className="mht-code" data-col="choice_code">
                      {row.choice_code}
                    </td>
                    <td data-col="merit_exam">
                      <span className="mht-chip">{examLabel(row.merit_exam)}</span>
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
