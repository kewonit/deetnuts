"use client";

import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  ColumnDef,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  GraduationCap,
  Trophy,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  Check,
  Info,
} from "lucide-react";
import {
  JosaaCutoffExpanded,
  JosaaInstitute,
  JosaaBranch,
} from "@/lib/types/josaa";
import { getBranchDisplayName } from "@/lib/formatBranchCode";

// Types for grouped data
interface GroupedResult {
  institute: JosaaInstitute;
  cutoffs: JosaaCutoffExpanded[];
  bestRank: number;
  worstRank: number;
  branchCount: number;
  avgRank: number;
  matchStrength: "safe" | "moderate" | "reach" | "dream";
}

interface CutoffMatrixProps {
  results: JosaaCutoffExpanded[];
  userRank: number;
  category: string;
  year: number;
  isLoading?: boolean;
}

// Admission chance helper
function getMatchStrength(
  userRank: number,
  closingRank: number
): "safe" | "moderate" | "reach" | "dream" {
  const ratio = userRank / closingRank;
  if (ratio <= 0.7) return "safe"; // Rank is much better than cutoff
  if (ratio <= 0.9) return "moderate"; // Good chance
  if (ratio <= 1.0) return "reach"; // Close call
  return "dream"; // Would need improvement
}

function getMatchColor(strength: "safe" | "moderate" | "reach" | "dream") {
  switch (strength) {
    case "safe":
      return "bg-green-100 border-green-400 text-green-800";
    case "moderate":
      return "bg-blue-100 border-blue-400 text-blue-800";
    case "reach":
      return "bg-yellow-100 border-yellow-400 text-yellow-800";
    case "dream":
      return "bg-red-100 border-red-400 text-red-800";
  }
}

function getMatchBadgeColor(strength: "safe" | "moderate" | "reach" | "dream") {
  switch (strength) {
    case "safe":
      return "bg-green-200 text-green-800 border-green-400";
    case "moderate":
      return "bg-blue-200 text-blue-800 border-blue-400";
    case "reach":
      return "bg-yellow-200 text-yellow-800 border-yellow-400";
    case "dream":
      return "bg-red-200 text-red-800 border-red-400";
  }
}

function getMatchIcon(strength: "safe" | "moderate" | "reach" | "dream") {
  switch (strength) {
    case "safe":
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case "moderate":
      return <TrendingUp className="w-4 h-4 text-blue-600" />;
    case "reach":
      return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    case "dream":
      return <Star className="w-4 h-4 text-red-600" />;
  }
}

function getMatchLabel(strength: "safe" | "moderate" | "reach" | "dream") {
  switch (strength) {
    case "safe":
      return "Safe Choice";
    case "moderate":
      return "Good Chance";
    case "reach":
      return "Competitive";
    case "dream":
      return "Dream";
  }
}

const typeColors: Record<string, string> = {
  IIT: "bg-orange-100 border-orange-300",
  NIT: "bg-blue-100 border-blue-300",
  IIIT: "bg-green-100 border-green-300",
  GFTI: "bg-purple-100 border-purple-300",
  CFTI: "bg-pink-100 border-pink-300",
};

const typeBadgeColors: Record<string, string> = {
  IIT: "bg-orange-200 text-orange-800 border-orange-400",
  NIT: "bg-blue-200 text-blue-800 border-blue-400",
  IIIT: "bg-green-200 text-green-800 border-green-400",
  GFTI: "bg-purple-200 text-purple-800 border-purple-400",
  CFTI: "bg-pink-200 text-pink-800 border-pink-400",
};

export default function CutoffMatrix({
  results,
  userRank,
  category,
  year,
  isLoading,
}: CutoffMatrixProps) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // UI state
  const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [instituteTypeFilter, setInstituteTypeFilter] = useState<string>("all");
  const [matchFilter, setMatchFilter] = useState<string>("all");

  // Group results by institute and calculate stats
  const groupedResults = useMemo<GroupedResult[]>(() => {
    const groups = new Map<string, JosaaCutoffExpanded[]>();

    results.forEach((result) => {
      const key = result.expand?.institute?.id || result.institute;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(result);
    });

    return Array.from(groups.entries())
      .map(([id, cutoffs]) => {
        const institute = cutoffs[0].expand?.institute;
        if (!institute) return null;

        const sortedCutoffs = cutoffs.sort(
          (a, b) => a.closing_rank - b.closing_rank
        );
        const bestRank = Math.min(...cutoffs.map((c) => c.closing_rank));
        const worstRank = Math.max(...cutoffs.map((c) => c.closing_rank));
        const avgRank = Math.round(
          cutoffs.reduce((sum, c) => sum + c.closing_rank, 0) / cutoffs.length
        );

        return {
          institute,
          cutoffs: sortedCutoffs,
          bestRank,
          worstRank,
          branchCount: cutoffs.length,
          avgRank,
          matchStrength: getMatchStrength(userRank, bestRank),
        };
      })
      .filter(Boolean) as GroupedResult[];
  }, [results, userRank]);

  // Apply filters
  const filteredResults = useMemo(() => {
    let filtered = groupedResults;

    // Institute type filter
    if (instituteTypeFilter !== "all") {
      filtered = filtered.filter(
        (g) => g.institute.institute_type === instituteTypeFilter
      );
    }

    // Match strength filter
    if (matchFilter !== "all") {
      filtered = filtered.filter((g) => g.matchStrength === matchFilter);
    }

    // Global search filter
    if (globalFilter) {
      const search = globalFilter.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.institute.name.toLowerCase().includes(search) ||
          g.institute.short_name.toLowerCase().includes(search) ||
          g.cutoffs.some(
            (c) =>
              c.expand?.branch?.name.toLowerCase().includes(search) ||
              c.expand?.branch?.short_code.toLowerCase().includes(search)
          )
      );
    }

    return filtered;
  }, [groupedResults, instituteTypeFilter, matchFilter, globalFilter]);

  // Sort results
  const sortedResults = useMemo(() => {
    if (sorting.length === 0) {
      // Default: sort by match strength (safe first), then by best rank
      return [...filteredResults].sort((a, b) => {
        const strengthOrder = { safe: 0, moderate: 1, reach: 2, dream: 3 };
        const strengthDiff =
          strengthOrder[a.matchStrength] - strengthOrder[b.matchStrength];
        if (strengthDiff !== 0) return strengthDiff;
        return a.bestRank - b.bestRank;
      });
    }

    const { id, desc } = sorting[0];
    return [...filteredResults].sort((a, b) => {
      let comparison = 0;
      switch (id) {
        case "name":
          comparison = a.institute.name.localeCompare(b.institute.name);
          break;
        case "type":
          comparison = a.institute.institute_type.localeCompare(
            b.institute.institute_type
          );
          break;
        case "nirf":
          const aRank = a.institute.nirf_rank ?? 999;
          const bRank = b.institute.nirf_rank ?? 999;
          comparison = aRank - bRank;
          break;
        case "bestRank":
          comparison = a.bestRank - b.bestRank;
          break;
        case "branches":
          comparison = b.branchCount - a.branchCount;
          break;
        case "chance":
          const strengthOrder = { safe: 0, moderate: 1, reach: 2, dream: 3 };
          comparison =
            strengthOrder[a.matchStrength] - strengthOrder[b.matchStrength];
          break;
        default:
          comparison = 0;
      }
      return desc ? -comparison : comparison;
    });
  }, [filteredResults, sorting]);

  // Stats
  const stats = useMemo(() => {
    const total = groupedResults.length;
    const safe = groupedResults.filter(
      (g) => g.matchStrength === "safe"
    ).length;
    const moderate = groupedResults.filter(
      (g) => g.matchStrength === "moderate"
    ).length;
    const reach = groupedResults.filter(
      (g) => g.matchStrength === "reach"
    ).length;
    const dream = groupedResults.filter(
      (g) => g.matchStrength === "dream"
    ).length;
    const totalBranches = results.length;
    return { total, safe, moderate, reach, dream, totalBranches };
  }, [groupedResults, results]);

  // Selected items
  const selectedItems = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => sortedResults[parseInt(key)])
      .filter(Boolean);
  }, [rowSelection, sortedResults]);

  // Toggle row expansion
  const toggleExpanded = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Handle sort toggle
  const handleSort = (column: string) => {
    setSorting((prev) => {
      if (prev.length === 0 || prev[0].id !== column) {
        return [{ id: column, desc: false }];
      }
      if (!prev[0].desc) {
        return [{ id: column, desc: true }];
      }
      return [];
    });
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    const sort = sorting.find((s) => s.id === column);
    if (!sort) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sort.desc ? (
      <ArrowDown className="w-4 h-4" />
    ) : (
      <ArrowUp className="w-4 h-4" />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 rounded-xl border-4 border-black animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-600">Colleges</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.totalBranches}</p>
              <p className="text-xs text-gray-600">Branches</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-green-100">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{stats.safe}</p>
              <p className="text-xs text-green-700">Safe</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-blue-100">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {stats.moderate}
              </p>
              <p className="text-xs text-blue-700">Good Chance</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-yellow-100">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">
                {stats.reach}
              </p>
              <p className="text-xs text-yellow-700">Competitive</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-red-100">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{stats.dream}</p>
              <p className="text-xs text-red-700">Dream</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              {/* Search */}
              <div className="flex-grow w-full md:w-auto">
                <div className="relative">
                  <Input
                    placeholder="Search colleges or branches..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="border-2 border-black pl-10"
                  />
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  {globalFilter && (
                    <button
                      onClick={() => setGlobalFilter("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Institute Type Filter */}
              <Select
                value={instituteTypeFilter}
                onValueChange={setInstituteTypeFilter}
              >
                <SelectTrigger className="w-full md:w-40 border-2 border-black">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="IIT">IIT</SelectItem>
                  <SelectItem value="NIT">NIT</SelectItem>
                  <SelectItem value="IIIT">IIIT</SelectItem>
                  <SelectItem value="GFTI">GFTI</SelectItem>
                  <SelectItem value="CFTI">CFTI</SelectItem>
                </SelectContent>
              </Select>

              {/* Match Filter */}
              <Select value={matchFilter} onValueChange={setMatchFilter}>
                <SelectTrigger className="w-full md:w-44 border-2 border-black">
                  <SelectValue placeholder="All Chances" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chances</SelectItem>
                  <SelectItem value="safe">✅ Safe Choice</SelectItem>
                  <SelectItem value="moderate">📈 Good Chance</SelectItem>
                  <SelectItem value="reach">⚠️ Competitive</SelectItem>
                  <SelectItem value="dream">⭐ Dream</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(globalFilter ||
                instituteTypeFilter !== "all" ||
                matchFilter !== "all") && (
                <Button
                  variant="noShadow"
                  size="sm"
                  onClick={() => {
                    setGlobalFilter("");
                    setInstituteTypeFilter("all");
                    setMatchFilter("all");
                  }}
                  className="border-2 border-black"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected Comparison */}
        {selectedItems.length > 0 && (
          <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">
                    {selectedItems.length} college
                    {selectedItems.length > 1 ? "s" : ""} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/josaa/compare?ids=${selectedItems
                      .map((i) => i.institute.id)
                      .join(",")}`}
                  >
                    <Button
                      size="sm"
                      className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      Compare Selected
                    </Button>
                  </Link>
                  <Button
                    variant="noShadow"
                    size="sm"
                    onClick={() => setRowSelection({})}
                    className="border-2 border-black"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Counter */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold text-black">
              {sortedResults.length}
            </span>{" "}
            of {groupedResults.length} colleges
          </p>
        </div>

        {/* Matrix View */}
        <div className="overflow-x-auto">
          <table className="w-full border-4 border-black bg-white">
            <thead>
              <tr className="bg-gray-100 border-b-4 border-black">
                {/* Select Column */}
                <th className="p-3 text-left w-12 border-r-2 border-black">
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select colleges to compare</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                {/* Chance Column */}
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-200 transition-colors border-r-2 border-black"
                  onClick={() => handleSort("chance")}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Chance</span>
                    {getSortIcon("chance")}
                  </div>
                </th>
                {/* Type Column */}
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-200 transition-colors border-r-2 border-black"
                  onClick={() => handleSort("type")}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Type</span>
                    {getSortIcon("type")}
                  </div>
                </th>
                {/* Institute Column */}
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-200 transition-colors border-r-2 border-black min-w-[280px]"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Institute</span>
                    {getSortIcon("name")}
                  </div>
                </th>
                {/* NIRF Column */}
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-200 transition-colors border-r-2 border-black"
                  onClick={() => handleSort("nirf")}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-bold">NIRF</span>
                    {getSortIcon("nirf")}
                  </div>
                </th>
                {/* Cutoff Range Column */}
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-200 transition-colors border-r-2 border-black"
                  onClick={() => handleSort("bestRank")}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Cutoff Range</span>
                    {getSortIcon("bestRank")}
                  </div>
                </th>
                {/* Branches Column */}
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort("branches")}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Branches</span>
                    {getSortIcon("branches")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((group, idx) => {
                const isExpanded = expandedRows.has(group.institute.id);
                const isSelected = rowSelection[idx] === true;

                return (
                  <React.Fragment key={group.institute.id}>
                    {/* Main Row */}
                    <tr
                      className={`border-b-2 border-black transition-colors ${
                        isSelected
                          ? "bg-purple-50"
                          : idx % 2 === 0
                          ? "bg-white"
                          : "bg-gray-50"
                      } hover:bg-gray-100`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 border-r-2 border-black">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            setRowSelection((prev) => ({
                              ...prev,
                              [idx]: checked === true,
                            }));
                          }}
                        />
                      </td>

                      {/* Chance */}
                      <td className="p-3 border-r-2 border-black">
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge
                              className={`${getMatchBadgeColor(
                                group.matchStrength
                              )} border flex items-center gap-1`}
                            >
                              {getMatchIcon(group.matchStrength)}
                              <span className="hidden sm:inline">
                                {getMatchLabel(group.matchStrength)}
                              </span>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Your rank: {userRank.toLocaleString()} | Best
                              cutoff: {group.bestRank.toLocaleString()}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </td>

                      {/* Type */}
                      <td className="p-3 border-r-2 border-black">
                        <Badge
                          className={`${
                            typeBadgeColors[group.institute.institute_type]
                          } border font-bold`}
                        >
                          {group.institute.institute_type}
                        </Badge>
                      </td>

                      {/* Institute */}
                      <td className="p-3 border-r-2 border-black">
                        <div className="flex flex-col">
                          <Link
                            href={`/josaa/institutes/${group.institute.short_name
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                            className="font-semibold hover:text-blue-600 hover:underline transition-colors flex items-center gap-1"
                          >
                            {group.institute.short_name}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          <span className="text-xs text-gray-500 line-clamp-1">
                            {group.institute.name}
                          </span>
                        </div>
                      </td>

                      {/* NIRF */}
                      <td className="p-3 border-r-2 border-black">
                        {group.institute.nirf_rank != null &&
                        group.institute.nirf_rank > 0 ? (
                          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-400">
                            <Trophy className="w-3 h-3 mr-1" />#{" "}
                            {group.institute.nirf_rank}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>

                      {/* Cutoff Range */}
                      <td className="p-3 border-r-2 border-black">
                        <div className="flex items-center gap-1 font-mono text-sm">
                          <span className="text-green-600 font-semibold">
                            {group.bestRank.toLocaleString()}
                          </span>
                          <span className="text-gray-400">–</span>
                          <span className="text-red-600 font-semibold">
                            {group.worstRank.toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Branches */}
                      <td className="p-3">
                        <button
                          onClick={() => toggleExpanded(group.institute.id)}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                        >
                          <Badge className="bg-gray-100 text-gray-800 border border-gray-300">
                            <GraduationCap className="w-3 h-3 mr-1" />
                            {group.branchCount}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Branch Details */}
                    {isExpanded && (
                      <tr className="border-b-4 border-black bg-gray-50">
                        <td colSpan={7} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {group.cutoffs.map((cutoff) => {
                              const branchMatch = getMatchStrength(
                                userRank,
                                cutoff.closing_rank
                              );
                              return (
                                <div
                                  key={cutoff.id}
                                  className={`p-3 rounded-lg border-2 border-black ${getMatchColor(
                                    branchMatch
                                  )} flex items-center justify-between`}
                                >
                                  <div className="min-w-0 flex-grow">
                                    <p className="font-medium text-sm truncate">
                                      {cutoff.expand?.branch
                                        ? getBranchDisplayName(
                                            cutoff.expand.branch
                                          )
                                        : "Unknown"}
                                    </p>
                                    <p className="text-xs opacity-70">
                                      {cutoff.expand?.branch?.degree_type}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-2">
                                    <div className="flex items-center gap-1">
                                      {getMatchIcon(branchMatch)}
                                      <span className="font-mono text-sm font-bold">
                                        {cutoff.closing_rank.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {sortedResults.length === 0 && (
          <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-yellow-50">
            <CardContent className="p-8 text-center">
              <Filter className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-gray-600 mb-4">
                No colleges match your current filters.
              </p>
              <Button
                onClick={() => {
                  setGlobalFilter("");
                  setInstituteTypeFilter("all");
                  setMatchFilter("all");
                }}
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <Card className="border-2 border-black bg-gray-50">
          <CardContent className="p-4">
            <p className="font-semibold text-sm mb-2">
              Understanding Your Chances:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-200 border border-green-400" />
                <span>
                  <strong>Safe:</strong> Your rank is well above cutoff
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-200 border border-blue-400" />
                <span>
                  <strong>Good Chance:</strong> High probability of admission
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-200 border border-yellow-400" />
                <span>
                  <strong>Competitive:</strong> Close to the cutoff
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-200 border border-red-400" />
                <span>
                  <strong>Dream:</strong> Cutoff is above your rank
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
