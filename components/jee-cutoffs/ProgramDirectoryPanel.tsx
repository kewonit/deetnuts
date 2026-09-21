"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@ejam/ui/components/ui/input";

export function ProgramDirectoryPanel({
  programs,
}: {
  programs: Array<{
    id: string;
    name: string;
    degree: string;
    durationYears: number;
    path: string;
  }>;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("en-IN");
    if (!search) return programs;
    return programs.filter((program) =>
      [program.name, program.degree]
        .join(" ")
        .toLocaleLowerCase("en-IN")
        .includes(search),
    );
  }, [programs, query]);

  return (
    <details className="cutoff-disclosure">
      <summary>
        <div className="cutoff-disclosure-summary">
          <div>
            <h2 id="program-directory-title">Browse all programs</h2>
            <p>Every published degree for this college and year. Shortlist here or from the table above.</p>
          </div>
          <span className="cutoff-result-count">{programs.length.toLocaleString("en-IN")} programs</span>
        </div>
      </summary>
      <div className="cutoff-disclosure-body">
        <label className="cutoff-search">
          <span className="cutoff-sr-table">Search program directory</span>
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="m12.5 12.5 4 4" />
          </svg>
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Shortlist by program or degree"
          />
          <span>{filtered.length}</span>
        </label>
        {filtered.length ? (
          <div className="cutoff-program-list">
            {filtered.map((program) => (
              <Link href={program.path} key={program.id}>
                <strong>{program.name}</strong>
                <span>
                  {program.degree} · {program.durationYears} years
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="cutoff-empty">No programs match “{query}”.</p>
        )}
      </div>
    </details>
  );
}
