"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CutoffCollegeCatalogEntry, JeeExamId } from "@/lib/jee-cutoffs/types";

export function CollegeDirectory({
  exam,
  colleges,
}: {
  exam: JeeExamId;
  colleges: CutoffCollegeCatalogEntry[];
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("en-IN");
    if (!search) return colleges;
    return colleges.filter((college) =>
      [college.name, college.seoName, college.type, college.city, college.state]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase("en-IN").includes(search)),
    );
  }, [colleges, query]);

  return (
    <div className="cutoff-directory-wrap">
      <label className="cutoff-search">
        <span className="cutoff-sr-table">Search colleges</span>
        <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m12.5 12.5 4 4" /></svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${colleges.length} colleges`}
        />
        <span>{filtered.length}</span>
      </label>
      {filtered.length ? (
        <div className="cutoff-directory">
          {filtered.map((college) => (
            <Link className="cutoff-college-card" href={`/${exam}/colleges/${college.id}`} key={college.id}>
              <div>
                <span className="cutoff-kicker">{college.type} · {college.pages.length} years</span>
                <h3>{college.name}</h3>
                <p>{[college.city, college.state].filter(Boolean).join(", ")}</p>
              </div>
              <span className="cutoff-card-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="cutoff-empty">No colleges match “{query}”.</p>
      )}
    </div>
  );
}
