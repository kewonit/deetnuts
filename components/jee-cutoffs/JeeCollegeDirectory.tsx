"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import MhtPill from "@/components/admissions/MhtPill";
import {
  collegeSearchTier,
  prepareCollegeSearch,
} from "@/lib/admissions/college-search";

export interface JeeDirectoryCollege {
  id: string;
  name: string;
  fullName: string;
  path: string;
  type: string;
  place: string;
  state: string;
  years: number;
  aliases: string[];
  top: { rank: number; program: string } | null;
}

type Sort = "rank" | "name";

const TYPE_ORDER = ["IIT", "NIT", "IIIT", "IIEST", "SPA", "GFTI"];

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

function byName(a: JeeDirectoryCollege, b: JeeDirectoryCollege) {
  return a.name.localeCompare(b.name, "en-IN");
}

function byRank(a: JeeDirectoryCollege, b: JeeDirectoryCollege) {
  return (a.top?.rank ?? Infinity) - (b.top?.rank ?? Infinity) || byName(a, b);
}

export function JeeCollegeDirectory({
  title,
  colleges,
}: {
  title: string;
  colleges: JeeDirectoryCollege[];
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [state, setState] = useState("");
  const [sort, setSort] = useState<Sort>("rank");
  const search = useDeferredValue(query.trim());
  const searchRef = useRef<HTMLInputElement>(null);

  const types = useMemo(
    () =>
      [...new Set(colleges.map((college) => college.type))].sort(
        (a, b) =>
          (TYPE_ORDER.indexOf(a) + 1 || 99) - (TYPE_ORDER.indexOf(b) + 1 || 99),
      ),
    [colleges],
  );
  const states = useMemo(
    () =>
      [
        ...new Set(colleges.map((college) => college.state).filter(Boolean)),
      ].sort((a, b) => a.localeCompare(b, "en-IN")),
    [colleges],
  );
  const prepared = useMemo(
    () =>
      colleges.map((college) => ({
        college,
        target: prepareCollegeSearch({
          name: college.name,
          code: "",
          extra: [
            college.fullName,
            ...college.aliases,
            college.place,
            college.type,
          ],
        }),
      })),
    [colleges],
  );

  const visible = useMemo(() => {
    const compare = sort === "rank" ? byRank : byName;
    return (
      prepared
        .filter(
          ({ college }) =>
            (!type || college.type === type) &&
            (!state || college.state === state),
        )
        .map(({ college, target }) => ({
          college,
          tier: search ? collegeSearchTier(target, search) : 0,
        }))
        .filter(
          (match): match is { college: JeeDirectoryCollege; tier: number } =>
            match.tier !== null,
        )
        // Stronger matches first; the chosen sort orders within each.
        .sort((a, b) => a.tier - b.tier || compare(a.college, b.college))
        .map(({ college }) => college)
    );
  }, [prepared, search, type, state, sort]);

  useEffect(() => {
    // The list is static, so a shared ?q= is read after arrival.
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) setQuery(initial);
    function focusSearch(event: KeyboardEvent) {
      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        isTypingTarget(event.target)
      )
        return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (search) url.searchParams.set("q", search);
    else url.searchParams.delete("q");
    if (url.href !== window.location.href)
      window.history.replaceState(null, "", url);
  }, [search]);

  const filtering = Boolean(search || type || state);

  function clear() {
    setQuery("");
    setType("");
    setState("");
  }

  return (
    <>
      <div className="mht-head">
        {/* The count stays out of the h1 so the heading reads as the page topic. */}
        <div className="jee-dir-title">
          <h1 className="mht-h1">{title}</h1>
          <span className="mht-count">
            {filtering
              ? `${visible.length} of ${colleges.length}`
              : colleges.length}
          </span>
        </div>
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
            placeholder="Name, short name or city"
            autoComplete="off"
            enterKeyHint="search"
          />
          <kbd className="mht-kbd">/</kbd>
        </label>
        <div className="mht-dir-pills">
          {types.length > 1 ? (
            <MhtPill
              label="Type"
              value={type}
              emptyLabel="All"
              options={types.map((value) => ({ value, label: value }))}
              onChange={setType}
            />
          ) : null}
          <MhtPill
            label="State"
            value={state}
            emptyLabel="All"
            options={states.map((value) => ({ value, label: value }))}
            onChange={setState}
            wide
          />
        </div>
        <div className="mht-seg" role="group" aria-label="Sort">
          <button
            type="button"
            aria-pressed={sort === "rank"}
            onClick={() => setSort("rank")}
          >
            Top rank
          </button>
          <button
            type="button"
            aria-pressed={sort === "name"}
            onClick={() => setSort("name")}
          >
            Name
          </button>
        </div>
      </div>

      <div className="mht-card">
        {visible.length > 0 ? (
          <ul className="mht-dir-list">
            {visible.map((college) => (
              <li key={college.id}>
                <Link
                  className="mht-dir-row"
                  href={college.path}
                  title={college.fullName}
                >
                  <span className="mht-dir-logo jee-type" aria-hidden="true">
                    {college.type}
                  </span>
                  <span>
                    <span className="mht-dir-name">{college.name}</span>
                    <span className="mht-dir-meta">
                      {college.place} · {college.years}{" "}
                      {college.years === 1 ? "year" : "years"}
                    </span>
                  </span>
                  {college.top ? (
                    <span className="mht-dir-top">
                      <strong>
                        {college.top.rank.toLocaleString("en-IN")}
                      </strong>
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
            <button
              type="button"
              className="mht-btn mht-btn-sm"
              onClick={clear}
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </>
  );
}
