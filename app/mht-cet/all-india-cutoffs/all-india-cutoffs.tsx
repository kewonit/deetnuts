"use client";

import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SortingState } from "@tanstack/react-table";
import MhtPill from "@/components/admissions/MhtPill";
import { MhtPagination } from "@/components/admissions/MhtPagination";
import { ALL_INDIA_ROUNDS_BY_YEAR, ALL_INDIA_YEARS } from "@/lib/mht-cet/all-india/config";
import { DataTable } from "./data-table";
import { Filters } from "./filters";
import { DEFAULT_SORTING, EMPTY_FILTERS, type AllIndiaInitialPage } from "./query";
import { useAllIndiaCutoffs } from "./use-all-india-cutoffs";
import type { FilterState } from "./types";
import "@/components/admissions/mht-tool.css";

const PER_PAGE = 50;
const FILTER_DEBOUNCE_MS = 300;

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function AllIndiaCutoffs({
  initialYear,
  initialRound,
  initial,
}: {
  initialYear: number;
  initialRound: number;
  initial: AllIndiaInitialPage | null;
}) {
  const [year, setYear] = useState(initialYear);
  const [round, setRound] = useState(initialRound);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);
  const [page, setPage] = useState(1);
  const tableRef = useRef<HTMLDivElement>(null);

  // Typing settles before a request; selections apply at once.
  const debouncedFilters = useDeferredValue(useDebounced(filters, FILTER_DEBOUNCE_MS));
  const { data, pagination, loading, error, refetch } = useAllIndiaCutoffs(
    { year, round, filters: debouncedFilters, sorting, page, perPage: PER_PAGE },
    initial,
  );

  // A new filter starts from the first page.
  const filtersKey = JSON.stringify(debouncedFilters);
  const lastFiltersKey = useRef(filtersKey);
  useEffect(() => {
    if (lastFiltersKey.current === filtersKey) return;
    lastFiltersKey.current = filtersKey;
    setPage(1);
  }, [filtersKey]);

  // Keep the year and round in the address so a reload or shared link opens the same list.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("year", String(year));
    url.searchParams.set("round", String(round));
    window.history.replaceState(window.history.state, "", url);
  }, [year, round]);

  const rounds = ALL_INDIA_ROUNDS_BY_YEAR[year] ?? [1];

  const changeYear = useCallback((value: number) => {
    setYear(value);
    setRound((current) => ((ALL_INDIA_ROUNDS_BY_YEAR[value] ?? [1]).includes(current) ? current : 1));
    setPage(1);
  }, []);

  const handlePageChange = useCallback((next: number) => {
    setPage(next);
    const top = tableRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) tableRef.current?.scrollIntoView({ block: "start" });
  }, []);

  const handleSortChange = useCallback((next: SortingState) => {
    setSorting(next);
    setPage(1);
  }, []);

  const hasFilters = Object.values(filters).some((value) => value.length > 0);
  const showAdmitted = data.some((row) => row.total_admitted !== null);

  return (
    <main className="mht-main">
      <div className="mht-page mht-page-wide">
        <nav aria-label="Breadcrumb" className="mht-crumbs">
          <Link href="/mht-cet">MHT-CET</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">All India cutoffs</span>
        </nav>
        <div className="mht-head">
          <h1 className="mht-h1">All India cutoffs</h1>
          <div className="mht-year-round">
            <MhtPill
              label="Year"
              value={String(year)}
              options={ALL_INDIA_YEARS.map((value) => ({ value: String(value), label: String(value) }))}
              onChange={(value) => changeYear(Number(value))}
            />
            <MhtPill
              label="Round"
              value={String(round)}
              options={rounds.map((value) => ({ value: String(value), label: String(value) }))}
              onChange={(value) => {
                setRound(Number(value));
                setPage(1);
              }}
            />
          </div>
        </div>

        <Filters filters={filters} onFiltersChange={setFilters} onSearch={refetch} />

        <div ref={tableRef} className="mht-card mht-data-card">
          {error && data.length === 0 ? (
            <div className="mht-data-state" role="alert">
              <span>Couldn’t load cutoffs.</span>
              <button type="button" className="mht-btn mht-btn-sm" onClick={refetch}>
                Retry
              </button>
            </div>
          ) : !loading && data.length === 0 ? (
            <div className="mht-data-state">
              <span>No cutoffs match.</span>
              {hasFilters ? (
                <button type="button" className="mht-btn mht-btn-sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <DataTable
              data={data}
              loading={loading}
              sorting={sorting}
              onSortChange={handleSortChange}
              showAdmitted={showAdmitted}
              skeletonRows={PER_PAGE}
            />
          )}
        </div>

        {pagination.totalItems > 0 ? (
          <MhtPagination
            page={page}
            perPage={PER_PAGE}
            totalItems={pagination.totalItems}
            onPageChange={handlePageChange}
            busy={loading}
          />
        ) : null}
      </div>
    </main>
  );
}
