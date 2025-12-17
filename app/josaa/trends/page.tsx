"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryStates, parseAsString } from "nuqs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import type { JosaaInstitute, JosaaBranch } from "@/lib/types/josaa";
import { getBranchDisplayName } from "@/lib/formatBranchCode";
import { Loader2 } from "lucide-react";

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FF9F43",
  "#A29BFE",
  "#98D8C8",
  "#F7DC6F",
];

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

interface TrendPoint {
  year: number;
  [key: string]: number;
}

interface SelectedBranch {
  instituteId: string;
  instituteName: string;
  instituteShortName: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  color: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function TrendsPage() {
  const [searchParams, setSearchParams] = useQueryStates({
    category: parseAsString.withDefault("OPEN"),
    gender: parseAsString.withDefault("Gender-Neutral"),
  });

  const [institutes, setInstitutes] = useState<JosaaInstitute[]>([]);
  const [institutesLoading, setInstitutesLoading] = useState(true);
  const [selectedInstituteId, setSelectedInstituteId] = useState<string>("");
  const [branches, setBranches] = useState<JosaaBranch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<SelectedBranch[]>(
    []
  );
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch institutes on mount
  useEffect(() => {
    async function fetchInstitutes() {
      setInstitutesLoading(true);
      try {
        const res = await fetch("/api/josaa/institutes");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setInstitutes(data.institutes || data || []);
      } catch (error) {
        console.error("Failed to fetch institutes:", error);
      } finally {
        setInstitutesLoading(false);
      }
    }
    fetchInstitutes();
  }, []);

  // Filter institutes based on search
  const filteredInstitutes = useMemo(() => {
    if (!debouncedSearch) return [];
    const query = debouncedSearch.toLowerCase();
    return institutes
      .filter(
        (inst) =>
          inst.name.toLowerCase().includes(query) ||
          inst.short_name?.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [institutes, debouncedSearch]);

  // Fetch branches when institute selected
  useEffect(() => {
    async function fetchBranches() {
      if (!selectedInstituteId) {
        setBranches([]);
        return;
      }
      setBranchesLoading(true);
      try {
        // Find institute short_name for the API call
        const institute = institutes.find((i) => i.id === selectedInstituteId);
        if (!institute) return;

        const slug = institute.short_name.toLowerCase().replace(/\s+/g, "-");
        const res = await fetch(`/api/josaa/institutes/${slug}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setBranches(data.branches || []);
      } catch (error) {
        console.error("Failed to fetch branches:", error);
        setBranches([]);
      } finally {
        setBranchesLoading(false);
      }
    }
    fetchBranches();
  }, [selectedInstituteId, institutes]);

  // Fetch trend data for selected branches
  useEffect(() => {
    async function fetchTrends() {
      if (selectedBranches.length === 0) {
        setTrendData([]);
        return;
      }

      setLoading(true);
      try {
        const trendPoints: TrendPoint[] = YEARS.map((year) => ({ year }));

        await Promise.all(
          selectedBranches.map(async (sb) => {
            // Build proper API params
            const params = new URLSearchParams({
              instituteId: sb.instituteId,
              branchId: sb.branchId,
              category: searchParams.category,
              gender: searchParams.gender,
              perPage: "500",
            });

            const res = await fetch(`/api/josaa/cutoffs?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch cutoffs");
            const data = await res.json();

            const key = `${sb.instituteShortName}-${sb.branchCode}`;

            // Get the last round data for each year (most relevant)
            const cutoffsByYear = new Map<number, number>();
            (data.items || []).forEach((cutoff: any) => {
              const existingRound = cutoffsByYear.get(cutoff.year);
              // Take the highest round number's closing rank
              if (!existingRound || cutoff.round > existingRound) {
                cutoffsByYear.set(cutoff.year, cutoff.closing_rank);
              }
            });

            cutoffsByYear.forEach((closingRank, year) => {
              const point = trendPoints.find((p) => p.year === year);
              if (point) {
                point[key] = closingRank;
              }
            });
          })
        );

        setTrendData(trendPoints);
      } catch (error) {
        console.error("Failed to fetch trends:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, [selectedBranches, searchParams.category, searchParams.gender]);

  const handleSelectInstitute = useCallback((institute: JosaaInstitute) => {
    setSelectedInstituteId(institute.id);
    setSearchQuery(institute.short_name);
    setShowDropdown(false);
  }, []);

  const addBranch = useCallback(
    (branch: JosaaBranch) => {
      const institute = institutes.find((i) => i.id === selectedInstituteId);
      if (!institute) return;

      const key = `${institute.id}-${branch.id}`;
      if (
        selectedBranches.some(
          (sb) => `${sb.instituteId}-${sb.branchId}` === key
        )
      ) {
        return; // Already added
      }

      if (selectedBranches.length >= 8) {
        alert("Maximum 8 branches can be tracked");
        return;
      }

      setSelectedBranches((prev) => [
        ...prev,
        {
          instituteId: institute.id,
          instituteName: institute.name,
          instituteShortName: institute.short_name,
          branchId: branch.id,
          branchCode: branch.short_code || branch.name.slice(0, 10),
          branchName: getBranchDisplayName(branch),
          color: COLORS[prev.length % COLORS.length],
        },
      ]);
    },
    [institutes, selectedInstituteId, selectedBranches]
  );

  const removeBranch = useCallback((key: string) => {
    setSelectedBranches((prev) =>
      prev.filter((sb) => `${sb.instituteId}-${sb.branchId}` !== key)
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            <li>
              <Link
                href="/josaa"
                className="px-3 py-1.5 bg-white border-2 border-black hover:bg-yellow-100 transition-colors font-semibold"
              >
                JoSAA
              </Link>
            </li>
            <li className="text-gray-400 font-bold">/</li>
            <li className="px-3 py-1.5 bg-black text-white border-2 border-black font-bold">
              Cutoff Trends
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2">📈 Cutoff Trends</h1>
          <p className="text-muted-foreground">
            Track how cutoff ranks have changed over the years (2018-2025)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Branch Selector */}
          <div className="lg:col-span-3 border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
            <h2 className="text-xl font-bold mb-4">Add Branches to Compare</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Institute Search */}
              <div className="relative">
                <label className="block text-sm font-bold mb-2">
                  1. Search Institute
                </label>
                <input
                  type="text"
                  placeholder={
                    institutesLoading
                      ? "Loading..."
                      : "Type to search institutes..."
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  disabled={institutesLoading}
                  className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                />

                {showDropdown && filteredInstitutes.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border-4 border-black max-h-60 overflow-auto shadow-[4px_4px_0_0_#000]">
                    {filteredInstitutes.map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => handleSelectInstitute(inst)}
                        className="w-full text-left px-4 py-3 hover:bg-yellow-100 transition-colors border-b-2 border-gray-200 last:border-b-0"
                      >
                        <span className="font-bold">{inst.name}</span>
                        <span className="text-gray-600 text-xs">
                          ({inst.short_name})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Branch Dropdown */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  2. Select Branch
                </label>
                <select
                  disabled={
                    !selectedInstituteId ||
                    branchesLoading ||
                    branches.length === 0
                  }
                  onChange={(e) => {
                    const branch = branches.find(
                      (b) => b.id === e.target.value
                    );
                    if (branch) addBranch(branch);
                    e.target.value = "";
                  }}
                  className="w-full px-4 py-3 border-4 border-black bg-white disabled:opacity-50 disabled:bg-gray-100"
                >
                  <option value="">
                    {branchesLoading
                      ? "Loading branches..."
                      : branches.length === 0
                      ? "Select an institute first"
                      : "Choose a branch..."}
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {getBranchDisplayName(branch)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Branches */}
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedBranches.map((sb) => {
                const key = `${sb.instituteId}-${sb.branchId}`;
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 px-3 py-2 border-4 bg-white text-sm font-medium shadow-[2px_2px_0_0_#000]"
                    style={{ borderColor: sb.color }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2 border-black"
                      style={{ backgroundColor: sb.color }}
                    />
                    <span className="font-bold">{sb.instituteName}</span>
                    <span className="text-gray-600">{sb.branchCode}</span>
                    <button
                      onClick={() => removeBranch(key)}
                      className="ml-1 w-5 h-5 flex items-center justify-center bg-red-100 hover:bg-red-200 border-2 border-black text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              {selectedBranches.length === 0 && (
                <p className="text-gray-500 italic">
                  Select an institute and branch above to start comparing trends
                </p>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
            <h2 className="text-xl font-bold mb-4">Filters</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Category</label>
                <select
                  value={searchParams.category}
                  onChange={(e) =>
                    setSearchParams({ category: e.target.value })
                  }
                  className="w-full px-3 py-2 border-4 border-black bg-white"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="OBC-NCL">OBC-NCL</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Gender</label>
                <select
                  value={searchParams.gender}
                  onChange={(e) => setSearchParams({ gender: e.target.value })}
                  className="w-full px-3 py-2 border-4 border-black bg-white"
                >
                  <option value="Gender-Neutral">Gender-Neutral</option>
                  <option value="Female-only (supernumerary)">
                    Female-only
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        {loading ? (
          <div className="border-4 border-black bg-white p-12 text-center shadow-[4px_4px_0_0_#000]">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <div className="text-xl font-bold">Loading trends...</div>
          </div>
        ) : selectedBranches.length > 0 ? (
          <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
            <h2 className="text-xl font-bold mb-4">
              📊 Closing Rank Trends (2018-2025)
            </h2>
            <ResponsiveContainer width="100%" height={450}>
              <LineChart
                data={trendData}
                margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="year"
                  tickFormatter={(v) => v.toString()}
                  tick={{ fontWeight: 600 }}
                />
                <YAxis
                  reversed
                  tickFormatter={(v) => v.toLocaleString()}
                  label={{
                    value: "Closing Rank (lower is better)",
                    angle: -90,
                    position: "insideLeft",
                    offset: -60,
                    style: { textAnchor: "middle", fontWeight: 600 },
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    value.toLocaleString(),
                    "Closing Rank",
                  ]}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "4px solid #000",
                    borderRadius: 0,
                    fontWeight: 600,
                  }}
                />
                <Legend />
                {selectedBranches.map((sb) => {
                  const key = `${sb.instituteShortName}-${sb.branchCode}`;
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={`${sb.instituteShortName} - ${sb.branchCode}`}
                      stroke={sb.color}
                      strokeWidth={3}
                      dot={{
                        fill: sb.color,
                        strokeWidth: 2,
                        r: 5,
                        stroke: "#000",
                      }}
                      activeDot={{ r: 8, strokeWidth: 3 }}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>

            <p className="text-sm text-gray-600 mt-4 text-center font-medium">
              📈 Lower rank = Harder to get in | Y-axis is reversed for
              intuitive reading
            </p>
          </div>
        ) : (
          <div className="border-4 border-dashed border-gray-400 bg-gray-50 p-12 text-center">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-xl font-bold mb-2">
              Compare Cutoff Trends Over Time
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Add branches from different institutes to see how their cutoff
              ranks have evolved from 2018 to 2025
            </p>
          </div>
        )}

        {/* Insights */}
        {selectedBranches.length > 0 && !loading && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-4 border-black bg-blue-100 p-6 shadow-[4px_4px_0_0_#000]">
              <h3 className="font-bold text-lg mb-2">💡 Reading the Chart</h3>
              <p className="text-sm text-gray-700">
                A <strong>downward</strong> trend means competition is
                increasing (harder to get in). An <strong>upward</strong> trend
                means the branch is becoming more accessible.
              </p>
            </div>

            <div className="border-4 border-black bg-green-100 p-6 shadow-[4px_4px_0_0_#000]">
              <h3 className="font-bold text-lg mb-2">📊 Pro Tip</h3>
              <p className="text-sm text-gray-700">
                Compare similar branches across institutes (e.g., CS at IIT
                Delhi vs IIT Bombay) to understand relative difficulty and seat
                availability.
              </p>
            </div>

            <div className="border-4 border-black bg-yellow-100 p-6 shadow-[4px_4px_0_0_#000]">
              <h3 className="font-bold text-lg mb-2">🎯 Note</h3>
              <p className="text-sm text-gray-700">
                Cutoffs can vary due to seat matrix changes, new branches, and
                overall JEE difficulty. Use trends as guidance, not prediction.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
