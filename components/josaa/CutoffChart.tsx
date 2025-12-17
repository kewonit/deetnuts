"use client";

import { useState, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getCutoffTrends } from "@/lib/josaa-client";
import { JosaaBranch } from "@/lib/types/josaa";
import { getBranchDisplayName } from "@/lib/formatBranchCode";

interface CutoffChartProps {
  trendData: Array<{
    year: number;
    round: number;
    openingRank: number;
    closingRank: number;
  }>;
  branches: JosaaBranch[];
  instituteId: string;
  defaultCategory?: string;
  defaultGender?: string;
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

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border-4 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="font-bold text-lg mb-2">Year: {label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{entry.name}:</span>
            <span className="font-bold">{entry.value?.toLocaleString()}</span>
          </div>
        ))}
        {payload[0]?.payload?.round && (
          <p className="text-xs text-gray-500 mt-2">
            Round: {payload[0].payload.round}
          </p>
        )}
      </div>
    );
  }
  return null;
}

export default function JosaaCutoffChart({
  trendData: initialTrendData,
  branches,
  instituteId,
  defaultCategory = "OPEN",
  defaultGender = "Gender-Neutral",
}: CutoffChartProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>(
    branches.find((b) => b.name.toLowerCase().includes("computer science"))
      ?.id ||
      branches[0]?.id ||
      ""
  );
  const [category, setCategory] = useState(defaultCategory);
  const [gender, setGender] = useState(defaultGender);
  const [trendData, setTrendData] = useState(initialTrendData);
  const [loading, setLoading] = useState(false);

  // Fetch new data when filters change
  const fetchTrendData = useCallback(
    async (branchId: string, cat: string, gen: string) => {
      if (!branchId) return;

      setLoading(true);
      try {
        const data = await getCutoffTrends(instituteId, branchId, cat, gen);
        // Convert snake_case to camelCase for chart compatibility
        const convertedData = data.map((item) => ({
          year: item.year,
          round: item.round,
          openingRank: item.opening_rank,
          closingRank: item.closing_rank,
        }));
        setTrendData(convertedData);
      } catch (error) {
        console.error("Error fetching trend data:", error);
      } finally {
        setLoading(false);
      }
    },
    [instituteId]
  );

  const handleBranchChange = (value: string) => {
    setSelectedBranch(value);
    fetchTrendData(value, category, gender);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    fetchTrendData(selectedBranch, value, gender);
  };

  const handleGenderChange = (value: string) => {
    setGender(value);
    fetchTrendData(selectedBranch, category, value);
  };

  // Prepare chart data - group by year, take last round
  const chartData = useMemo(() => {
    const yearMap = new Map<number, (typeof trendData)[0]>();

    trendData.forEach((item) => {
      const existing = yearMap.get(item.year);
      if (!existing || item.round > existing.round) {
        yearMap.set(item.year, item);
      }
    });

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [trendData]);

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length < 2) return null;

    const latestYear = chartData[chartData.length - 1];
    const previousYear = chartData[chartData.length - 2];

    // Ensure we have valid rank data
    if (
      latestYear.closingRank == null ||
      latestYear.openingRank == null ||
      previousYear.closingRank == null
    ) {
      return null;
    }

    const closingChange = latestYear.closingRank - previousYear.closingRank;
    const changePercent = (
      (closingChange / previousYear.closingRank) *
      100
    ).toFixed(1);

    return {
      latestClosing: latestYear.closingRank,
      latestOpening: latestYear.openingRank,
      change: closingChange,
      changePercent,
      trend:
        closingChange > 0
          ? "increased"
          : closingChange < 0
          ? "decreased"
          : "stable",
    };
  }, [chartData]);

  const selectedBranchInfo = branches.find((b) => b.id === selectedBranch);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-semibold mb-2 block">
            Branch/Program
          </label>
          <Select value={selectedBranch} onValueChange={handleBranchChange}>
            <SelectTrigger className="border-2 border-black">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {getBranchDisplayName(branch)} ({branch.degree_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Category</label>
          <Select value={category} onValueChange={handleCategoryChange}>
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
          <Select value={gender} onValueChange={handleGenderChange}>
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
      </div>

      {/* Selected Branch Info */}
      {selectedBranchInfo && (
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-200 text-black border-2 border-black">
            {selectedBranchInfo.short_code}
          </Badge>
          <span className="text-sm text-gray-600">
            {selectedBranchInfo.duration_years} years •{" "}
            {selectedBranchInfo.degree_type}
          </span>
        </div>
      )}

      {/* Stats Cards */}
      {stats && stats.latestOpening != null && stats.latestClosing != null && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-2 border-black bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-600">Opening Rank</p>
              <p className="text-xl font-bold text-green-700">
                {stats.latestOpening.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-black bg-red-50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-600">Closing Rank</p>
              <p className="text-xl font-bold text-red-700">
                {stats.latestClosing.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-black bg-blue-50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-600">YoY Change</p>
              <p
                className={`text-xl font-bold ${
                  stats.change > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {stats.change > 0 ? "+" : ""}
                {stats.change.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-black bg-purple-50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-600">Trend</p>
              <p
                className={`text-xl font-bold capitalize ${
                  stats.trend === "decreased"
                    ? "text-green-600"
                    : stats.trend === "increased"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {stats.trend} ({stats.changePercent}%)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <div className="h-[400px] w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-gray-500">Loading trend data...</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">
              No data available for selected filters
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="year" stroke="#333" tick={{ fontWeight: 600 }} />
              <YAxis
                stroke="#333"
                reversed={true} // Lower rank is better
                tickFormatter={(value) => value.toLocaleString()}
                label={{
                  value: "Rank (lower is better)",
                  angle: -90,
                  position: "insideLeft",
                  offset: -60,
                  style: { textAnchor: "middle", fontWeight: 600 },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
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
        )}
      </div>

      {/* Legend explanation */}
      <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
        <p className="font-semibold mb-1">📊 How to read this chart:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <span className="text-green-600 font-semibold">Opening Rank</span> -
            Best rank at which a student got this branch
          </li>
          <li>
            <span className="text-red-600 font-semibold">Closing Rank</span> -
            Last rank at which a student got this branch (your target rank)
          </li>
          <li>
            Y-axis is reversed because <strong>lower rank = better</strong>
          </li>
          <li>Data shown is from the last counseling round of each year</li>
        </ul>
      </div>
    </div>
  );
}

// ============ SIMPLE CUTOFF CHART ============
// For use when trends data is already available (e.g., branch detail page)

interface SimpleCutoffChartProps {
  trends: Array<{
    year: number;
    round: number;
    opening_rank: number;
    closing_rank: number;
    category: string;
    gender: string;
  }>;
  title?: string;
}

export function CutoffChart({ trends, title }: SimpleCutoffChartProps) {
  const [selectedCategory, setSelectedCategory] = useState("OPEN");
  const [selectedGender, setSelectedGender] = useState("Gender-Neutral");

  // Get available options from data
  const categories = useMemo(
    () => [...new Set(trends.map((t) => t.category))].sort(),
    [trends]
  );
  const genders = useMemo(
    () => [...new Set(trends.map((t) => t.gender))].sort(),
    [trends]
  );

  // Filter and prepare chart data
  const chartData = useMemo(() => {
    const filtered = trends.filter(
      (t) => t.category === selectedCategory && t.gender === selectedGender
    );

    // Group by year, take last round
    const yearMap = new Map<number, (typeof filtered)[0]>();
    filtered.forEach((item) => {
      const existing = yearMap.get(item.year);
      if (!existing || item.round > existing.round) {
        yearMap.set(item.year, item);
      }
    });

    return Array.from(yearMap.values())
      .sort((a, b) => a.year - b.year)
      .map((item) => ({
        year: item.year,
        openingRank: item.opening_rank,
        closingRank: item.closing_rank,
        round: item.round,
      }));
  }, [trends, selectedCategory, selectedGender]);

  if (trends.length === 0) {
    return (
      <Card className="border-4 border-foreground p-6 shadow-[4px_4px_0_0_#000]">
        <p className="text-center text-muted-foreground">
          No trend data available
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-4 border-foreground shadow-[4px_4px_0_0_#000]">
      <CardContent className="p-6">
        {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}

        {/* Filters */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-1 block">Category</label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="border-2 border-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Gender</label>
            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger className="border-2 border-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {genders.map((gen) => (
                  <SelectItem key={gen} value={gen}>
                    {gen}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="year" stroke="#333" tick={{ fontWeight: 600 }} />
            <YAxis
              reversed
              stroke="#333"
              tickFormatter={(v) => v.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="openingRank"
              name="Opening Rank"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 4, fill: "white", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="closingRank"
              name="Closing Rank"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4, fill: "white", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <p className="text-sm text-muted-foreground text-center mt-4">
          📈 Lower rank = Harder to get in | Y-axis is reversed
        </p>
      </CardContent>
    </Card>
  );
}
