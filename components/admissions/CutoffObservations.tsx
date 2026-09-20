"use client";

import type { AdmissionsCutoffObservation } from "@/lib/admissions/types";
import { Input } from "@ejam/ui/components/ui/input";
import { useMemo, useState } from "react";

function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
  }).format(value);
}

export default function CutoffObservations({
  observations,
}: {
  observations: AdmissionsCutoffObservation[];
  system: "mht-cet";
  limit?: number;
}) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("en-IN");
    if (!search) return observations;
    return observations.filter((row) =>
      [row.programName, row.programCode, row.category, row.gender, row.quota, row.allocation]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("en-IN")
        .includes(search),
    );
  }, [observations, query]);

  if (observations.length === 0) {
    return <p className="cutoff-empty">No comparable official cutoff rows. Try another year or round.</p>;
  }

  return (
    <>
      <label className="cutoff-search">
        <span className="cutoff-sr-table">Search cutoff rows</span>
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="m12.5 12.5 4 4" />
        </svg>
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search programs or seat pools"
        />
        <span>{rows.length}</span>
      </label>
      {rows.length === 0 ? (
        <p className="cutoff-empty">No rows match this search.</p>
      ) : (
        <div className="cutoff-table-scroll">
          <table className="cutoff-table">
            <caption>Official cutoff observations</caption>
            <thead>
              <tr>
                <th scope="col">Program</th>
                <th scope="col">Seat pool</th>
                <th scope="col">Year / round</th>
                <th scope="col">Percentile</th>
                <th scope="col">Last rank</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row" data-label="Program">
                    {row.programName}
                    <small>{row.programCode}</small>
                  </th>
                  <td data-label="Seat pool">
                    {[row.category, row.gender, row.quota || row.allocation]
                      .filter(Boolean)
                      .join(" · ")}
                  </td>
                  <td data-label="Year / round">
                    {row.year} · Round {row.round}
                  </td>
                  <td data-label="Percentile">{formatNumber(row.percentileValue, 7)}</td>
                  <td data-label="Last rank">
                    <strong>{formatNumber(row.rankValue)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
