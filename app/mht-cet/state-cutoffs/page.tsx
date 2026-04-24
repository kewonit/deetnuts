"use client";

import {
  Suspense,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  useQueryState,
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  parseAsStringLiteral,
} from "nuqs";
import dynamic from "next/dynamic";
import {
  Menu,
  X,
  Sparkles,
  TrendingUp,
  GraduationCap,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FilterSidebar } from "./components/FilterSidebar";
import { MobileFilterToast } from "./components/MobileFilterToast";
import { TopToolbar } from "./components/TopToolbar";
import { useCutoffData } from "./hooks/use-cutoff-data";
import { getDisplayNameForRound } from "./constants";
import { getClampedPage } from "./pagination";
import {
  closeMobileFilterToast,
  getMobileFilterToastConfig,
  openMobileFilterToast,
  shouldAutoDismissMobileFilterToast,
} from "./mobile-filter-toast-controller";

// Dynamic import for heavy DataTable component - reduces initial bundle
const DataTable = dynamic(
  () => import("./components/DataTable").then((mod) => mod.DataTable),
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

// Default visible columns
const DEFAULT_COLUMNS = [
  "college_name",
  "course_name",
  "category",
  "last_rank",
  "cutoff_score",
  "total_admitted",
];

const ESTIMATED_MAX_RANK = 300000; // used to approximate percentile from rank

function rankToPercentile(rank: string) {
  const n = parseFloat(rank);
  if (isNaN(n) || n <= 0) return "";
  const pct = 100 - (n / ESTIMATED_MAX_RANK) * 100;
  return Math.max(0, Math.min(100, pct)).toFixed(6);
}

// Stats Card Component
function StatsCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border-2",
        "bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
        color,
      )}
    >
      <div
        className={cn(
          "p-2 rounded-lg",
          color.replace("border-", "bg-").replace("-500", "-100"),
        )}
      >
        <Icon className={cn("h-4 w-4", color.replace("border-", "text-"))} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// Main Page Content Component
function StateCutoffsContent() {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // URL State with nuqs
  const [percentile, setPercentile] = useQueryState(
    "percentile",
    parseAsString.withDefault(""),
  );
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [year, setYear] = useQueryState(
    "year",
    parseAsInteger.withDefault(2025),
  );
  const [round, setRound] = useQueryState(
    "round",
    parseAsInteger.withDefault(1),
  );
  const [categories, setCategories] = useQueryState(
    "categories",
    parseAsArrayOf(parseAsString, ",").withDefault([]),
  );
  const [courses, setCourses] = useQueryState(
    "courses",
    parseAsArrayOf(parseAsString, ",").withDefault([]),
  );
  const [statuses, setStatuses] = useQueryState(
    "statuses",
    parseAsArrayOf(parseAsString, ",").withDefault([]),
  );
  const [universities, setUniversities] = useQueryState(
    "universities",
    parseAsArrayOf(parseAsString, ",").withDefault([]),
  );
  const [scoreMode, setScoreMode] = useQueryState(
    "scoreMode",
    parseAsStringLiteral(["percentile", "rank"] as const).withDefault(
      "percentile",
    ),
  );
  const [rank, setRank] = useQueryState("rank", parseAsString.withDefault(""));
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState(
    "perPage",
    parseAsInteger.withDefault(25),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsString.withDefault("cutoff_score"),
  );
  const [sortOrder, setSortOrder] = useQueryState(
    "sortOrder",
    parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
  );
  const [density, setDensity] = useQueryState(
    "density",
    parseAsStringLiteral([
      "compact",
      "comfortable",
      "spacious",
    ] as const).withDefault("comfortable"),
  );

  // Local state for column visibility
  const [visibleColumns, setVisibleColumns] =
    useState<string[]>(DEFAULT_COLUMNS);

  // Data fetching hook
  const {
    records,
    totalItems,
    loading,
    paginationLoading,
    hasFetched,
    searchInsight,
    error,
    fetchData,
    clearCache,
  } = useCutoffData();

  // Debounce refs
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<string>("");

  // Derive percentile to fetch based on mode
  const percentileForFetch = useMemo(() => {
    if (scoreMode === "rank") {
      if (!rank) return "";
      return rankToPercentile(rank);
    }
    return percentile;
  }, [scoreMode, rank, percentile]);

  // Computed values
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (scoreMode === "rank" ? rank : percentile) count++;
    if (search) count++;
    if (categories.length > 0) count++;
    if (courses.length > 0) count++;
    if (statuses.length > 0) count++;
    if (universities.length > 0) count++;
    return count;
  }, [
    scoreMode,
    rank,
    percentile,
    search,
    categories,
    courses,
    statuses,
    universities,
  ]);

  const clampedPage = useMemo(
    () => getClampedPage(page, perPage, totalItems),
    [page, perPage, totalItems],
  );

  // Ensure round is valid for the selected year.
  useEffect(() => {
    if (year === 2024 && round > 3) {
      setRound(1);
    }
  }, [year, round, setRound]);

  useEffect(() => {
    if (!hasFetched || loading || paginationLoading) {
      return;
    }

    if (clampedPage !== page) {
      setPage(clampedPage);
    }
  }, [clampedPage, hasFetched, loading, page, paginationLoading, setPage]);

  // Fetch data when filters change (debounced)
  useEffect(() => {
    const fetchKey = JSON.stringify({
      percentileForFetch,
      scoreMode,
      rank,
      search,
      year,
      round,
      categories,
      courses,
      statuses,
      universities,
      page,
      perPage,
      sortBy,
      sortOrder,
    });

    // Don't refetch if params haven't changed
    if (fetchKey === lastFetchRef.current) return;
    lastFetchRef.current = fetchKey;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (!percentileForFetch) {
        // require an input in rank or percentile mode
        return;
      }
      fetchData({
        percentileInput: percentileForFetch,
        search,
        year,
        round,
        categories,
        courses,
        statuses,
        homeUniversities: universities,
        page,
        perPage,
        sortBy,
        sortOrder,
      });
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    percentileForFetch,
    scoreMode,
    rank,
    search,
    year,
    round,
    categories,
    courses,
    statuses,
    universities,
    page,
    perPage,
    sortBy,
    sortOrder,
    fetchData,
  ]);

  // Handlers
  const handleClearAll = useCallback(async () => {
    clearCache();
    await Promise.all([
      setPercentile(null),
      setRank(null),
      setScoreMode("percentile"),
      setSearch(null),
      setCategories(null),
      setCourses(null),
      setStatuses(null),
      setUniversities(null),
      setPage(1),
      setSortBy("cutoff_score"),
      setSortOrder("desc"),
    ]);
  }, [
    setPercentile,
    setRank,
    setScoreMode,
    setSearch,
    setCategories,
    setCourses,
    setStatuses,
    setUniversities,
    setPage,
    setSortBy,
    setSortOrder,
    clearCache,
  ]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    [setPage],
  );

  const handlePerPageChange = useCallback(
    (newPerPage: number) => {
      setPerPage(newPerPage);
      setPage(1);
    },
    [setPerPage, setPage],
  );

  const handleSortChange = useCallback(
    (newSortBy: string, newSortOrder: "asc" | "desc") => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
    },
    [setSortBy, setSortOrder],
  );

  const handleRemoveFilter = useCallback(
    (
      type: "categories" | "courses" | "statuses" | "universities",
      value: string,
    ) => {
      switch (type) {
        case "categories":
          setCategories(categories.filter((c) => c !== value));
          break;
        case "courses":
          setCourses(courses.filter((c) => c !== value));
          break;
        case "statuses":
          setStatuses(statuses.filter((s) => s !== value));
          break;
        case "universities":
          setUniversities(universities.filter((u) => u !== value));
          break;
      }
      setPage(1);
    },
    [
      categories,
      courses,
      statuses,
      universities,
      setCategories,
      setCourses,
      setStatuses,
      setUniversities,
      setPage,
    ],
  );

  // Memoized handlers for filter sidebar to prevent re-renders
  const handlePercentileChange = useCallback(
    (v: string) => {
      setPercentile(v || null);
      setPage(1);
    },
    [setPercentile, setPage],
  );
  const handleYearChange = useCallback(
    (v: number) => {
      setYear(v);
      setPage(1);
      clearCache();
    },
    [setYear, setPage, clearCache],
  );
  const handleRoundChange = useCallback(
    (v: number) => {
      setRound(v);
      setPage(1);
      clearCache();
    },
    [setRound, setPage, clearCache],
  );
  const handleCategoriesChange = useCallback(
    (v: string[]) => {
      setCategories(v.length > 0 ? v : null);
      setPage(1);
    },
    [setCategories, setPage],
  );
  const handleCoursesChange = useCallback(
    (v: string[]) => {
      setCourses(v.length > 0 ? v : null);
      setPage(1);
    },
    [setCourses, setPage],
  );
  const handleStatusesChange = useCallback(
    (v: string[]) => {
      setStatuses(v.length > 0 ? v : null);
      setPage(1);
    },
    [setStatuses, setPage],
  );
  const handleUniversitiesChange = useCallback(
    (v: string[]) => {
      setUniversities(v.length > 0 ? v : null);
      setPage(1);
    },
    [setUniversities, setPage],
  );
  const handleScoreModeChange = useCallback(
    (mode: "percentile" | "rank") => {
      setScoreMode(mode);
      setPage(1);
    },
    [setScoreMode, setPage],
  );
  const handleRankChange = useCallback(
    (v: string) => {
      setRank(v || null);
      setPage(1);
    },
    [setRank, setPage],
  );
  const handleToolbarSearchChange = useCallback(
    (v: string) => {
      setSearch(v || null);
      setPage(1);
    },
    [setSearch, setPage],
  );
  const handleDensityChange = useCallback(
    (v: "compact" | "comfortable" | "spacious") => setDensity(v),
    [setDensity],
  );

  // Filter sidebar props - memoized
  const filterSidebarProps = useMemo(
    () => ({
      percentile,
      year,
      round,
      categories,
      courses,
      statuses,
      universities,
      scoreMode,
      rank,
      onPercentileChange: handlePercentileChange,
      onYearChange: handleYearChange,
      onRoundChange: handleRoundChange,
      onCategoriesChange: handleCategoriesChange,
      onCoursesChange: handleCoursesChange,
      onStatusesChange: handleStatusesChange,
      onUniversitiesChange: handleUniversitiesChange,
      onScoreModeChange: handleScoreModeChange,
      onRankChange: handleRankChange,
      onClearAll: handleClearAll,
      activeFilterCount,
    }),
    [
      percentile,
      scoreMode,
      rank,
      year,
      round,
      categories,
      courses,
      statuses,
      universities,
      handlePercentileChange,
      handleYearChange,
      handleRoundChange,
      handleCategoriesChange,
      handleCoursesChange,
      handleStatusesChange,
      handleUniversitiesChange,
      handleScoreModeChange,
      handleRankChange,
      handleClearAll,
      activeFilterCount,
    ],
  );

  const handleCloseMobileFilterToast = useCallback(() => {
    setMobileFilterOpen(false);
    closeMobileFilterToast(toast.dismiss);
  }, []);

  const mobileFilterToastContent = useMemo(
    () => (
      <MobileFilterToast
        {...filterSidebarProps}
        onApply={handleCloseMobileFilterToast}
        onClose={handleCloseMobileFilterToast}
      />
    ),
    [filterSidebarProps, handleCloseMobileFilterToast],
  );

  const renderMobileFilterToast = useCallback(() => {
    const config = getMobileFilterToastConfig();

    return toast.custom(() => mobileFilterToastContent, {
      ...config,
      onDismiss: () => setMobileFilterOpen(false),
    });
  }, [mobileFilterToastContent]);

  const handleOpenMobileFilterToast = useCallback(() => {
    openMobileFilterToast(() => renderMobileFilterToast(), toast.dismiss);
    setMobileFilterOpen(true);
  }, [renderMobileFilterToast]);

  const handleToggleMobileFilters = useCallback(() => {
    if (mobileFilterOpen) {
      handleCloseMobileFilterToast();
      return;
    }

    handleOpenMobileFilterToast();
  }, [
    mobileFilterOpen,
    handleCloseMobileFilterToast,
    handleOpenMobileFilterToast,
  ]);

  useEffect(() => {
    if (!mobileFilterOpen) {
      return;
    }

    renderMobileFilterToast();
  }, [mobileFilterOpen, renderMobileFilterToast]);

  useEffect(() => {
    const handleResize = () => {
      if (
        mobileFilterOpen &&
        shouldAutoDismissMobileFilterToast(window.innerWidth)
      ) {
        handleCloseMobileFilterToast();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileFilterOpen, handleCloseMobileFilterToast]);

  useEffect(() => {
    return () => {
      closeMobileFilterToast(toast.dismiss);
    };
  }, []);

  // Active filters for toolbar - memoized
  const activeFilters = useMemo(
    () => ({
      categories,
      courses,
      statuses,
      universities,
    }),
    [categories, courses, statuses, universities],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4DFF2] via-[#daf5f0] to-[#E4DFF2]">
      {/* Mobile Filter Toggle - Fixed at bottom */}
      <div
        className={cn(
          "lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-200",
          mobileFilterOpen && "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <Button
          aria-expanded={mobileFilterOpen}
          aria-pressed={mobileFilterOpen}
          className={cn(
            "h-14 px-6 rounded-full font-bold text-base",
            mobileFilterOpen
              ? "bg-black text-white hover:bg-black/90"
              : "bg-purple-600 text-white hover:bg-purple-700",
            "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            "border-2 border-black",
            "flex items-center gap-2",
          )}
          onClick={handleToggleMobileFilters}
        >
          {mobileFilterOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          {mobileFilterOpen ? "Close filters" : "Filters"}
          {activeFilterCount > 0 && (
            <Badge className="bg-white text-purple-700 border-0 ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Main Layout */}
      <div className="flex min-h-screen">
        {/* Desktop Sidebar - Sticky with perfect viewport fit */}
        <aside className="hidden lg:block w-[380px] flex-shrink-0">
          <div className="sticky top-0 left-0 w-[380px] h-screen bg-white border-r-2 border-gray-200 shadow-lg overflow-hidden">
            <FilterSidebar {...filterSidebarProps} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-4 lg:px-8 pb-24 lg:pb-8 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto space-y-5 py-5">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl xl:text-4xl font-black text-gray-900 tracking-tight">
                  MHT-CET State Cutoffs
                </h1>
                <Badge className="bg-purple-100 text-purple-700 border-purple-300 font-bold text-sm">
                  {year} {getDisplayNameForRound(round)}
                </Badge>
              </div>
              <p className="text-gray-600 text-sm lg:text-base">
                Find colleges and courses matching your percentile. Enter your
                score to discover admission opportunities.
              </p>
            </div>

            {/* Quick Stats */}
            {totalItems > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatsCard
                  icon={TrendingUp}
                  label="Total Results"
                  value={totalItems.toLocaleString()}
                  color="border-purple-500"
                />
                <StatsCard
                  icon={GraduationCap}
                  label="Courses"
                  value={new Set(records.map((r) => r.course_name)).size}
                  color="border-blue-500"
                />
                <StatsCard
                  icon={Building2}
                  label="Colleges"
                  value={new Set(records.map((r) => r.college_name)).size}
                  color="border-green-500"
                />
                <StatsCard
                  icon={Sparkles}
                  label="Target"
                  value={
                    scoreMode === "rank"
                      ? rank
                        ? `Rank ${rank}`
                        : "Not set"
                      : percentile
                        ? `${percentile}%`
                        : "Not set"
                  }
                  color="border-orange-500"
                />
              </div>
            )}

            {/* Toolbar */}
            <TopToolbar
              totalItems={totalItems}
              currentPage={page}
              perPage={perPage}
              year={year}
              round={round}
              loading={loading}
              search={search}
              onSearchChange={handleToolbarSearchChange}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              density={density}
              onDensityChange={handleDensityChange}
              visibleColumns={visibleColumns}
              onColumnVisibilityChange={setVisibleColumns}
              activeFilters={activeFilters}
              onRemoveFilter={handleRemoveFilter}
              records={records}
            />

            {/* Data Table */}
            <DataTable
              records={records}
              totalItems={totalItems}
              currentPage={page}
              perPage={perPage}
              loading={loading}
              paginationLoading={paginationLoading}
              error={error}
              search={search}
              searchInsight={searchInsight}
              percentileTarget={percentileForFetch}
              density={density}
              visibleColumns={visibleColumns}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
              onSortChange={handleSortChange}
            />

            {/* Help Section */}
            {!percentile && records.length === 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  How to use this tool
                </h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span>
                      Enter your MHT-CET percentile in the filter panel
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <span>
                      Optionally filter by category, course, college type, or
                      university
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <span>
                      Browse results to find colleges where you have admission
                      chances
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <span>
                      Export results or share the URL with your filters
                      preserved
                    </span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Main Page Export with Suspense boundary
export default function StateCutoffsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#E4DFF2] via-[#daf5f0] to-[#E4DFF2] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Loading cutoff data...</p>
          </div>
        </div>
      }
    >
      <StateCutoffsContent />
    </Suspense>
  );
}
