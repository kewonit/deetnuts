"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { SortingState } from "@tanstack/react-table";
import { MhtPagination } from "@/components/admissions/MhtPagination";
import { DataTable } from "./data-table";
import { EMPTY_FILTERS, Filters } from "./filters";
import { useAllIndiaCutoffs } from "./use-all-india-cutoffs";
import { FilterState, RoundType } from "./types";
import "@/components/admissions/mht-tool.css";

// Only the 2024 Round 1 list is published.
const ROUND: RoundType = "round-one";
const PER_PAGE = 50;

export default function AllIndiaCutoffs({ collegeNames }: { collegeNames: Record<string, string> }) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sorting, setSorting] = useState<SortingState>([{ id: "rank", desc: false }]);
  const [currentPage, setCurrentPage] = useState(1);
  const tableRef = useRef<HTMLDivElement>(null);

  const { data, pagination, loading, error, refetch } = useAllIndiaCutoffs({
    round: ROUND,
    filters,
    sorting,
    page: currentPage,
    perPage: PER_PAGE,
  });

  const isInitialMount = useRef(true);
  const currentPageRef = useRef(currentPage);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Page and sort changes fetch immediately.
  useEffect(() => {
    // The filter effect below handles the first fetch.
    if (isInitialMount.current) {
      return;
    }
    refetch();
  }, [currentPage, sorting, refetch]);

  // Filter changes fetch after a pause and always return to page 1.
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (currentPageRef.current !== 1) {
        setCurrentPage(1);
      } else {
        refetch();
      }
    }, 500);

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    return () => clearTimeout(debounceTimer);
  }, [filters, refetch]);

  const handleSearch = useCallback(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      refetch();
    }
  }, [currentPage, refetch]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const top = tableRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) tableRef.current?.scrollIntoView({ block: "start" });
  }, []);

  const handleSortChange = useCallback((newSorting: SortingState) => {
    setSorting(newSorting);
    setCurrentPage(1);
  }, []);

  const hasFilters = Object.values(filters).some((value) => value.length > 0);

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
          <p className="mht-head-facts">
            <span className="mht-chip">2024</span>
            <span className="mht-chip">Round 1</span>
          </p>
        </div>

        <Filters filters={filters} onFiltersChange={setFilters} onSearch={handleSearch} />

        <div ref={tableRef} className="mht-card mht-data-card">
          {error ? (
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
              collegeNames={collegeNames}
            />
          )}
        </div>

        {pagination.totalItems > 0 && !error ? (
          <MhtPagination
            page={currentPage}
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
