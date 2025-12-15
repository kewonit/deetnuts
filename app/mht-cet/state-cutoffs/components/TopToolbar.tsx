"use client";

import { memo, useCallback } from "react";
import {
  Search,
  Download,
  Columns3,
  X,
  ChevronDown,
  ArrowUpDown,
  LayoutGrid,
  LayoutList,
  Rows3,
  Share2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getDisplayNameForRound } from "../constants";
import { toast } from "sonner";
import { CutoffRecord } from "../types";

interface TopToolbarProps {
  // Display info
  totalItems: number;
  currentPage: number;
  perPage: number;
  year: number;
  round: number;
  loading: boolean;

  // Search
  search: string;
  onSearchChange: (value: string) => void;

  // Sorting
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;

  // Density
  density: "compact" | "comfortable" | "spacious";
  onDensityChange: (density: "compact" | "comfortable" | "spacious") => void;

  // Column visibility
  visibleColumns: string[];
  onColumnVisibilityChange: (columns: string[]) => void;

  // Active filters for pills
  activeFilters: {
    categories: string[];
    courses: string[];
    statuses: string[];
    universities: string[];
  };
  onRemoveFilter: (
    type: "categories" | "courses" | "statuses" | "universities",
    value: string
  ) => void;

  // Export
  records: CutoffRecord[];

  className?: string;
}

const SORT_OPTIONS = [
  { value: "cutoff_score", label: "Percentile" },
  { value: "last_rank", label: "Rank" },
  { value: "college_name", label: "College Name" },
  { value: "course_name", label: "Course Name" },
  { value: "total_admitted", label: "Seats Admitted" },
];

const COLUMN_OPTIONS = [
  { value: "college_name", label: "College Name", required: true },
  { value: "course_name", label: "Course Name", required: true },
  { value: "category", label: "Category" },
  { value: "last_rank", label: "Rank" },
  { value: "cutoff_score", label: "Percentile", required: true },
  { value: "total_admitted", label: "Admitted" },
  { value: "college_code", label: "College Code" },
  { value: "course_code", label: "Course Code" },
  { value: "status", label: "Status" },
  { value: "home_university", label: "University" },
];

export const TopToolbar = memo(function TopToolbar({
  totalItems,
  currentPage,
  perPage,
  year,
  round,
  loading,
  search,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
  density,
  onDensityChange,
  visibleColumns,
  onColumnVisibilityChange,
  activeFilters,
  onRemoveFilter,
  records,
  className,
}: TopToolbarProps) {
  // Export to CSV
  const handleExport = useCallback(() => {
    if (records.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const headers = [
        "College Name",
        "Course Name",
        "Category",
        "Cutoff Percentile",
        "Last Rank",
        "Total Admitted",
        "College Code",
        "Course Code",
        "Status",
        "Home University",
      ];

      const csvRows = records.map((record) => [
        `"${(record.college_name || "").replace(/"/g, '""')}"`,
        `"${(record.course_name || "").replace(/"/g, '""')}"`,
        `"${record.category || ""}"`,
        record.cutoff_score || "",
        record.last_rank || "",
        record.total_admitted || "",
        record.college_code || "",
        record.course_code || "",
        `"${(record.status || "").replace(/"/g, '""')}"`,
        `"${(record.home_university || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent = [
        headers.join(","),
        ...csvRows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const fileName = `mht-cet-cutoffs-${year}-${getDisplayNameForRound(
        round
      ).replace(/\s+/g, "-")}-page-${currentPage}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${records.length} records`);
    } catch (error) {
      toast.error("Failed to export data");
    }
  }, [records, year, round, currentPage]);

  // Share URL
  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  }, []);

  // Count total active filter pills
  const totalFilterPills =
    activeFilters.categories.length +
    activeFilters.courses.length +
    activeFilters.statuses.length +
    activeFilters.universities.length;

  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Loading Progress Bar */}
      {loading && (
        <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 animate-pulse rounded-full"
            style={{
              width: "100%",
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
        </div>
      )}

      {/* Main Toolbar Row */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between bg-white/50 backdrop-blur-sm rounded-xl border-2 border-gray-200 p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)]">
        {/* Left: Results Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium text-gray-700">
                  {totalItems > 0 ? (
                    <>
                      <span className="font-bold text-gray-900">
                        {startItem.toLocaleString()}-{endItem.toLocaleString()}
                      </span>
                      <span className="text-gray-500"> of </span>
                      <span className="font-bold text-gray-900">
                        {totalItems.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500">No results</span>
                  )}
                </span>
                <Badge
                  variant="neutral"
                  className="bg-gray-100 text-gray-600 border-gray-200 text-xs"
                >
                  {year} {getDisplayNameForRound(round)}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Quick search..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 w-full sm:w-[200px] text-sm border-gray-300 focus:border-purple-500"
            />
            {search && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="neutral" size="sm" className="h-9 gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">Sort</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() =>
                    onSortChange(
                      option.value,
                      sortBy === option.value
                        ? sortOrder === "asc"
                          ? "desc"
                          : "asc"
                        : "desc"
                    )
                  }
                  className="flex items-center justify-between"
                >
                  <span>{option.label}</span>
                  {sortBy === option.value && (
                    <Badge variant="neutral" className="text-xs">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Density Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="neutral" size="sm" className="h-9 gap-2">
                {density === "compact" && <Rows3 className="h-4 w-4" />}
                {density === "comfortable" && (
                  <LayoutList className="h-4 w-4" />
                )}
                {density === "spacious" && <LayoutGrid className="h-4 w-4" />}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Density</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDensityChange("compact")}>
                <Rows3 className="h-4 w-4 mr-2" />
                Compact
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDensityChange("comfortable")}>
                <LayoutList className="h-4 w-4 mr-2" />
                Comfortable
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDensityChange("spacious")}>
                <LayoutGrid className="h-4 w-4 mr-2" />
                Spacious
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="neutral" size="sm" className="h-9 gap-2">
                <Columns3 className="h-4 w-4" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COLUMN_OPTIONS.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.value}
                  checked={visibleColumns.includes(col.value)}
                  disabled={col.required}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onColumnVisibilityChange([...visibleColumns, col.value]);
                    } else {
                      onColumnVisibilityChange(
                        visibleColumns.filter((c) => c !== col.value)
                      );
                    }
                  }}
                >
                  {col.label}
                  {col.required && (
                    <span className="text-xs text-gray-400 ml-1">•</span>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          <Button
            variant="neutral"
            size="sm"
            className="h-9 gap-2"
            onClick={handleExport}
            disabled={records.length === 0}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          {/* Share */}
          <Button
            variant="neutral"
            size="sm"
            className="h-9 gap-2"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filter Pills */}
      {totalFilterPills > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" />
            Filters:
          </span>

          {activeFilters.categories.map((cat) => (
            <Badge
              key={`cat-${cat}`}
              variant="neutral"
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer gap-1 pr-1"
              onClick={() => onRemoveFilter("categories", cat)}
            >
              {cat}
              <X className="h-3 w-3 hover:bg-blue-200 rounded" />
            </Badge>
          ))}

          {activeFilters.courses.map((course) => (
            <Badge
              key={`course-${course}`}
              variant="neutral"
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer gap-1 pr-1"
              onClick={() => onRemoveFilter("courses", course)}
            >
              {course.length > 25 ? course.slice(0, 25) + "..." : course}
              <X className="h-3 w-3 hover:bg-green-200 rounded" />
            </Badge>
          ))}

          {activeFilters.statuses.map((status) => (
            <Badge
              key={`status-${status}`}
              variant="neutral"
              className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 cursor-pointer gap-1 pr-1"
              onClick={() => onRemoveFilter("statuses", status)}
            >
              {status.length > 20 ? status.slice(0, 20) + "..." : status}
              <X className="h-3 w-3 hover:bg-orange-200 rounded" />
            </Badge>
          ))}

          {activeFilters.universities.map((uni) => (
            <Badge
              key={`uni-${uni}`}
              variant="neutral"
              className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 cursor-pointer gap-1 pr-1"
              onClick={() => onRemoveFilter("universities", uni)}
            >
              {uni.length > 20 ? uni.slice(0, 20) + "..." : uni}
              <X className="h-3 w-3 hover:bg-purple-200 rounded" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
});
