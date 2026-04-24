"use client";

import { useState, useMemo, useCallback } from "react";
import { SortingState } from "@tanstack/react-table";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  BarChart3,
  Database,
} from "lucide-react";
import { PredictionFilters } from "./types";
import { usePredictions } from "./usePredictions";
import { PredictionFiltersComponent } from "./filters";
import { formatPercentChange } from "./formatters";

// Dynamic import for heavy DataTable component - reduces initial bundle
const PredictionsTable = dynamic(
  () => import("./data-table").then((mod) => mod.PredictionsTable),
  {
    loading: () => (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    ),
    ssr: false,
  },
);

export default function PredictionsPage() {
  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  // Sorting state - default sort by change from 2025 (ascending = smallest change first)
  const [sorting, setSorting] = useState<SortingState>([
    { id: "change_from_2025", desc: false },
  ]);

  // Filter state
  const [filters, setFilters] = useState<PredictionFilters>({
    institute: "",
    branch: "",
    seatType: "",
    quota: "",
    search: "",
    minCutoff: null,
    maxCutoff: null,
    minChange: null,
    maxChange: null,
  });

  const [pendingFilters, setPendingFilters] =
    useState<PredictionFilters>(filters);
  const [isSearching, setIsSearching] = useState(false);

  // Derive sort parameters from sorting state
  const sortBy = sorting[0]?.id || "predicted_cutoff_2026";
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  // Fetch data
  const {
    data,
    loading,
    error,
    pagination,
    filters: availableFilters,
    stats,
  } = usePredictions(page, perPage, filters, sortBy, sortOrder);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(filters) !== JSON.stringify(pendingFilters);
  }, [filters, pendingFilters]);

  // Apply filters
  const applyFilters = useCallback(() => {
    setIsSearching(true);
    setFilters(pendingFilters);
    setPage(1); // Reset to first page when filters change
    setTimeout(() => setIsSearching(false), 300);
  }, [pendingFilters]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const emptyFilters: PredictionFilters = {
      institute: "",
      branch: "",
      seatType: "",
      quota: "",
      search: "",
      minCutoff: null,
      maxCutoff: null,
      minChange: null,
      maxChange: null,
    };
    setPendingFilters(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
  }, []);

  // Pagination handlers
  const goToFirstPage = () => setPage(1);
  const goToPreviousPage = () => setPage((p) => Math.max(1, p - 1));
  const goToNextPage = () =>
    setPage((p) => Math.min(pagination.totalPages, p + 1));
  const goToLastPage = () => setPage(pagination.totalPages);

  const canPreviousPage = page > 1;
  const canNextPage = page < pagination.totalPages;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-heading tracking-tight">
            JEE Main 2026 Predictions
          </h1>
          <p className="text-lg md:text-xl font-inter text-gray-700 max-w-3xl mx-auto">
            AI-powered predictions for JEE Main 2026 cutoffs based on historical
            data and trends. Find your ideal college with predicted ranks and
            changes from 2025.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="default" className="text-sm py-1 px-3">
              <Database className="mr-1 h-3 w-3" />
              {stats.totalRecords.toLocaleString()} Total Records
            </Badge>
            <Badge variant="neutral" className="text-sm py-1 px-3">
              <BarChart3 className="mr-1 h-3 w-3" />
              {stats.filteredRecords.toLocaleString()} Filtered Results
            </Badge>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2 border-black shadow-base">
            <CardHeader className="bg-main">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Avg Predicted Rank
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-3xl font-bold font-abel">
                {stats.averagePredictedCutoff === 1
                  ? "N/A"
                  : Math.round(stats.averagePredictedCutoff).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-base">
            <CardHeader className="bg-main">
              <CardTitle className="font-heading text-lg">Avg Change</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p
                className={`text-3xl font-bold font-abel ${
                  stats.averageChange > 0
                    ? "text-red-600"
                    : stats.averageChange < 0
                      ? "text-green-600"
                      : "text-gray-500"
                }`}
              >
                {stats.averageChange > 0 && "+"}
                {Math.round(stats.averageChange).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-base">
            <CardHeader className="bg-main">
              <CardTitle className="font-heading text-lg">
                Avg % Change
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p
                className={`text-3xl font-bold font-abel ${
                  stats.averagePercentChange > 0
                    ? "text-red-600"
                    : stats.averagePercentChange < 0
                      ? "text-green-600"
                      : "text-gray-500"
                }`}
              >
                {stats.averagePercentChange > 0 && "+"}
                {formatPercentChange(stats.averagePercentChange)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <PredictionFiltersComponent
          filters={filters}
          pendingFilters={pendingFilters}
          setPendingFilters={setPendingFilters}
          availableInstitutes={availableFilters.institutes}
          availableBranches={availableFilters.branches}
          availableSeatTypes={availableFilters.seatTypes}
          availableQuotas={availableFilters.quotas}
          hasUnsavedChanges={hasUnsavedChanges}
          isSearching={isSearching}
          loading={loading}
          applyFilters={applyFilters}
          clearAllFilters={clearAllFilters}
        />

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 text-center">
            <p className="font-heading text-red-800">{error}</p>
          </div>
        )}

        {/* Data Table */}
        <PredictionsTable
          data={data}
          loading={loading}
          sorting={sorting}
          setSorting={setSorting}
        />

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <Card className="border-2 border-black shadow-base">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <label className="font-heading text-sm">Rows per page:</label>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="border-2 border-black rounded-md px-2 py-1 font-abel"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>

                <div className="font-abel text-sm">
                  Page {page} of {pagination.totalPages} (
                  {pagination.totalRecords} total records)
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={goToFirstPage}
                    disabled={!canPreviousPage}
                    className="border-2 border-black"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={!canPreviousPage}
                    className="border-2 border-black"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={!canNextPage}
                    className="border-2 border-black"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={goToLastPage}
                    disabled={!canNextPage}
                    className="border-2 border-black"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <Card className="border-2 border-black shadow-base bg-gradient-to-r from-purple-100 to-yellow-100">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              📊 Understanding the Predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-inter text-sm">
            <p>
              <strong>Predicted Rank 2026:</strong> Our AI model&apos;s
              prediction for the closing rank in 2026 based on historical
              trends.
            </p>
            <p>
              <strong>Change from 2025:</strong> Positive values (🔴) mean ranks
              increased (easier to get admission). Negative values (🟢) mean
              ranks decreased (harder to get admission).
            </p>
            <p>
              <strong>% Change:</strong> The percentage change in cutoff ranks
              compared to 2025.
            </p>
            <p className="text-xs text-gray-600 mt-4">
              ⚠️ These predictions are based on historical data and should be
              used as a reference only. Actual cutoffs may vary based on exam
              difficulty, number of applicants, and other factors.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
