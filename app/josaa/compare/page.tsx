"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
} from "react";
import type { ComponentType } from "react";
import { useQueryStates, parseAsString, parseAsArrayOf } from "nuqs";
import dynamic from "next/dynamic";
import Link from "next/link";
import { toast } from "sonner";
import { useJosaaInstitutes } from "@/lib/hooks/use-swr-fetch";

// Dynamic import for recharts - reduces initial bundle size

const BarChart = dynamic(
  () =>
    import("recharts").then((mod) => mod.BarChart) as Promise<
      ComponentType<any>
    >,
  {
    ssr: false,
  },
);

const Bar = dynamic(
  () =>
    import("recharts").then((mod) => mod.Bar) as Promise<ComponentType<any>>,
  {
    ssr: false,
  },
);

const XAxis = dynamic(
  () =>
    import("recharts").then((mod) => mod.XAxis) as Promise<ComponentType<any>>,
  {
    ssr: false,
  },
);

const YAxis = dynamic(
  () =>
    import("recharts").then((mod) => mod.YAxis) as Promise<ComponentType<any>>,
  {
    ssr: false,
  },
);

const CartesianGrid = dynamic(
  () =>
    import("recharts").then((mod) => mod.CartesianGrid) as Promise<
      ComponentType<any>
    >,
  { ssr: false },
);

const Tooltip = dynamic(
  () =>
    import("recharts").then((mod) => mod.Tooltip) as Promise<
      ComponentType<any>
    >,
  {
    ssr: false,
  },
);

const Legend = dynamic(
  () =>
    import("recharts").then((mod) => mod.Legend) as Promise<ComponentType<any>>,
  {
    ssr: false,
  },
);

const ResponsiveContainer = dynamic(
  () =>
    import("recharts").then((mod) => mod.ResponsiveContainer) as Promise<
      ComponentType<any>
    >,
  { ssr: false },
);
import type {
  JosaaInstitute,
  JosaaBranch,
  CategoryType,
} from "@/lib/types/josaa";
import { getBranchDisplayName } from "@/lib/formatBranchCode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Search,
  X,
  GitCompare,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Building2,
  Filter,
  BarChart3,
  Table,
} from "lucide-react";

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

// Branch category detection for grouping
const BRANCH_CATEGORIES: Record<string, string[]> = {
  "Computer Science": [
    "computer science",
    "cse",
    "cs",
    "computing",
    "software",
    "information technology",
    "it",
    "data science",
    "artificial intelligence",
    "ai",
    "machine learning",
    "ml",
  ],
  "Electronics & Communication": [
    "electronics",
    "ece",
    "communication",
    "vlsi",
    "embedded",
    "signal processing",
  ],
  "Electrical Engineering": [
    "electrical",
    "ee",
    "power",
    "eee",
    "instrumentation",
  ],
  "Mechanical Engineering": [
    "mechanical",
    "me",
    "automotive",
    "production",
    "manufacturing",
    "industrial",
  ],
  "Civil Engineering": [
    "civil",
    "ce",
    "structural",
    "construction",
    "geotechnical",
  ],
  "Chemical Engineering": ["chemical", "che", "petroleum", "polymer"],
  "Aerospace & Aviation": ["aerospace", "aeronautical", "aviation", "space"],
  "Biotechnology & Biomedical": [
    "biotechnology",
    "biotech",
    "biomedical",
    "bioscience",
    "biological",
  ],
  "Mathematics & Computing": [
    "mathematics",
    "math",
    "computational",
    "statistics",
  ],
  "Physics & Applied Sciences": [
    "physics",
    "applied",
    "engineering physics",
    "material",
  ],
  "Metallurgy & Mining": ["metallurgy", "metallurgical", "mining", "mineral"],
  "Architecture & Planning": [
    "architecture",
    "planning",
    "design",
    "b.arch",
    "b.plan",
  ],
  Others: [],
};

interface ComparisonData {
  branch: string;
  branchId: string;
  category: string;
  fullName: string;
  [key: string]: string | number;
}

interface BranchMatch {
  branches: {
    branch: JosaaBranch;
    instituteId: string;
    instituteName: string;
  }[];
  category: string;
  normalizedName: string;
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

// Normalize branch name for matching
function normalizeBranchName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/bachelor of technology/gi, "")
    .replace(/b\.?tech/gi, "")
    .replace(/master of technology/gi, "")
    .replace(/m\.?tech/gi, "")
    .replace(/dual degree/gi, "")
    .replace(/integrated/gi, "")
    .replace(/4 year/gi, "")
    .replace(/5 year/gi, "")
    .replace(/\(.*?\)/g, "")
    .trim();
}

// Get branch category
function getBranchCategory(branchName: string): string {
  const normalizedName = branchName.toLowerCase();

  for (const [category, keywords] of Object.entries(BRANCH_CATEGORIES)) {
    if (keywords.some((kw) => normalizedName.includes(kw))) {
      return category;
    }
  }
  return "Others";
}

// Calculate similarity score between two branch names
function calculateSimilarity(name1: string, name2: string): number {
  const norm1 = normalizeBranchName(name1);
  const norm2 = normalizeBranchName(name2);

  if (norm1 === norm2) return 1;

  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const longer = norm1.length > norm2.length ? norm1 : norm2;
    const shorter = norm1.length > norm2.length ? norm2 : norm1;
    return shorter.length / longer.length;
  }

  const words1 = new Set(norm1.split(" ").filter((w) => w.length > 2));
  const words2 = new Set(norm2.split(" ").filter((w) => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = [...words1].filter((w) => words2.has(w));
  const union = new Set([...words1, ...words2]);

  return intersection.length / union.size;
}

// Check if two branches are similar enough to compare
function areBranchesSimilar(
  branch1: JosaaBranch,
  branch2: JosaaBranch,
  threshold = 0.5,
): boolean {
  if (
    branch1.short_code &&
    branch2.short_code &&
    branch1.short_code.toLowerCase() === branch2.short_code.toLowerCase()
  ) {
    return true;
  }

  const similarity = calculateSimilarity(branch1.name, branch2.name);
  return similarity >= threshold;
}

export default function ComparePage() {
  const [searchParams, setSearchParams] = useQueryStates({
    institutes: parseAsArrayOf(parseAsString).withDefault([]),
    category: parseAsString.withDefault("OPEN"),
    gender: parseAsString.withDefault("Gender-Neutral"),
    year: parseAsString.withDefault("2025"),
  });

  // Use SWR for institutes - automatic deduplication & caching
  const { institutes: allInstitutes, isLoading: institutesLoading } =
    useJosaaInstitutes();
  const [selectedInstitutesData, setSelectedInstitutesData] = useState<
    { institute: JosaaInstitute; branches: JosaaBranch[]; cutoffs: any[] }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<"chart" | "table">("table");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "rank">("name");
  const [sortDesc, setSortDesc] = useState(false);
  const [branchFilter, setBranchFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedBranchFilter = useDebounce(branchFilter, 300);

  // Filter institutes based on search
  const filteredInstitutes = useMemo(() => {
    if (!debouncedSearch) return [] as JosaaInstitute[];
    const query = debouncedSearch.toLowerCase();
    return allInstitutes
      .filter(
        (inst: JosaaInstitute) =>
          (inst.name.toLowerCase().includes(query) ||
            inst.short_name?.toLowerCase().includes(query)) &&
          !searchParams.institutes.includes(inst.id),
      )
      .slice(0, 10);
  }, [allInstitutes, debouncedSearch, searchParams.institutes]);

  // Fetch comparison data when institutes change
  const fetchComparisonData = useCallback(async () => {
    if (searchParams.institutes.length < 2) {
      setSelectedInstitutesData([]);
      return;
    }

    setLoading(true);
    try {
      const promises = searchParams.institutes.map(async (id: string) => {
        const inst = allInstitutes.find((i: JosaaInstitute) => i.id === id);
        if (!inst) return null;

        const slug = inst.short_name.toLowerCase().replace(/\s+/g, "-");
        const res = await fetch(
          `/api/josaa/institutes/${slug}?year=${searchParams.year}`,
        );
        if (!res.ok) return null;
        return res.json();
      });

      const results = (await Promise.all(promises)).filter(Boolean);
      startTransition(() => {
        setSelectedInstitutesData(results);
      });
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

  // Match similar branches across institutes
  const matchedBranches = useMemo(() => {
    if (selectedInstitutesData.length < 2) return [];

    const matches: Map<string, BranchMatch> = new Map();

    const firstInstitute = selectedInstitutesData[0];
    if (!firstInstitute?.branches) return [];

    firstInstitute.branches.forEach((branch) => {
      const normalizedName = normalizeBranchName(branch.name);
      const category = getBranchCategory(branch.name);

      matches.set(normalizedName, {
        branches: [
          {
            branch,
            instituteId: firstInstitute.institute.id,
            instituteName: firstInstitute.institute.short_name,
          },
        ],
        category,
        normalizedName,
      });
    });

    selectedInstitutesData.slice(1).forEach((instituteData) => {
      if (!instituteData?.branches) return;

      instituteData.branches.forEach((branch) => {
        const normalizedName = normalizeBranchName(branch.name);

        let matched = false;

        for (const [key, match] of matches.entries()) {
          const refBranch = match.branches[0].branch;

          if (areBranchesSimilar(refBranch, branch)) {
            const existingFromInstitute = match.branches.find(
              (b) => b.instituteId === instituteData.institute.id,
            );

            if (!existingFromInstitute) {
              match.branches.push({
                branch,
                instituteId: instituteData.institute.id,
                instituteName: instituteData.institute.short_name,
              });
            }
            matched = true;
            break;
          }
        }

        if (!matched) {
          const category = getBranchCategory(branch.name);
          matches.set(normalizedName + "_" + instituteData.institute.id, {
            branches: [
              {
                branch,
                instituteId: instituteData.institute.id,
                instituteName: instituteData.institute.short_name,
              },
            ],
            category,
            normalizedName,
          });
        }
      });
    });

    return Array.from(matches.values()).filter(
      (match) => match.branches.length >= 2,
    );
  }, [selectedInstitutesData]);

  // Build comparison data for display
  const comparisonData = useMemo<ComparisonData[]>(() => {
    return matchedBranches.map((match) => {
      const firstBranch = match.branches[0].branch;
      const displayName = getBranchDisplayName(firstBranch);

      const row: ComparisonData = {
        branch:
          displayName.length > 40
            ? displayName.slice(0, 40) + "..."
            : displayName,
        branchId: firstBranch.id,
        category: match.category,
        fullName: displayName,
      };

      match.branches.forEach(({ branch, instituteId, instituteName }) => {
        const instituteData = selectedInstitutesData.find(
          (d) => d.institute.id === instituteId,
        );

        if (instituteData) {
          const cutoff = instituteData.cutoffs?.find(
            (c: any) =>
              (c.branch_id === (branch.original_id || branch.id) ||
                c.branch === branch.id) &&
              c.category === searchParams.category &&
              c.gender === searchParams.gender,
          );
          row[instituteName] = cutoff?.closing_rank || 0;
        }
      });

      return row;
    });
  }, [matchedBranches, selectedInstitutesData, searchParams]);

  // Filter and sort comparison data
  const filteredComparisonData = useMemo(() => {
    let data = comparisonData;

    if (selectedCategory !== "all") {
      data = data.filter((row) => row.category === selectedCategory);
    }

    if (debouncedBranchFilter) {
      const search = debouncedBranchFilter.toLowerCase();
      data = data.filter(
        (row) =>
          row.branch.toLowerCase().includes(search) ||
          row.fullName.toLowerCase().includes(search),
      );
    }

    data = data.filter((row) => {
      const values = Object.values(row).filter(
        (v) => typeof v === "number" && v > 0,
      );
      return values.length >= 2;
    });

    data = [...data].sort((a, b) => {
      if (sortBy === "name") {
        const comparison = a.branch.localeCompare(b.branch);
        return sortDesc ? -comparison : comparison;
      } else {
        const aValues = Object.values(a).filter(
          (v) => typeof v === "number" && v > 0,
        ) as number[];
        const bValues = Object.values(b).filter(
          (v) => typeof v === "number" && v > 0,
        ) as number[];
        const aAvg =
          aValues.length > 0
            ? aValues.reduce((s, v) => s + v, 0) / aValues.length
            : 999999;
        const bAvg =
          bValues.length > 0
            ? bValues.reduce((s, v) => s + v, 0) / bValues.length
            : 999999;
        const comparison = aAvg - bAvg;
        return sortDesc ? -comparison : comparison;
      }
    });

    return data;
  }, [
    comparisonData,
    selectedCategory,
    debouncedBranchFilter,
    sortBy,
    sortDesc,
  ]);

  // Get unique categories
  const availableCategories = useMemo(() => {
    const categories = new Set(comparisonData.map((row) => row.category));
    return Array.from(categories).sort();
  }, [comparisonData]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    comparisonData.forEach((row) => {
      counts[row.category] = (counts[row.category] || 0) + 1;
    });
    return counts;
  }, [comparisonData]);

  const handleAddInstitute = (institute: JosaaInstitute) => {
    if (searchParams.institutes.includes(institute.id)) return;
    if (searchParams.institutes.length >= 5) {
      toast.error("Maximum 5 institutes can be compared");
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

  const selectedInstitutes = useMemo(() => {
    return searchParams.institutes
      .map((id: string) =>
        allInstitutes.find((i: JosaaInstitute) => i.id === id),
      )
      .filter(Boolean) as JosaaInstitute[];
  }, [searchParams.institutes, allInstitutes]);

  const getRankComparison = (row: ComparisonData) => {
    const values = selectedInstitutes
      .map((inst) => ({
        name: inst.short_name,
        rank: row[inst.short_name] as number,
      }))
      .filter((v) => v.rank > 0)
      .sort((a, b) => a.rank - b.rank);

    return values;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
          <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center">
            <GitCompare className="w-8 h-8 mr-3" />
            Compare Institutes
          </h1>
          <p className="text-muted-foreground">
            Select up to 5 institutes to compare ALL branches with
            matching/similar programs
          </p>
        </div>

        {/* Institute Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 border-b-4 border-black">
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Selected Institutes ({selectedInstitutes.length}/5)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Search Input */}
              <div className="relative mb-4">
                <Input
                  type="text"
                  placeholder={
                    institutesLoading
                      ? "Loading institutes..."
                      : "Search institutes to add..."
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  disabled={institutesLoading}
                  className="border-2 border-black pl-10"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                {/* Dropdown */}
                {showDropdown && filteredInstitutes.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border-4 border-black max-h-60 overflow-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {filteredInstitutes.map((inst: JosaaInstitute) => (
                      <button
                        key={inst.id}
                        onClick={() => handleAddInstitute(inst)}
                        className="w-full text-left px-4 py-3 hover:bg-yellow-100 transition-colors border-b-2 border-gray-200 last:border-b-0"
                      >
                        <span className="font-bold">{inst.short_name}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          {inst.name}
                        </span>
                        <Badge className="ml-2" variant="neutral">
                          {inst.institute_type}
                        </Badge>
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
                    className="flex items-center gap-2 px-3 py-2 border-4 bg-white text-sm font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    style={{ borderColor: COLORS[idx % COLORS.length] }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2 border-black"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-bold">{inst.short_name}</span>
                    <button
                      onClick={() => handleRemoveInstitute(inst.id)}
                      className="ml-1 w-5 h-5 flex items-center justify-center bg-red-100 hover:bg-red-200 border-2 border-black text-xs font-bold"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {selectedInstitutes.length === 0 && (
                  <p className="text-gray-500 italic">
                    Add at least 2 institutes to start comparing
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-green-100 border-b-4 border-black">
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Year</label>
                <Select
                  value={searchParams.year}
                  onValueChange={(v) => setSearchParams({ year: v })}
                >
                  <SelectTrigger className="border-2 border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Category</label>
                <Select
                  value={searchParams.category}
                  onValueChange={(v) => setSearchParams({ category: v })}
                >
                  <SelectTrigger className="border-2 border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Gender</label>
                <Select
                  value={searchParams.gender}
                  onValueChange={(v) => setSearchParams({ gender: v })}
                >
                  <SelectTrigger className="border-2 border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gender-Neutral">
                      Gender-Neutral
                    </SelectItem>
                    <SelectItem value="Female-only (supernumerary)">
                      Female-only
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-xl font-bold">Loading comparison data...</p>
            </CardContent>
          </Card>
        )}

        {/* Comparison Results */}
        {!loading && selectedInstitutes.length >= 2 && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-blue-100">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">
                    {selectedInstitutes.length}
                  </p>
                  <p className="text-sm">Institutes</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-green-100">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">{comparisonData.length}</p>
                  <p className="text-sm">Common Branches</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-purple-100">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">
                    {availableCategories.length}
                  </p>
                  <p className="text-sm">Categories</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-orange-100">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">
                    {filteredComparisonData.length}
                  </p>
                  <p className="text-sm">Showing</p>
                </CardContent>
              </Card>
            </div>

            {/* Branch Category Filter & View Toggle */}
            <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  {/* Branch search */}
                  <div className="flex-grow">
                    <div className="relative">
                      <Input
                        placeholder="Search branches..."
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="border-2 border-black pl-10"
                      />
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      {branchFilter && (
                        <button
                          onClick={() => setBranchFilter("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category filter */}
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-full md:w-52 border-2 border-black">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Categories ({comparisonData.length})
                      </SelectItem>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat} ({categoryCounts[cat]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <div className="flex gap-2">
                    <Button
                      variant={sortBy === "name" ? "default" : "noShadow"}
                      size="sm"
                      onClick={() => {
                        if (sortBy === "name") {
                          setSortDesc(!sortDesc);
                        } else {
                          setSortBy("name");
                          setSortDesc(false);
                        }
                      }}
                      className="border-2 border-black"
                    >
                      Name{" "}
                      {sortBy === "name" &&
                        (sortDesc ? (
                          <ChevronDown className="w-4 h-4 ml-1" />
                        ) : (
                          <ChevronUp className="w-4 h-4 ml-1" />
                        ))}
                    </Button>
                    <Button
                      variant={sortBy === "rank" ? "default" : "noShadow"}
                      size="sm"
                      onClick={() => {
                        if (sortBy === "rank") {
                          setSortDesc(!sortDesc);
                        } else {
                          setSortBy("rank");
                          setSortDesc(false);
                        }
                      }}
                      className="border-2 border-black"
                    >
                      Rank{" "}
                      {sortBy === "rank" &&
                        (sortDesc ? (
                          <ChevronDown className="w-4 h-4 ml-1" />
                        ) : (
                          <ChevronUp className="w-4 h-4 ml-1" />
                        ))}
                    </Button>
                  </div>

                  {/* View toggle */}
                  <div className="flex gap-1 border-2 border-black p-1">
                    <Button
                      variant={viewMode === "table" ? "default" : "neutral"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                    >
                      <Table className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "chart" ? "default" : "neutral"}
                      size="sm"
                      onClick={() => setViewMode("chart")}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparison Table View */}
            {viewMode === "table" && filteredComparisonData.length > 0 && (
              <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-4 border-black">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <GraduationCap className="w-5 h-5 mr-2" />
                      Branch Comparison -{" "}
                      {selectedCategory === "all"
                        ? "All Categories"
                        : selectedCategory}
                    </span>
                    <Badge>{filteredComparisonData.length} branches</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-4 border-black bg-gray-100">
                          <th className="text-left py-4 px-4 font-bold sticky left-0 bg-gray-100 z-10 min-w-[250px]">
                            Branch
                          </th>
                          {selectedInstitutes.map((inst, idx) => (
                            <th
                              key={inst.id}
                              className="text-center py-4 px-4 font-bold min-w-[120px]"
                            >
                              <div
                                className="flex items-center justify-center gap-2"
                                style={{ color: COLORS[idx % COLORS.length] }}
                              >
                                <div
                                  className="w-3 h-3 rounded-full border-2 border-black"
                                  style={{
                                    backgroundColor:
                                      COLORS[idx % COLORS.length],
                                  }}
                                />
                                {inst.short_name}
                              </div>
                            </th>
                          ))}
                          <th className="text-center py-4 px-4 font-bold min-w-[100px]">
                            Best
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredComparisonData.map((row, rowIdx) => {
                          const rankedValues = getRankComparison(row);
                          const bestInstitute = rankedValues[0];

                          return (
                            <tr
                              key={row.branchId}
                              className={`border-b-2 border-gray-200 hover:bg-gray-50 ${
                                rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }`}
                            >
                              <td className="py-3 px-4 sticky left-0 bg-inherit z-10">
                                <div>
                                  <span className="font-medium">
                                    {row.branch}
                                  </span>
                                  <Badge
                                    variant="neutral"
                                    className="ml-2 text-xs"
                                  >
                                    {row.category}
                                  </Badge>
                                </div>
                              </td>
                              {selectedInstitutes.map((inst, idx) => {
                                const rank = row[inst.short_name] as number;
                                const isBest =
                                  bestInstitute?.name === inst.short_name &&
                                  rank > 0;

                                return (
                                  <td
                                    key={inst.id}
                                    className={`text-center py-3 px-4 font-mono ${
                                      isBest ? "bg-green-100 font-bold" : ""
                                    }`}
                                  >
                                    {rank > 0 ? (
                                      <span
                                        className={
                                          isBest ? "text-green-700" : ""
                                        }
                                      >
                                        {rank.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="text-center py-3 px-4">
                                {bestInstitute && (
                                  <Badge
                                    style={{
                                      backgroundColor:
                                        COLORS[
                                          selectedInstitutes.findIndex(
                                            (i) =>
                                              i.short_name ===
                                              bestInstitute.name,
                                          ) % COLORS.length
                                        ] + "40",
                                      color:
                                        COLORS[
                                          selectedInstitutes.findIndex(
                                            (i) =>
                                              i.short_name ===
                                              bestInstitute.name,
                                          ) % COLORS.length
                                        ],
                                    }}
                                    className="border"
                                  >
                                    {bestInstitute.name}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chart View */}
            {viewMode === "chart" && filteredComparisonData.length > 0 && (
              <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader className="border-b-4 border-black">
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Closing Rank Comparison Chart
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(
                      400,
                      filteredComparisonData.slice(0, 20).length * 35,
                    )}
                  >
                    <BarChart
                      data={filteredComparisonData.slice(0, 20)}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 200, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        type="number"
                        tickFormatter={(v: number) => v.toLocaleString()}
                        tick={{ fontWeight: 600 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="branch"
                        width={180}
                        tick={{ fontSize: 11, fontWeight: 600 }}
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
                  {filteredComparisonData.length > 20 && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      Showing top 20 branches. Use table view to see all{" "}
                      {filteredComparisonData.length} branches.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* No matches found */}
            {filteredComparisonData.length === 0 && (
              <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-yellow-50">
                <CardContent className="p-12 text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-bold mb-2">
                    No Matching Branches Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {comparisonData.length === 0
                      ? "These institutes don't have any similar branches to compare."
                      : "No branches match your current filters."}
                  </p>
                  {(selectedCategory !== "all" || branchFilter) && (
                    <Button
                      onClick={() => {
                        setSelectedCategory("all");
                        setBranchFilter("");
                      }}
                      className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            <Card className="border-2 border-black bg-gray-50 mt-6">
              <CardContent className="p-4">
                <p className="font-semibold text-sm mb-2">How to Read:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border border-green-400" />
                    <span>
                      <strong>Highlighted cells</strong> indicate the best
                      (lowest) closing rank for that branch
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 font-mono">—</span>
                    <span>
                      <strong>Dash</strong> means this branch is not offered at
                      that institute
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Lower closing rank = More competitive/harder to get
                  admission
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!loading && selectedInstitutes.length < 2 && (
          <Card className="border-4 border-dashed border-gray-400 bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
            <CardContent className="p-12 text-center">
              <GitCompare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold mb-2">
                Select at least 2 institutes
              </h3>
              <p className="text-gray-600">
                Use the search above to add institutes for comparison
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {selectedInstitutes.length >= 2 &&
          !loading &&
          comparisonData.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-4 border-black bg-blue-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">
                    💡 Smart Branch Matching
                  </h3>
                  <p className="text-sm text-gray-700">
                    We automatically match similar branches across institutes
                    (e.g., &quot;Computer Science and Engineering&quot; matches
                    with &quot;Computer Science&quot;). Only branches available
                    in 2+ institutes are shown.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-4 border-black bg-green-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">Pro Tip</h3>
                  <p className="text-sm text-gray-700">
                    Use the category filter to focus on specific fields (e.g.,
                    &quot;Computer Science&quot; or &quot;Mechanical
                    Engineering&quot;). The table view shows all branches, while
                    chart shows top 20.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
      </div>
    </div>
  );
}
