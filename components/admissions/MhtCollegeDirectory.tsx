"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import MhtPill from "@/components/admissions/MhtPill";
import { collegeSearchTier, prepareCollegeSearch } from "@/lib/admissions/college-search";

export interface MhtDirectoryCollege {
  code: string;
  name: string;
  path: string;
  university: string;
  status: string;
  logo: { src: string; background?: string } | null;
  top: { percentile: number; program: string } | null;
}

type Sort = "cutoff" | "name";

function formatPercentile(value: number) {
  return (Math.trunc(value * 100) / 100).toFixed(2);
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "en-IN"));
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

function byName(a: MhtDirectoryCollege, b: MhtDirectoryCollege) {
  return a.name.localeCompare(b.name, "en-IN");
}

function byCutoff(a: MhtDirectoryCollege, b: MhtDirectoryCollege) {
  return (b.top?.percentile ?? -1) - (a.top?.percentile ?? -1) || byName(a, b);
}

export default function MhtCollegeDirectory({
  colleges,
  initialQuery,
}: {
  colleges: MhtDirectoryCollege[];
  initialQuery: string;
}) {
  const hasCutoffs = colleges.some((college) => college.top);
  const [query, setQuery] = useState(initialQuery);
  const [university, setUniversity] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<Sort>(hasCutoffs ? "cutoff" : "name");
  const search = useDeferredValue(query.trim());
  const searchRef = useRef<HTMLInputElement>(null);

  const universities = useMemo(() => uniqueSorted(colleges.map((c) => c.university)), [colleges]);
  const statuses = useMemo(() => uniqueSorted(colleges.map((c) => c.status)), [colleges]);
  const prepared = useMemo(
    () =>
      colleges.map((college) => ({
        college,
        target: prepareCollegeSearch({
          name: college.name,
          code: college.code,
          extra: [college.university, college.status],
        }),
      })),
    [colleges],
  );

  const visible = useMemo(() => {
    const compare = sort === "cutoff" ? byCutoff : byName;
    return prepared
      .filter(
        ({ college }) =>
          (!university || college.university === university) && (!status || college.status === status),
      )
      .map(({ college, target }) => ({ college, tier: search ? collegeSearchTier(target, search) : 0 }))
      .filter((match): match is { college: MhtDirectoryCollege; tier: number } => match.tier !== null)
      // Stronger matches first; the chosen sort orders within each.
      .sort((a, b) => a.tier - b.tier || compare(a.college, b.college))
      .map(({ college }) => college);
  }, [prepared, search, university, status, sort]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || isTypingTarget(event.target)) return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  // Keep the search in the URL so a filtered list can be shared or revisited.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (search) url.searchParams.set("q", search);
    else url.searchParams.delete("q");
    if (url.href !== window.location.href) window.history.replaceState(null, "", url);
  }, [search]);

  const filtering = Boolean(search || university || status);

  function clear() {
    setQuery("");
    setUniversity("");
    setStatus("");
  }

  return (
    <>
      <div className="mht-head">
        <h1 className="mht-h1">
          Colleges
          <span className="mht-count">
            {filtering ? `${visible.length} of ${colleges.length}` : colleges.length}
          </span>
        </h1>
      </div>

      <div className="mht-dir-bar">
        <label className="mht-search">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.75" />
            <path d="m10.5 10.5 3 3" />
          </svg>
          <span className="mht-sr">Search colleges</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, code or university"
            autoComplete="off"
            enterKeyHint="search"
          />
          <kbd className="mht-kbd">/</kbd>
        </label>
        <div className="mht-dir-pills">
          <MhtPill
            label="University"
            value={university}
            emptyLabel="All"
            options={universities.map((value) => ({ value, label: value }))}
            onChange={setUniversity}
            wide
          />
          <MhtPill
            label="Status"
            value={status}
            emptyLabel="All"
            options={statuses.map((value) => ({ value, label: value }))}
            onChange={setStatus}
            wide
          />
        </div>
        {hasCutoffs ? (
          <div className="mht-seg" role="group" aria-label="Sort">
            <button type="button" aria-pressed={sort === "cutoff"} onClick={() => setSort("cutoff")}>
              Cutoff
            </button>
            <button type="button" aria-pressed={sort === "name"} onClick={() => setSort("name")}>
              Name
            </button>
          </div>
        ) : null}
      </div>

      <div className="mht-card">
        {visible.length > 0 ? (
          <ul className="mht-dir-list">
            {visible.map((college) => (
              <li key={college.code}>
                <Link className="mht-dir-row" href={college.path}>
                  <span className="mht-dir-logo" aria-hidden="true">
                    {college.logo ? (
                      <Image
                        src={college.logo.src}
                        alt=""
                        width={40}
                        height={40}
                        sizes="40px"
                        style={college.logo.background ? { background: college.logo.background } : undefined}
                      />
                    ) : (
                      college.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span>
                    <span className="mht-dir-name">{college.name}</span>
                    <span className="mht-dir-meta">
                      <span className="mht-code">{college.code}</span>
                      {[college.university, college.status].filter(Boolean).map((part) => ` · ${part}`)}
                    </span>
                  </span>
                  {college.top ? (
                    <span className="mht-dir-top">
                      <strong>{formatPercentile(college.top.percentile)}</strong>
                      <small>{college.top.program}</small>
                    </span>
                  ) : (
                    <span />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mht-dir-empty">
            <span>No colleges match.</span>
            <button type="button" className="mht-btn mht-btn-sm" onClick={clear}>
              Clear
            </button>
          </div>
        )}
      </div>
    </>
  );
}
