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
} from "lucide-react";
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
    parseAsInteger.withDefault(defaultYear || yearsAvailable[0])
  );
  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withDefault(defaultCategory)
  );
  const [gender, setGender] = useQueryState(
    "gender",
    parseAsString.withDefault(defaultGender)
  );
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));

  // Local state
  const [round, setRound] = useState<number | "all">("all");
  const [sortField, setSortField] = useState<SortField>("closing");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);

  // Dynamic cutoffs state - for when year changes and we need to fetch new data
  const [cutoffs, setCutoffs] = useState<JosaaCutoffExpanded[]>(initialCutoffs);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedYear, setLoadedYear] = useState<number>(
    defaultYear || yearsAvailable[0]
  );

  // Fetch cutoffs when year changes (if we have instituteId)
  const fetchCutoffsForYear = useCallback(
    async (newYear: number) => {
      if (!instituteId || newYear === loadedYear) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/josaa/cutoffs?instituteId=${instituteId}&year=${newYear}&perPage=500`
        );
        if (response.ok) {
          const data = await response.json();
          setCutoffs(data.items || []);
          setLoadedYear(newYear);
        }
      } catch (error) {
        console.error("Error fetching cutoffs:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [instituteId, loadedYear]
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
    [setYear, instituteId, loadedYear, fetchCutoffsForYear]
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

  // Get available rounds for selected year
  const availableRounds = useMemo(() => {
    const rounds = new Set<number>();
    cutoffs.filter((c) => c.year === year).forEach((c) => rounds.add(c.round));
    return Array.from(rounds).sort((a, b) => a - b);
  }, [cutoffs, year]);

  // Filter and sort cutoffs
  const filteredCutoffs = useMemo(() => {
    let filtered = cutoffs.filter((c) => {
      if (c.year !== year) return false;
      if (c.category !== category) return false;
      if (c.gender !== gender) return false;
      if (round !== "all" && c.round !== round) return false;

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

    // If showing all rounds, group by branch and take last round
    if (round === "all") {
      const branchRoundMap = new Map<string, JosaaCutoffExpanded>();
      filtered.forEach((c) => {
        const key = (c as any).branch_id || c.branch;
        const existing = branchRoundMap.get(key);
        if (!existing || c.round > existing.round) {
          branchRoundMap.set(key, c);
        }
      });
      filtered = Array.from(branchRoundMap.values());
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "branch":
          const branchIdA = (a as any).branch_id || a.branch;
          const branchIdB = (b as any).branch_id || b.branch;
          const branchA = branchMap.get(branchIdA)?.name || "";
          const branchB = branchMap.get(branchIdB)?.name || "";
          comparison = branchA.localeCompare(branchB);
          break;
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
    round,
    search,
    sortField,
    sortDirection,
    branchMap,
  ]);

  // Get all rounds for expanded branch
  const getExpandedRounds = (branchId: string) => {
    return cutoffs
      .filter(
        (c) =>
          ((c as any).branch_id === branchId || c.branch === branchId) &&
          c.year === year &&
          c.category === category &&
          c.gender === gender
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
    setRound("all");
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

  return (
    <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden transition-all duration-300">
      <CardHeader className="border-b-4 border-black bg-gradient-to-r from-blue-100 to-blue-50">
        <CardTitle className="flex items-center justify-between flex-wrap gap-4">
          <span className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Cutoffs for</span>
            <span className="sm:hidden">Year</span>
            <span className="ml-1 font-bold text-blue-700">{year}</span>
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
        {/* Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
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
            <label className="text-sm font-semibold mb-2 block">Round</label>
            <Select
              value={round.toString()}
              onValueChange={(v) => setRound(v === "all" ? "all" : parseInt(v))}
            >
              <SelectTrigger className="border-2 border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Last Round</SelectItem>
                {availableRounds.map((r) => (
                  <SelectItem key={r} value={r.toString()}>
                    Round {r}
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
        {(search ||
          round !== "all" ||
          category !== "OPEN" ||
          gender !== "Gender-Neutral") && (
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
            {round !== "all" && (
              <Badge
                variant="neutral"
                className="bg-orange-100 border border-black"
              >
                Round {round}
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
        {!isLoading && filteredCutoffs.length === 0 && (
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

        {/* Table - Enhanced */}
        {!isLoading && filteredCutoffs.length > 0 && (
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
                      (b) => b.short_code === cutoff.branch_code
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
