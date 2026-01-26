"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  X,
  Loader2,
  LayoutGrid,
  TableIcon,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { JosaaCutoffExpanded, JosaaBranch } from "@/lib/types/josaa";
import { formatBranchCode } from "@/lib/formatBranchCode";

interface CutoffsTableProps {
  cutoffs: JosaaCutoffExpanded[];
  branches: JosaaBranch[];
  yearsAvailable: number[];
  defaultYear?: number;
  defaultCategory?: string;
  defaultGender?: string;
  instituteId?: string;
}

const CATEGORIES = [
  "OPEN",
  "EWS",
  "OBC-NCL",
  "SC",
  "ST",
  "OPEN (PwD)",
  "EWS (PwD)",
  "OBC-NCL (PwD)",
  "SC (PwD)",
  "ST (PwD)",
];

const GENDERS = ["Gender-Neutral", "Female-only (supernumerary)"];

type SortField = "branch" | "opening" | "closing" | "round";
type SortDirection = "asc" | "desc";

export default function JosaaCutoffsTable({
  cutoffs: initialCutoffs,
  branches,
  yearsAvailable,
  defaultYear,
  defaultCategory = "OPEN",
  defaultGender = "Gender-Neutral",
  instituteId,
}: CutoffsTableProps) {
  // URL state management with nuqs
  const [year, setYear] = useQueryState(
    "year",
    parseAsInteger.withDefault(defaultYear || yearsAvailable[0]),
  );
  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withDefault(defaultCategory),
  );
  const [gender, setGender] = useQueryState(
    "gender",
    parseAsString.withDefault(defaultGender),
  );
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));

  // Local state
  const [sortField, setSortField] = useState<SortField>("closing");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [mounted, setMounted] = useState(false);
  const [selectedChartBranch, setSelectedChartBranch] = useState<string>("");

  // Ensure component is mounted before rendering charts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamic cutoffs state - for when year changes and we need to fetch new data
  const [cutoffs, setCutoffs] = useState<JosaaCutoffExpanded[]>(initialCutoffs);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedYear, setLoadedYear] = useState<number>(
    defaultYear || yearsAvailable[0],
  );

  // Fetch all cutoffs for a year - handles pagination to get complete data
  const fetchCutoffsForYear = useCallback(
    async (newYear: number) => {
      if (!instituteId || newYear === loadedYear) return;

      setIsLoading(true);
      try {
        // First request - get first page and total count
        const response = await fetch(
          `/api/josaa/cutoffs?instituteId=${instituteId}&year=${newYear}&perPage=1000`,
        );
        if (response.ok) {
          const data = await response.json();
          let allCutoffs = data.items || [];

          // If there are more pages, fetch them all
          const totalPages = data.totalPages || 1;
          if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
              pagePromises.push(
                fetch(
                  `/api/josaa/cutoffs?instituteId=${instituteId}&year=${newYear}&perPage=1000&page=${page}`,
                )
                  .then((res) => res.json())
                  .then((d) => d.items || []),
              );
            }
            const additionalPages = await Promise.all(pagePromises);
            additionalPages.forEach((items) => {
              allCutoffs = [...allCutoffs, ...items];
            });
          }

          setCutoffs(allCutoffs);
          setLoadedYear(newYear);
        }
      } catch (error) {
        console.error("Error fetching cutoffs:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [instituteId, loadedYear],
  );

  // Handle year change
  const handleYearChange = useCallback(
    (newYear: string) => {
      const yearNum = parseInt(newYear);
      setYear(yearNum);
      if (instituteId && yearNum !== loadedYear) {
        fetchCutoffsForYear(yearNum);
      }
    },
    [setYear, instituteId, loadedYear, fetchCutoffsForYear],
  );

  // Create branch lookup map by original_id (12-char IDs from data files)
  // Cutoffs reference branches by branch_id which matches branch.original_id
  const branchMap = useMemo(() => {
    const map = new Map<string, JosaaBranch>();
    branches.forEach((b) => {
      // Map by original_id for cutoff lookups
      if ((b as any).original_id) {
        map.set((b as any).original_id, b);
      }
      // Also map by PocketBase id as fallback
      map.set(b.id, b);
    });
    return map;
  }, [branches]);

  // Get available rounds for selected year with current filters (for accurate info display)
  const availableRoundsInfo = useMemo(() => {
    const rounds = new Set<number>();
    let maxRound = 0;
    cutoffs
      .filter((c) => {
        if (c.year !== year) return false;
        if (c.category !== category) return false;
        if (c.gender !== gender) return false;
        return true;
      })
      .forEach((c) => {
        rounds.add(c.round);
        if (c.round > maxRound) maxRound = c.round;
      });
    return {
      uniqueRounds: Array.from(rounds).sort((a, b) => a - b),
      count: rounds.size,
      max: maxRound,
    };
  }, [cutoffs, year, category, gender]);

  // Filter and sort cutoffs - now shows ALL rounds for the selected year
  const filteredCutoffs = useMemo(() => {
    const filtered = cutoffs.filter((c) => {
      if (c.year !== year) return false;
      if (c.category !== category) return false;
      if (c.gender !== gender) return false;
      // Show all rounds - no round filtering

      // ALWAYS filter out cutoffs without matching branches
      const branchId = (c as any).branch_id || c.branch;
      let branch = branchMap.get(branchId);

      // Also try to find by short_code if branch not found by ID
      if (!branch && c.branch_code) {
        branch = branches.find((b) => b.short_code === c.branch_code);
      }

      // If still no branch found, exclude this cutoff entirely
      if (!branch) return false;

      // Search filter - use the resolved branch
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          branch.name.toLowerCase().includes(searchLower) ||
          branch.short_code.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    // Sort by branch first, then by round (ascending) to show progression
    // This ensures all rounds for a branch are grouped together - primary by selected field, secondary by round for consistency
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "branch": {
          const branchIdA = (a as any).branch_id || a.branch;
          const branchIdB = (b as any).branch_id || b.branch;
          const branchA = branchMap.get(branchIdA)?.name || "";
          const branchB = branchMap.get(branchIdB)?.name || "";
          comparison = branchA.localeCompare(branchB);
          // Secondary sort by round (ascending) if same branch
          if (comparison === 0) {
            comparison = a.round - b.round;
          }
          break;
        }
        case "opening":
          comparison = a.opening_rank - b.opening_rank;
          break;
        case "closing":
          comparison = a.closing_rank - b.closing_rank;
          break;
        case "round":
          comparison = a.round - b.round;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    cutoffs,
    year,
    category,
    gender,
    search,
    sortField,
    sortDirection,
    branchMap,
    branches,
  ]);

  // Get all rounds for expanded branch
  const getExpandedRounds = (branchId: string) => {
    return cutoffs
      .filter(
        (c) =>
          ((c as any).branch_id === branchId || c.branch === branchId) &&
          c.year === year &&
          c.category === category &&
          c.gender === gender,
      )
      .sort((a, b) => a.round - b.round);
  };

  // Toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setCategory(defaultCategory);
    setGender(defaultGender);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  // Get all rounds for a branch for the card view
  const getBranchRounds = useCallback(
    (branchId: string) => {
      return cutoffs
        .filter(
          (c) =>
            ((c as any).branch_id === branchId || c.branch === branchId) &&
            c.year === year &&
            c.category === category &&
            c.gender === gender,
        )
        .sort((a, b) => a.round - b.round);
    },
    [cutoffs, year, category, gender],
  );

  // Group cutoffs by branch for card view
  const groupedByBranch = useMemo(() => {
    const branchCutoffs = new Map<
      string,
      {
        branch: JosaaBranch | undefined;
        cutoffs: JosaaCutoffExpanded[];
        latestRound: JosaaCutoffExpanded | null;
      }
    >();

    cutoffs.forEach((c) => {
      if (c.year !== year || c.category !== category || c.gender !== gender)
        return;

      const branchId = (c as any).branch_id || c.branch;
      let branch = branchMap.get(branchId);

      if (!branch && c.branch_code) {
        branch = branches.find((b) => b.short_code === c.branch_code);
      }

      if (!branch) return;

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !branch.name.toLowerCase().includes(searchLower) &&
          !branch.short_code.toLowerCase().includes(searchLower)
        ) {
          return;
        }
      }

      if (!branchCutoffs.has(branchId)) {
        branchCutoffs.set(branchId, { branch, cutoffs: [], latestRound: null });
      }

      const entry = branchCutoffs.get(branchId)!;
      entry.cutoffs.push(c);

      if (!entry.latestRound || c.round > entry.latestRound.round) {
        entry.latestRound = c;
      }
    });

    // Sort by closing rank of latest round
    return Array.from(branchCutoffs.entries()).sort((a, b) => {
      const aRank = a[1].latestRound?.closing_rank ?? Infinity;
      const bRank = b[1].latestRound?.closing_rank ?? Infinity;
      return sortDirection === "asc" ? aRank - bRank : bRank - aRank;
    });
  }, [
    cutoffs,
    year,
    category,
    gender,
    search,
    branchMap,
    branches,
    sortDirection,
  ]);

  // Set default selected branch for chart when data changes
  useEffect(() => {
    if (groupedByBranch.length > 0 && !selectedChartBranch) {
      // Default to first branch (usually CSE or best closing rank)
      setSelectedChartBranch(groupedByBranch[0][0]);
    }
  }, [groupedByBranch, selectedChartBranch]);

  // Get chart data for selected branch - all rounds
  const chartData = useMemo(() => {
    if (!selectedChartBranch) return [];

    const branchData = groupedByBranch.find(
      ([id]) => id === selectedChartBranch,
    );
    if (!branchData) return [];

    // Deduplicate by round - keep only one entry per round
    const roundMap = new Map<number, JosaaCutoffExpanded>();
    branchData[1].cutoffs.forEach((c) => {
      // Keep the first entry for each round (or could update to keep latest)
      if (!roundMap.has(c.round)) {
        roundMap.set(c.round, c);
      }
    });

    return Array.from(roundMap.values())
      .sort((a, b) => a.round - b.round)
      .map((c) => ({
        round: `R${c.round}`,
        roundNum: c.round,
        openingRank: c.opening_rank,
        closingRank: c.closing_rank,
      }));
  }, [selectedChartBranch, groupedByBranch]);

  // Get selected branch info
  const selectedBranchInfo = useMemo(() => {
    const branchData = groupedByBranch.find(
      ([id]) => id === selectedChartBranch,
    );
    return branchData?.[1].branch;
  }, [selectedChartBranch, groupedByBranch]);

  return (
    <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden transition-all duration-300">
      <CardHeader className="border-b-4 border-black bg-gradient-to-r from-blue-100 to-blue-50">
        <CardTitle className="flex items-center justify-between flex-wrap gap-4">
          <span className="flex items-center gap-3">
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Cutoffs for</span>
            <span className="sm:hidden">Year</span>
            <span className="font-bold text-blue-700">{year}</span>
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 ml-4 bg-white rounded-lg border-2 border-black p-0.5">
              <button
                onClick={() => setViewMode("chart")}
                className={`p-1.5 rounded transition-all ${
                  viewMode === "chart"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
                title="Chart View"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded transition-all ${
                  viewMode === "table"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </span>
          <Badge
            variant="neutral"
            className="bg-white border-2 border-black transition-all duration-200 hover:scale-105"
          >
            <span className="tabular-nums">{filteredCutoffs.length}</span>
            <span className="hidden sm:inline ml-1">results</span>
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {/* Info Banner - Shows rounds info for current filters */}
        {availableRoundsInfo.count > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                📊 Showing{" "}
                <strong className="text-blue-700">
                  {availableRoundsInfo.count === 1
                    ? `Round ${availableRoundsInfo.uniqueRounds[0]}`
                    : `all ${availableRoundsInfo.count} rounds (R${availableRoundsInfo.uniqueRounds[0]}-R${availableRoundsInfo.max})`}
                </strong>{" "}
                for {year} • {category} • {gender}
              </span>
            </div>
            <Badge className="bg-blue-100 border border-blue-300 text-blue-800">
              {filteredCutoffs.length} cutoff entries
            </Badge>
          </div>
        )}

        {/* Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div>
            <label className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 block text-gray-700">
              Year
            </label>
            <Select
              value={year.toString()}
              onValueChange={handleYearChange}
              disabled={isLoading}
            >
              <SelectTrigger className="border-2 border-black">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SelectValue />
                )}
              </SelectTrigger>
              <SelectContent>
                {yearsAvailable.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="border-2 border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Gender</label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="border-2 border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((gen) => (
                  <SelectItem key={gen} value={gen}>
                    {gen}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search branches..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-2 border-black"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active filters */}
        {(search || category !== "OPEN" || gender !== "Gender-Neutral") && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {search && (
              <Badge
                variant="neutral"
                className="bg-blue-100 border border-black"
              >
                Search: {search}
                <button onClick={() => setSearch("")} className="ml-1">
                  ×
                </button>
              </Badge>
            )}
            {category !== "OPEN" && (
              <Badge
                variant="neutral"
                className="bg-green-100 border border-black"
              >
                {category}
              </Badge>
            )}
            {gender !== "Gender-Neutral" && (
              <Badge
                variant="neutral"
                className="bg-purple-100 border border-black"
              >
                {gender}
              </Badge>
            )}
            <Button
              variant="noShadow"
              size="sm"
              onClick={clearFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Loading State - Beautiful Skeleton */}
        {isLoading && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-center py-6">
              <div className="flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-full border-2 border-blue-200">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <p className="text-blue-700 font-medium">
                  Loading cutoffs for {year}...
                </p>
              </div>
            </div>
            {/* Skeleton table rows */}
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State - Enhanced */}
        {!isLoading &&
          filteredCutoffs.length === 0 &&
          groupedByBranch.length === 0 && (
            <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300 animate-in fade-in duration-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg font-semibold">
                No cutoffs found
              </p>
              <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                Try adjusting your filters or search for a different branch
              </p>
              <Button
                variant="noShadow"
                onClick={clearFilters}
                className="mt-4 border-2 border-black hover:bg-blue-50 transition-all"
              >
                <X className="w-4 h-4 mr-2" />
                Clear all filters
              </Button>
            </div>
          )}

        {/* Chart View - Line Graph for selected branch */}
        {!isLoading &&
          mounted &&
          viewMode === "chart" &&
          groupedByBranch.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
              {/* Branch Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-semibold mb-2 block text-gray-700">
                    Select Branch
                  </label>
                  <Select
                    value={selectedChartBranch}
                    onValueChange={setSelectedChartBranch}
                  >
                    <SelectTrigger className="border-2 border-black">
                      <SelectValue placeholder="Select a branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupedByBranch.map(([branchId, { branch }]) => (
                        <SelectItem key={branchId} value={branchId}>
                          {branch?.name || branchId} (
                          {branch?.degree_type || "B.Tech"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBranchInfo && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 border-2 border-black">
                      {selectedBranchInfo.degree_type}
                    </Badge>
                    <Badge className="bg-gray-100 border-2 border-black">
                      {chartData.length} rounds
                    </Badge>
                  </div>
                )}
              </div>

              {/* Chart Container */}
              <div className="h-[400px] w-full bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border-2 border-gray-200 p-4">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="round"
                        stroke="#333"
                        tick={{ fontSize: 12, fontWeight: 600 }}
                      />
                      <YAxis
                        stroke="#333"
                        reversed={true}
                        tickFormatter={(value) => value.toLocaleString()}
                        label={{
                          value: "Rank (lower is better)",
                          angle: -90,
                          position: "insideLeft",
                          offset: -45,
                          style: {
                            textAnchor: "middle",
                            fontWeight: 600,
                            fontSize: 12,
                          },
                        }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-4 rounded-lg border-2 border-black shadow-lg">
                                <p className="font-bold text-sm mb-2">
                                  {label}
                                </p>
                                <div className="space-y-1">
                                  {payload.map((entry: any, index: number) => (
                                    <p
                                      key={index}
                                      className="flex items-center gap-2"
                                    >
                                      <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                      ></span>
                                      <span className="text-sm">
                                        {entry.name}:{" "}
                                        <strong>
                                          {entry.value?.toLocaleString()}
                                        </strong>
                                      </span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="openingRank"
                        name="Opening Rank"
                        stroke="#22c55e"
                        strokeWidth={3}
                        dot={{ r: 6, strokeWidth: 2, fill: "white" }}
                        activeDot={{ r: 8, strokeWidth: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="closingRank"
                        name="Closing Rank"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ r: 6, strokeWidth: 2, fill: "white" }}
                        activeDot={{ r: 8, strokeWidth: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">
                      Select a branch to view round progression
                    </p>
                  </div>
                )}
              </div>

              {/* Legend / Info */}
              <div className="flex items-center justify-between flex-wrap gap-4 bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1 rounded bg-green-500"></span>
                    <span>Opening Rank (best rank)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1 rounded bg-red-500"></span>
                    <span>Closing Rank (cutoff)</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  📊 Chart shows rank progression across JoSAA counselling
                  rounds
                </p>
              </div>
            </div>
          )}

        {/* Table View - Enhanced */}
        {!isLoading && viewMode === "table" && filteredCutoffs.length > 0 && (
          <div className="overflow-x-auto rounded-lg border-2 border-black animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-100 to-gray-50 hover:bg-gray-100 sticky top-0 z-10">
                  <TableHead
                    className="cursor-pointer font-bold hover:bg-gray-200 transition-colors"
                    onClick={() => toggleSort("branch")}
                  >
                    <div className="flex items-center">
                      <span className="hidden sm:inline">Branch/Program</span>
                      <span className="sm:hidden">Branch</span>
                      <SortIcon field="branch" />
                    </div>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Degree</TableHead>
                  <TableHead
                    className="cursor-pointer font-bold text-center"
                    onClick={() => toggleSort("round")}
                  >
                    <div className="flex items-center justify-center">
                      Round
                      <SortIcon field="round" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer font-bold text-right hover:bg-gray-200 transition-colors"
                    onClick={() => toggleSort("opening")}
                  >
                    <div className="flex items-center justify-end">
                      <span className="hidden md:inline">Opening</span> Rank
                      <SortIcon field="opening" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer font-bold text-right hover:bg-gray-200 transition-colors"
                    onClick={() => toggleSort("closing")}
                  >
                    <div className="flex items-center justify-end">
                      <span className="hidden md:inline">Closing</span> Rank
                      <SortIcon field="closing" />
                    </div>
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCutoffs.map((cutoff, index) => {
                  // Use branch_id (original 12-char ID) for lookup
                  const branchId = (cutoff as any).branch_id || cutoff.branch;
                  let branch = branchMap.get(branchId);

                  // If branch not found, try to find by short_code if available in cutoff
                  if (!branch && cutoff.branch_code) {
                    // Try to find branch by matching short_code
                    branch = branches.find(
                      (b) => b.short_code === cutoff.branch_code,
                    );
                  }

                  const isExpanded = expandedBranch === branchId;
                  const expandedRounds = isExpanded
                    ? getExpandedRounds(branchId)
                    : [];

                  return (
                    <React.Fragment key={cutoff.id}>
                      <TableRow
                        className={`
                          cursor-pointer transition-all duration-200 
                          hover:bg-blue-50 hover:shadow-sm
                          ${
                            isExpanded
                              ? "bg-blue-50 border-l-4 border-l-blue-500"
                              : ""
                          }
                          ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                        `}
                        onClick={() =>
                          setExpandedBranch(isExpanded ? null : branchId)
                        }
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-semibold text-gray-800">
                                {branch?.name || "N/A"}
                              </p>
                              {branch?.short_code && (
                                <p className="text-xs text-gray-600">
                                  <span className="font-medium">
                                    {formatBranchCode(branch.short_code)}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant="neutral"
                            className="text-xs font-medium"
                          >
                            {branch?.degree_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-blue-100 text-black border border-blue-300 font-mono tabular-nums">
                            R{cutoff.round}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono tabular-nums text-green-700 font-bold text-sm sm:text-base">
                            {cutoff.opening_rank?.toLocaleString() ?? "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono tabular-nums text-red-700 font-bold text-sm sm:text-base">
                            {cutoff.closing_rank?.toLocaleString() ?? "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="noShadow"
                            size="sm"
                            className={`
                              p-1.5 rounded-full transition-all duration-200
                              ${
                                isExpanded
                                  ? "bg-blue-100 rotate-180"
                                  : "hover:bg-gray-100"
                              }
                            `}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded rounds - Enhanced */}
                      {isExpanded && expandedRounds.length > 1 && (
                        <TableRow className="bg-gradient-to-b from-blue-50 to-white animate-in slide-in-from-top-1 duration-200">
                          <TableCell colSpan={6} className="p-0">
                            <div className="p-4 sm:p-5 border-t-2 border-blue-200 bg-gradient-to-b from-blue-50/50 to-transparent">
                              <p className="text-sm font-bold mb-3 text-gray-700 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                All Rounds for {branch?.name}
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
                                {expandedRounds.map((r, index) => (
                                  <div
                                    key={`${
                                      r.branch_id || r.branch || "branch"
                                    }-${r.round}-${index}`}
                                    className={`
                                      flex items-center justify-between p-2.5 sm:p-3 
                                      bg-white rounded-lg border-2 
                                      transition-all duration-200 hover:shadow-md hover:border-blue-300
                                      ${
                                        r.round === cutoff.round
                                          ? "border-blue-400 ring-2 ring-blue-100"
                                          : "border-gray-200"
                                      }
                                    `}
                                  >
                                    <Badge
                                      className={`
                                      font-mono tabular-nums
                                      ${
                                        r.round === cutoff.round
                                          ? "bg-blue-500 text-white"
                                          : "bg-gray-100 text-gray-700"
                                      }
                                    `}
                                    >
                                      R{r.round}
                                    </Badge>
                                    <div className="text-xs sm:text-sm font-mono tabular-nums">
                                      <span className="text-green-600 font-semibold">
                                        {r.opening_rank?.toLocaleString() ??
                                          "N/A"}
                                      </span>
                                      <span className="mx-1 text-gray-400">
                                        →
                                      </span>
                                      <span className="text-red-600 font-semibold">
                                        {r.closing_rank?.toLocaleString() ??
                                          "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
