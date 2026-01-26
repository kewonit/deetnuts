"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JosaaCutoffExpanded, JosaaBranch } from "@/lib/types/josaa";
import { BarChart3, TrendingDown, TrendingUp, Info } from "lucide-react";
import { getBranchDisplayName } from "@/lib/formatBranchCode";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

// Loading component for charts
const ChartLoading = () => (
  <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
    <div className="text-center">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-2" />
      <p className="text-gray-500">Loading chart...</p>
    </div>
  </div>
);

interface BranchComparisonProps {
  cutoffs: JosaaCutoffExpanded[];
  branches: JosaaBranch[];
  year: number;
  category: string;
  gender: string;
}

// Color scale based on rank (lower rank = harder/red, higher rank = easier/green)
function getRankColor(rank: number, maxRank: number): string {
  const ratio = rank / maxRank;
  if (ratio < 0.3) return "#ef4444"; // red (hardest - lowest ranks)
  if (ratio < 0.5) return "#f97316"; // orange
  if (ratio < 0.7) return "#eab308"; // yellow (medium)
  if (ratio < 0.85) return "#84cc16"; // lime
  return "#22c55e"; // green (easier - highest ranks)
}

// Custom tooltip with enhanced styling
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gradient-to-br from-white to-orange-50 p-4 border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-xs animate-in fade-in-50 zoom-in-95 duration-150">
        <p className="font-bold text-base mb-3 break-words text-gray-900">
          {data.fullName}
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4 p-2 bg-green-50 rounded-lg border-2 border-green-200">
            <span className="text-gray-700 font-semibold">Opening:</span>
            <span className="font-mono font-bold text-green-700">
              {data.openingRank.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between gap-4 p-2 bg-red-50 rounded-lg border-2 border-red-200">
            <span className="text-gray-700 font-semibold">Closing:</span>
            <span className="font-mono font-bold text-red-700">
              {data.closingRank.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between gap-4 p-2 bg-blue-50 rounded-lg border-2 border-blue-200">
            <span className="text-gray-700 font-semibold">Spread:</span>
            <span className="font-mono font-bold text-blue-700">
              {(data.closingRank - data.openingRank).toLocaleString()}
            </span>
          </div>
        </div>
        <Badge className="mt-3 bg-purple-100 border-2 border-purple-300 text-purple-800 font-bold">
          {data.degreeType}
        </Badge>
      </div>
    );
  }
  return null;
}

export default function JosaaBranchComparison({
  cutoffs,
  branches,
  year,
  category,
  gender,
}: BranchComparisonProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering charts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Create branch lookup map by original_id
  const branchMap = useMemo(() => {
    const map = new Map<string, JosaaBranch>();
    branches.forEach((b) => {
      if ((b as any).original_id) {
        map.set((b as any).original_id, b);
      }
      map.set(b.id, b);
    });
    // Debug logging
    if (process.env.NODE_ENV === "development" && branches.length > 0) {
      console.log(
        "[BranchComparison] branchMap size:",
        map.size,
        "branches:",
        branches.length,
      );
    }
    return map;
  }, [branches]);

  // Process data for chart
  const chartData = useMemo(() => {
    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("[BranchComparison] cutoffs received:", cutoffs.length);
      if (cutoffs.length > 0) {
        console.log("[BranchComparison] sample cutoff:", {
          branch_id: (cutoffs[0] as any).branch_id,
          branch: cutoffs[0].branch,
          opening_rank: cutoffs[0].opening_rank,
          closing_rank: cutoffs[0].closing_rank,
        });
      }
    }

    return cutoffs
      .map((c) => {
        const branchId = (c as any).branch_id || c.branch;
        const branch = branchMap.get(branchId);
        if (!branch) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              "[BranchComparison] No branch found for branchId:",
              branchId,
            );
          }
          return null;
        }
        return {
          id: c.id,
          branchId,
          name: branch.short_code || "Unknown",
          fullName: getBranchDisplayName(branch),
          degreeType: branch.degree_type || "",
          openingRank: c.opening_rank,
          closingRank: c.closing_rank,
          spread: c.closing_rank - c.opening_rank,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .sort((a, b) => a.closingRank - b.closingRank);
  }, [cutoffs, branchMap]);

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const closingRanks = chartData.map((d) => d.closingRank);
    const openingRanks = chartData.map((d) => d.openingRank);

    return {
      best: chartData[0],
      worst: chartData[chartData.length - 1],
      avgClosing: Math.round(
        closingRanks.reduce((a, b) => a + b, 0) / closingRanks.length,
      ),
      avgOpening: Math.round(
        openingRanks.reduce((a, b) => a + b, 0) / openingRanks.length,
      ),
      median: closingRanks[Math.floor(closingRanks.length / 2)],
      total: chartData.length,
    };
  }, [chartData]);

  const maxRank = Math.max(...chartData.map((d) => d.closingRank), 1);

  // Show loading state while mounting on client
  if (!mounted) {
    return (
      <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-br from-white to-orange-50/30">
        <CardContent className="p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-gray-500">Loading chart...</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-br from-white to-orange-50/30">
        <CardContent className="p-12 text-center">
          <div className="inline-flex p-4 bg-orange-100 rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4">
            <BarChart3 className="w-12 h-12 text-orange-600" />
          </div>
          <p className="text-gray-800 text-lg font-bold mb-2">
            No branch comparison data available
          </p>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Try selecting a different year, category, or gender to view branch
            comparisons
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            className="border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-green-100 transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 animate-in fade-in-50"
            style={{ animationDelay: "0ms" }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-green-200 rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <TrendingDown className="w-4 h-4 text-green-700" />
                </div>
                <span className="text-xs md:text-sm font-bold text-gray-700">
                  Best Branch
                </span>
              </div>
              <p className="font-bold text-sm truncate">{stats.best.name}</p>
              <p className="text-lg md:text-xl font-mono font-bold text-green-700">
                {stats.best.closingRank.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-red-100 transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 animate-in fade-in-50"
            style={{ animationDelay: "100ms" }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-red-200 rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <TrendingUp className="w-4 h-4 text-red-700" />
                </div>
                <span className="text-xs md:text-sm font-bold text-gray-700">
                  Easiest Branch
                </span>
              </div>
              <p className="font-bold text-sm truncate">{stats.worst.name}</p>
              <p className="text-lg md:text-xl font-mono font-bold text-red-700">
                {stats.worst.closingRank.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-blue-100 transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 animate-in fade-in-50"
            style={{ animationDelay: "200ms" }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-200 rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <BarChart3 className="w-4 h-4 text-blue-700" />
                </div>
                <span className="text-xs md:text-sm font-bold text-gray-700">
                  Average CR
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold font-mono text-blue-700">
                {stats.avgClosing.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-purple-100 transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 animate-in fade-in-50"
            style={{ animationDelay: "300ms" }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-purple-200 rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <Info className="w-4 h-4 text-purple-700" />
                </div>
                <span className="text-xs md:text-sm font-bold text-gray-700">
                  Total Programs
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-purple-700">
                {stats.total}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card
        className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-br from-white to-orange-50/30 overflow-hidden animate-in fade-in-50"
        style={{ animationDelay: "400ms" }}
      >
        <CardHeader className="border-b-2 border-black/10 bg-gradient-to-r from-orange-100/50 to-red-100/50">
          <CardTitle className="flex items-center justify-between flex-wrap gap-3">
            <span className="flex items-center gap-3">
              <div className="p-2 bg-orange-200 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-base md:text-lg font-bold">
                Branch Comparison by Closing Rank
              </span>
            </span>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-gray-100 border-2 border-black font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                {year}
              </Badge>
              <Badge className="bg-blue-100 border-2 border-black font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                {category}
              </Badge>
              <Badge className="bg-purple-100 border-2 border-black font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                {gender}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] w-full" style={{ minHeight: "500px" }}>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => value.toLocaleString()}
                  stroke="#333"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11, fontWeight: 600 }}
                  stroke="#333"
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Median line */}
                {stats && (
                  <ReferenceLine
                    x={stats.median}
                    stroke="#8b5cf6"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: `Median: ${stats.median.toLocaleString()}`,
                      position: "top",
                      fill: "#8b5cf6",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                )}

                <Bar
                  dataKey="closingRank"
                  name="Closing Rank"
                  radius={[0, 4, 4, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getRankColor(entry.closingRank, maxRank)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Color Legend */}
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <span className="text-gray-600">Rank difficulty:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span className="text-red-600 font-medium">Hardest</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-500 rounded" />
              <span className="text-yellow-600 font-medium">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span className="text-green-600 font-medium">Easier</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
