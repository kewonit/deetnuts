"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQueryStates, parseAsString, parseAsArrayOf } from "nuqs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import type {
  JosaaInstitute,
  JosaaBranch,
  CategoryType,
} from "@/lib/types/josaa";
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

const CATEGORY_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: "OPEN", label: "OPEN" },
  { value: "OBC-NCL", label: "OBC-NCL" },
  { value: "SC", label: "SC" },
  { value: "ST", label: "ST" },
  { value: "EWS", label: "EWS" },
];

interface ComparisonData {
  branch: string;
  branchId: string;
  [key: string]: string | number;
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

export default function ComparePage() {
  const [searchParams, setSearchParams] = useQueryStates({
    institutes: parseAsArrayOf(parseAsString).withDefault([]),
    category: parseAsString.withDefault("OPEN"),
    gender: parseAsString.withDefault("Gender-Neutral"),
    year: parseAsString.withDefault("2025"),
  });

  const [allInstitutes, setAllInstitutes] = useState<JosaaInstitute[]>([]);
  const [institutesLoading, setInstitutesLoading] = useState(true);
  const [selectedInstitutesData, setSelectedInstitutesData] = useState<
    { institute: JosaaInstitute; branches: JosaaBranch[]; cutoffs: any[] }[]
  >([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch all institutes on mount
  useEffect(() => {
    async function fetchInstitutes() {
      setInstitutesLoading(true);
      try {
        const res = await fetch("/api/josaa/institutes");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setAllInstitutes(data.institutes || data || []);
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
    return allInstitutes
      .filter(
        (inst) =>
          (inst.name.toLowerCase().includes(query) ||
            inst.short_name?.toLowerCase().includes(query)) &&
          !searchParams.institutes.includes(inst.id)
      )
      .slice(0, 10);
  }, [allInstitutes, debouncedSearch, searchParams.institutes]);

  // Fetch comparison data when institutes change
  const fetchComparisonData = useCallback(async () => {
    if (searchParams.institutes.length < 2) {
      setComparisonData([]);
      setSelectedInstitutesData([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch data for each selected institute
      const promises = searchParams.institutes.map(async (id) => {
        const inst = allInstitutes.find((i) => i.id === id);
        if (!inst) return null;

        const slug = inst.short_name.toLowerCase().replace(/\s+/g, "-");
        const res = await fetch(
          `/api/josaa/institutes/${slug}?year=${searchParams.year}`
        );
        if (!res.ok) return null;
        return res.json();
      });

      const results = (await Promise.all(promises)).filter(Boolean);

      if (results.length < 2) {
        setComparisonData([]);
        setSelectedInstitutesData([]);
        return;
      }

      setSelectedInstitutesData(results);

      // Find common branches by name OR short_code
      // Create maps of both name and short_code for each institute
      const branchMaps = results.map((r) => {
        const byName = new Map<string, JosaaBranch>();
        const byCode = new Map<string, JosaaBranch>();
        (r.branches || []).forEach((b: JosaaBranch) => {
          byName.set(b.name.toLowerCase(), b);
          if (b.short_code) {
            byCode.set(b.short_code.toLowerCase(), b);
          }
        });
        return { byName, byCode };
      });

      // Find common branches - match by exact name or short_code
      const firstBranches = results[0]?.branches || [];
      const commonBranches = firstBranches.filter((b: JosaaBranch) => {
        const name = b.name.toLowerCase();
        const code = b.short_code?.toLowerCase();

        // Check if this branch exists in ALL other institutes
        return branchMaps.slice(1).every(({ byName, byCode }) => {
          return byName.has(name) || (code && byCode.has(code));
        });
      });

      // Build comparison data for chart
      const chartData: ComparisonData[] = commonBranches
        .slice(0, 10)
        .map((branch: JosaaBranch) => {
          const displayName = getBranchDisplayName(branch);
          const row: ComparisonData = {
            branch:
              displayName.length > 30
                ? displayName.slice(0, 30) + "..."
                : displayName,
            branchId: branch.id,
          };

          results.forEach((result) => {
            // Find matching branch in this institute (by name or short_code)
            const branchName = branch.name.toLowerCase();
            const branchCode = branch.short_code?.toLowerCase();

            const matchingBranch = result.branches?.find(
              (b: JosaaBranch) =>
                b.name.toLowerCase() === branchName ||
                (branchCode && b.short_code?.toLowerCase() === branchCode)
            );

            if (matchingBranch) {
              // Find the cutoff for this branch
              const cutoff = result.cutoffs?.find(
                (c: any) =>
                  c.branch_id ===
                    (matchingBranch.original_id || matchingBranch.id) &&
                  c.category === searchParams.category &&
                  c.gender === searchParams.gender
              );
              const shortName = result.institute?.short_name || "Unknown";
              row[shortName] = cutoff?.closing_rank || 0;
            }
          });

          return row;
        })
        .filter((row: ComparisonData) => {
          // Only include rows that have at least some data
          const values = Object.values(row).filter(
            (v) => typeof v === "number" && v > 0
          );
          return values.length > 0;
        });

      setComparisonData(chartData);
    } catch (error) {
      console.error("Failed to fetch comparison data:", error);
    } finally {
      setLoading(false);
    }
  }, [searchParams, allInstitutes]);

  useEffect(() => {
    if (allInstitutes.length > 0) {
      fetchComparisonData();
    }
  }, [fetchComparisonData, allInstitutes]);

  const handleAddInstitute = (institute: JosaaInstitute) => {
    if (searchParams.institutes.includes(institute.id)) return;
    if (searchParams.institutes.length >= 5) {
      alert("Maximum 5 institutes can be compared");
      return;
    }
    setSearchParams({
      institutes: [...searchParams.institutes, institute.id],
    });
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleRemoveInstitute = (id: string) => {
    setSearchParams({
      institutes: searchParams.institutes.filter((s) => s !== id),
    });
  };

  // Get selected institutes info
  const selectedInstitutes = useMemo(() => {
    return searchParams.institutes
      .map((id) => allInstitutes.find((i) => i.id === id))
      .filter(Boolean) as JosaaInstitute[];
  }, [searchParams.institutes, allInstitutes]);

  // Get common branches
  const commonBranches = useMemo(() => {
    if (selectedInstitutesData.length < 2) return [];

    const branchSets = selectedInstitutesData.map(
      (r) => new Set(r.branches?.map((b: JosaaBranch) => b.name) || [])
    );
    const commonNames = [...branchSets[0]].filter((name) =>
      branchSets.every((set) => set.has(name))
    );

    const firstBranches = selectedInstitutesData[0]?.branches || [];
    return firstBranches.filter((b: JosaaBranch) =>
      commonNames.includes(b.name)
    );
  }, [selectedInstitutesData]);

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
              Compare Institutes
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2">📊 Compare Institutes</h1>
          <p className="text-muted-foreground">
            Select up to 5 institutes to compare their cutoff ranks across
            common branches
          </p>
        </div>

        {/* Institute Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
            <h2 className="text-xl font-bold mb-4">Selected Institutes</h2>

            {/* Search Input */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder={
                  institutesLoading
                    ? "Loading..."
                    : "Search institutes to add..."
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

              {/* Dropdown */}
              {showDropdown && filteredInstitutes.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border-4 border-black max-h-60 overflow-auto shadow-[4px_4px_0_0_#000]">
                  {filteredInstitutes.map((inst) => (
                    <button
                      key={inst.id}
                      onClick={() => handleAddInstitute(inst)}
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

            {/* Selected Pills */}
            <div className="flex flex-wrap gap-2">
              {selectedInstitutes.map((inst, idx) => (
                <div
                  key={inst.id}
                  className="flex items-center gap-2 px-3 py-2 border-4 bg-white text-sm font-medium shadow-[2px_2px_0_0_#000]"
                  style={{ borderColor: COLORS[idx % COLORS.length] }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 border-black"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="font-bold">{inst.name}</span>
                  <button
                    onClick={() => handleRemoveInstitute(inst.id)}
                    className="ml-1 w-5 h-5 flex items-center justify-center bg-red-100 hover:bg-red-200 border-2 border-black text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {selectedInstitutes.length === 0 && (
                <p className="text-gray-500 italic">
                  Add institutes to start comparing
                </p>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
            <h2 className="text-xl font-bold mb-4">Filters</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Year</label>
                <select
                  value={searchParams.year}
                  onChange={(e) => setSearchParams({ year: e.target.value })}
                  className="w-full px-3 py-2 border-4 border-black bg-white"
                >
                  {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map((y) => (
                    <option key={y} value={y.toString()}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Category</label>
                <select
                  value={searchParams.category}
                  onChange={(e) =>
                    setSearchParams({ category: e.target.value })
                  }
                  className="w-full px-3 py-2 border-4 border-black bg-white"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
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

        {/* Comparison Chart */}
        {loading ? (
          <div className="border-4 border-black bg-white p-12 text-center shadow-[4px_4px_0_0_#000]">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <div className="text-xl font-bold">Loading comparison...</div>
          </div>
        ) : comparisonData.length > 0 ? (
          <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
            <h2 className="text-xl font-bold mb-4">
              📊 Closing Rank Comparison (Top 10 Common Branches)
            </h2>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={comparisonData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 200, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => v.toLocaleString()}
                  tick={{ fontWeight: 600 }}
                />
                <YAxis
                  type="category"
                  dataKey="branch"
                  width={180}
                  tick={{ fontSize: 12, fontWeight: 600 }}
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
                {selectedInstitutes.map((inst, idx) => (
                  <Bar
                    key={inst.id}
                    dataKey={inst.short_name}
                    fill={COLORS[idx % COLORS.length]}
                    name={inst.short_name}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>

            <p className="text-sm text-gray-600 mt-4 text-center font-medium">
              Lower rank = Higher difficulty to get admission
            </p>
          </div>
        ) : searchParams.institutes.length >= 2 ? (
          <div className="border-4 border-black bg-yellow-50 p-12 text-center shadow-[4px_4px_0_0_#000]">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-700 font-medium">
              No common branches found between selected institutes for{" "}
              {searchParams.category} category
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Try selecting different institutes or changing the filters
            </p>
          </div>
        ) : (
          <div className="border-4 border-dashed border-gray-400 bg-gray-50 p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">
              Select at least 2 institutes
            </h3>
            <p className="text-gray-600">
              Use the search above to add institutes for comparison
            </p>
          </div>
        )}

        {/* Common Branches Table */}
        {commonBranches.length > 0 && !loading && (
          <div className="mt-8 border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
            <h2 className="text-xl font-bold mb-4">
              All Common Branches ({commonBranches.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-4 border-black bg-gray-100">
                    <th className="text-left py-3 px-4 font-bold">Branch</th>
                    {selectedInstitutes.map((inst, idx) => (
                      <th
                        key={inst.id}
                        className="text-right py-3 px-4 font-bold text-sm"
                        style={{ color: COLORS[idx % COLORS.length] }}
                        title={inst.name}
                      >
                        {inst.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commonBranches.map((branch, rowIdx) => {
                    const row = comparisonData.find(
                      (d) => d.branchId === branch.id
                    );
                    return (
                      <tr
                        key={branch.id}
                        className={`border-b-2 border-gray-200 ${
                          rowIdx % 2 === 0 ? "bg-gray-50" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium">
                            {getBranchDisplayName(branch)}
                          </span>
                        </td>
                        {selectedInstitutes.map((inst) => (
                          <td
                            key={inst.id}
                            className="text-right py-3 px-4 font-mono font-bold"
                          >
                            {row?.[inst.short_name]
                              ? (
                                  row[inst.short_name] as number
                                ).toLocaleString()
                              : "-"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tips */}
        {selectedInstitutes.length >= 2 && !loading && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-4 border-black bg-blue-100 p-6 shadow-[4px_4px_0_0_#000]">
              <h3 className="font-bold text-lg mb-2">
                💡 Understanding the Chart
              </h3>
              <p className="text-sm text-gray-700">
                Shorter bars indicate <strong>lower closing ranks</strong>,
                meaning those seats are more competitive and harder to secure.
              </p>
            </div>

            <div className="border-4 border-black bg-green-100 p-6 shadow-[4px_4px_0_0_#000]">
              <h3 className="font-bold text-lg mb-2">📊 Pro Tip</h3>
              <p className="text-sm text-gray-700">
                Compare institutes of similar tier (e.g., older IITs vs newer
                IITs) for more meaningful insights about branch cutoffs.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
