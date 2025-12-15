"use client";

import { memo, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CutoffRecord } from "../types";
import { calculatePercentileDistance } from "../utils";

interface DataTableProps {
  records: CutoffRecord[];
  totalItems: number;
  currentPage: number;
  perPage: number;
  loading: boolean;
  paginationLoading: boolean;
  percentileTarget: string;
  density: "compact" | "comfortable" | "spacious";
  visibleColumns: string[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

const DENSITY_ROW_HEIGHT = {
  compact: 40,
  comfortable: 52,
  spacious: 64,
};

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 200];

// Percentile distance badge component
function PercentileDistanceBadge({
  current,
  target,
}: {
  current: number;
  target: number;
}) {
  const distance = calculatePercentileDistance(current, target);
  const isTarget = Math.abs(distance) < 0.01;

  return (
    <Badge
      variant="neutral"
      className={cn(
        "text-[10px] px-1.5 py-0 font-semibold",
        isTarget
          ? "bg-green-100 text-green-700 border-green-300"
          : distance < 0
          ? "bg-blue-100 text-blue-700 border-blue-300"
          : "bg-red-100 text-red-700 border-red-300"
      )}
    >
      {isTarget
        ? "✓ TARGET"
        : `${distance > 0 ? "-" : ""}${Math.abs(distance).toFixed(2)}%`}
    </Badge>
  );
}

// Table Skeleton for loading state
function TableSkeleton({
  rows,
  density,
}: {
  rows: number;
  density: "compact" | "comfortable" | "spacious";
}) {
  const height = DENSITY_ROW_HEIGHT[density];
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr
          key={`skeleton-${i}`}
          style={{ height }}
          className="border-b border-gray-100"
        >
          <td className="px-3 py-2">
            <Skeleton className="h-4 w-full max-w-[250px]" />
          </td>
          <td className="px-3 py-2">
            <Skeleton className="h-4 w-full max-w-[200px]" />
          </td>
          <td className="px-3 py-2">
            <Skeleton className="h-6 w-16 rounded-full" />
          </td>
          <td className="px-3 py-2">
            <Skeleton className="h-4 w-20" />
          </td>
          <td className="px-3 py-2">
            <Skeleton className="h-4 w-20" />
          </td>
          <td className="px-3 py-2">
            <Skeleton className="h-4 w-16" />
          </td>
        </tr>
      ))}
    </>
  );
}

// Empty state
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-10 h-10 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        No results found
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        {hasFilters
          ? "Try adjusting your filters or enter a percentile to see matching cutoffs."
          : "Enter your percentile score to find colleges and courses that match your score."}
      </p>
    </div>
  );
}

// Pagination component with smart page numbers
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  loading,
  onPageChange,
  onPerPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}) {
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  // Generate smart page numbers (show first, last, current and neighbors)
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const showPages = 5; // Max visible page numbers

    if (totalPages <= showPages + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if near start or end
      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      // Add ellipsis before range if needed
      if (start > 2) {
        pages.push("ellipsis");
      }

      // Add page numbers in range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis after range if needed
      if (end < totalPages - 1) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t-2 border-gray-200 bg-gray-50/80">
      {/* Results info */}
      <div className="text-sm text-gray-600">
        Showing{" "}
        <span className="font-bold text-gray-900">
          {startItem.toLocaleString()}
        </span>{" "}
        to{" "}
        <span className="font-bold text-gray-900">
          {endItem.toLocaleString()}
        </span>{" "}
        of{" "}
        <span className="font-bold text-gray-900">
          {totalItems.toLocaleString()}
        </span>{" "}
        results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-3">
        {/* Per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden sm:inline">Rows:</span>
          <Select
            value={perPage.toString()}
            onValueChange={(v) => onPerPageChange(parseInt(v))}
          >
            <SelectTrigger className="w-[70px] h-8 text-xs border-2 border-gray-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt}
                  value={opt.toString()}
                  className="text-xs"
                >
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          {/* First & Previous */}
          <Button
            variant="neutral"
            size="sm"
            className="h-8 w-8 p-0 border-2"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || loading}
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="neutral"
            size="sm"
            className="h-8 w-8 p-0 border-2"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <div className="hidden sm:flex items-center gap-1">
            {pageNumbers.map((pageNum, idx) =>
              pageNum === "ellipsis" ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                  ...
                </span>
              ) : (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "neutral"}
                  size="sm"
                  className={cn(
                    "h-8 min-w-[32px] p-0 border-2 text-xs font-bold",
                    pageNum === currentPage &&
                      "bg-purple-600 text-white border-purple-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  )}
                  onClick={() => onPageChange(pageNum)}
                  disabled={loading}
                >
                  {pageNum}
                </Button>
              )
            )}
          </div>

          {/* Mobile page indicator */}
          <span className="sm:hidden px-3 text-sm font-bold text-gray-700 min-w-[80px] text-center">
            {currentPage} / {totalPages}
          </span>

          {/* Next & Last */}
          <Button
            variant="neutral"
            size="sm"
            className="h-8 w-8 p-0 border-2"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="neutral"
            size="sm"
            className="h-8 w-8 p-0 border-2"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages || loading}
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main Data Table Component
export const DataTable = memo(function DataTable({
  records,
  totalItems,
  currentPage,
  perPage,
  loading,
  paginationLoading,
  percentileTarget,
  density,
  visibleColumns,
  sortBy,
  sortOrder,
  onPageChange,
  onPerPageChange,
  onSortChange,
}: DataTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const hasPercentileTarget =
    percentileTarget && !isNaN(parseFloat(percentileTarget));
  const targetPercentile = hasPercentileTarget
    ? parseFloat(percentileTarget)
    : 0;

  // Keyboard navigation for pagination
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      const totalPages = Math.ceil(totalItems / perPage);

      if (e.key === "ArrowLeft" && currentPage > 1) {
        e.preventDefault();
        onPageChange(currentPage - 1);
      } else if (e.key === "ArrowRight" && currentPage < totalPages) {
        e.preventDefault();
        onPageChange(currentPage + 1);
      } else if (e.key === "Home" && e.ctrlKey && currentPage !== 1) {
        e.preventDefault();
        onPageChange(1);
      } else if (e.key === "End" && e.ctrlKey && currentPage !== totalPages) {
        e.preventDefault();
        onPageChange(totalPages);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalItems, perPage, onPageChange]);

  // Build columns based on visibility
  const columns = useMemo<ColumnDef<CutoffRecord>[]>(() => {
    const cols: ColumnDef<CutoffRecord>[] = [];

    // College Name (always visible)
    if (visibleColumns.includes("college_name")) {
      cols.push({
        accessorKey: "college_name",
        header: ({ column }) => (
          <button
            onClick={() =>
              onSortChange(
                "college_name",
                sortBy === "college_name"
                  ? sortOrder === "asc"
                    ? "desc"
                    : "asc"
                  : "asc"
              )
            }
            className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
          >
            College Name
            {sortBy === "college_name" ? (
              sortOrder === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="font-medium text-gray-900 truncate max-w-[280px] cursor-help">
                  {row.getValue("college_name")}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <p>{row.getValue("college_name")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        size: 300,
      });
    }

    // Course Name (always visible)
    if (visibleColumns.includes("course_name")) {
      cols.push({
        accessorKey: "course_name",
        header: ({ column }) => (
          <button
            onClick={() =>
              onSortChange(
                "course_name",
                sortBy === "course_name"
                  ? sortOrder === "asc"
                    ? "desc"
                    : "asc"
                  : "asc"
              )
            }
            className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
          >
            Course
            {sortBy === "course_name" ? (
              sortOrder === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-gray-700 truncate max-w-[220px] cursor-help">
                  {row.getValue("course_name")}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <p>{row.getValue("course_name")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        size: 240,
      });
    }

    // Category
    if (visibleColumns.includes("category")) {
      cols.push({
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge
            variant="neutral"
            className="text-xs font-medium bg-gray-100 text-gray-700 border-gray-200"
          >
            {row.getValue("category")}
          </Badge>
        ),
        size: 100,
      });
    }

    // Rank
    if (visibleColumns.includes("last_rank")) {
      cols.push({
        accessorKey: "last_rank",
        header: ({ column }) => (
          <button
            onClick={() =>
              onSortChange(
                "last_rank",
                sortBy === "last_rank"
                  ? sortOrder === "asc"
                    ? "desc"
                    : "asc"
                  : "desc"
              )
            }
            className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
          >
            Rank
            {sortBy === "last_rank" ? (
              sortOrder === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const rank = row.getValue("last_rank") as string;
          const numRank = parseInt(rank);
          return (
            <div className="font-mono text-sm font-semibold text-gray-900">
              {isNaN(numRank) ? rank : numRank.toLocaleString()}
            </div>
          );
        },
        size: 100,
      });
    }

    // Percentile (always visible)
    if (visibleColumns.includes("cutoff_score")) {
      cols.push({
        accessorKey: "cutoff_score",
        header: ({ column }) => (
          <button
            onClick={() =>
              onSortChange(
                "cutoff_score",
                sortBy === "cutoff_score"
                  ? sortOrder === "asc"
                    ? "desc"
                    : "asc"
                  : "desc"
              )
            }
            className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
          >
            Percentile
            {sortBy === "cutoff_score" ? (
              sortOrder === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const percentile = row.getValue("cutoff_score") as string;
          const numPercentile = parseFloat(percentile);

          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-sm font-bold text-gray-900">
                {percentile}%
              </span>
              {hasPercentileTarget && !isNaN(numPercentile) && (
                <PercentileDistanceBadge
                  current={numPercentile}
                  target={targetPercentile}
                />
              )}
            </div>
          );
        },
        size: 120,
      });
    }

    // Admitted
    if (visibleColumns.includes("total_admitted")) {
      cols.push({
        accessorKey: "total_admitted",
        header: ({ column }) => (
          <button
            onClick={() =>
              onSortChange(
                "total_admitted",
                sortBy === "total_admitted"
                  ? sortOrder === "asc"
                    ? "desc"
                    : "asc"
                  : "desc"
              )
            }
            className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
          >
            Admitted
            {sortBy === "total_admitted" ? (
              sortOrder === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-sm text-gray-700">
            {(row.getValue("total_admitted") as number).toLocaleString()}
          </div>
        ),
        size: 90,
      });
    }

    // College Code
    if (visibleColumns.includes("college_code")) {
      cols.push({
        accessorKey: "college_code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-gray-500">
            {row.getValue("college_code")}
          </span>
        ),
        size: 80,
      });
    }

    // Course Code
    if (visibleColumns.includes("course_code")) {
      cols.push({
        accessorKey: "course_code",
        header: "C.Code",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-gray-500">
            {row.getValue("course_code")}
          </span>
        ),
        size: 80,
      });
    }

    // Status
    if (visibleColumns.includes("status")) {
      cols.push({
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-gray-600 truncate max-w-[140px] block cursor-help">
                  {row.getValue("status")}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{row.getValue("status")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        size: 150,
      });
    }

    // University
    if (visibleColumns.includes("home_university")) {
      cols.push({
        accessorKey: "home_university",
        header: "University",
        cell: ({ row }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-gray-600 truncate max-w-[160px] block cursor-help">
                  {row.getValue("home_university")}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{row.getValue("home_university")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        size: 180,
      });
    }

    return cols;
  }, [
    visibleColumns,
    sortBy,
    sortOrder,
    hasPercentileTarget,
    targetPercentile,
    onSortChange,
  ]);

  // TanStack Table instance
  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const { rows } = table.getRowModel();
  const totalPages = Math.ceil(totalItems / perPage);

  // Show empty state if no records
  if (!loading && records.length === 0) {
    return (
      <div className="border-2 border-gray-200 rounded-xl bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
        <EmptyState hasFilters={!!percentileTarget} />
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-300 rounded-xl bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Keyboard navigation hint */}
      <div className="hidden lg:flex items-center justify-end px-3 py-1.5 bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 gap-3">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[9px] font-mono shadow-sm">
            ←
          </kbd>
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[9px] font-mono shadow-sm">
            →
          </kbd>
          <span>Navigate pages</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[9px] font-mono shadow-sm">
            Ctrl
          </kbd>
          +
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[9px] font-mono shadow-sm">
            Home
          </kbd>
          /
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[9px] font-mono shadow-sm">
            End
          </kbd>
          <span>First/Last page</span>
        </span>
      </div>

      {/* Table Container */}
      <div className="relative">
        {/* Loading overlay for pagination */}
        {paginationLoading && (
          <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-gray-300 shadow-lg">
              <div className="h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-gray-700">
                Loading...
              </span>
            </div>
          </div>
        )}
        <div
          ref={parentRef}
          className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          style={{ maxHeight: "calc(100vh - 280px)", minHeight: "500px" }}
        >
          <table className="w-full border-collapse">
            {/* Header */}
            <thead className="sticky top-0 z-10 bg-gray-50 border-b-2 border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "px-3 py-3 text-left text-xs uppercase tracking-wider",
                        "border-r border-gray-200 last:border-r-0"
                      )}
                      style={{ width: header.getSize() }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-100">
              {loading && records.length === 0 ? (
                // Only show skeletons on initial load, not pagination
                <TableSkeleton rows={perPage} density={density} />
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "hover:bg-purple-50/50 transition-colors",
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                      paginationLoading && "opacity-60"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-3 border-r border-gray-100 last:border-r-0",
                          density === "compact"
                            ? "py-1"
                            : density === "spacious"
                            ? "py-4"
                            : "py-2"
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          perPage={perPage}
          loading={loading || paginationLoading}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
        />
      )}
    </div>
  );
});
