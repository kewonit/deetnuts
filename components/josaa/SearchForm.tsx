"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { FilterOptions, JosaaCutoffExpanded } from "@/lib/types/josaa";
import CutoffMatrix from "@/components/josaa/CutoffMatrix";

// Debounce hook for performance
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface SearchFormProps {
  filterOptions: FilterOptions;
  initialParams: Record<string, string>;
}

export default function JosaaSearchForm({
  filterOptions,
  initialParams,
}: SearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // URL state with nuqs
  const [rank, setRank] = useQueryState("rank", parseAsInteger);
  const [instituteType, setInstituteType] = useQueryState(
    "type",
    parseAsString
  );
  const [year, setYear] = useQueryState(
    "year",
    parseAsInteger.withDefault(filterOptions.years[0])
  );
  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withDefault("OPEN")
  );
  const [gender, setGender] = useQueryState(
    "gender",
    parseAsString.withDefault("Gender-Neutral")
  );

  // Local state
  const [results, setResults] = useState<JosaaCutoffExpanded[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rankInput, setRankInput] = useState(rank?.toString() || "");

  // Filtered institutes based on type
  const filteredInstitutes = useMemo(() => {
    if (!instituteType) return filterOptions.institutes;
    return filterOptions.institutes.filter((i) => i.type === instituteType);
  }, [filterOptions.institutes, instituteType]);

  // Search handler - uses API route
  const handleSearch = async () => {
    const rankValue = parseInt(rankInput);
    if (!rankValue || rankValue <= 0) return;

    setRank(rankValue);
    setLoading(true);
    setSearched(true);

    try {
      // Build query params for API
      const params = new URLSearchParams({
        minRank: rankValue.toString(),
        year: year.toString(),
        category: category,
        gender: gender,
        page: "1",
        perPage: "100",
        expand: "true",
      });

      if (instituteType) {
        params.set("instituteType", instituteType);
      }

      const res = await fetch(`/api/josaa/cutoffs?${params.toString()}`);

      if (!res.ok) {
        throw new Error("Failed to fetch cutoffs");
      }

      const response = await res.json();

      // API already filters for closing_rank >= rankValue, just sort by closing rank
      const results: JosaaCutoffExpanded[] = response.items || [];

      // Sort by closing rank (best matches first - colleges where you barely get in)
      results.sort(
        (a: JosaaCutoffExpanded, b: JosaaCutoffExpanded) =>
          a.closing_rank - b.closing_rank
      );

      setResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setRankInput("");
    setRank(null);
    setInstituteType(null);
    setCategory("OPEN");
    setGender("Gender-Neutral");
    setResults([]);
    setSearched(false);
  };

  // Group results by institute
  const groupedResults = useMemo(() => {
    const groups = new Map<string, JosaaCutoffExpanded[]>();

    results.forEach((result) => {
      const key = result.expand?.institute?.id || result.institute;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(result);
    });

    return Array.from(groups.entries()).map(([id, cutoffs]) => ({
      institute: cutoffs[0].expand?.institute,
      cutoffs: cutoffs.sort((a, b) => a.closing_rank - b.closing_rank),
    }));
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100 border-b-4 border-black">
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Search Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rank Input */}
            <div className="lg:col-span-2">
              <Label className="text-sm font-semibold mb-2 block">
                Your JEE Rank *
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Enter your expected/actual rank"
                  value={rankInput}
                  onChange={(e) => setRankInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="border-2 border-black text-lg h-12"
                  min={1}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  AIR
                </span>
              </div>
            </div>

            {/* Year */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Year</Label>
              <Select
                value={year.toString()}
                onValueChange={(v) => setYear(parseInt(v))}
              >
                <SelectTrigger className="border-2 border-black h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-2 border-black h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-blue-600 mt-4 hover:underline"
          >
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 mr-1" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-1" />
            )}
            {showAdvanced ? "Hide" : "Show"} Advanced Filters
          </button>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              {/* Institute Type */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Institute Type
                </Label>
                <Select
                  value={instituteType || "all"}
                  onValueChange={(v) =>
                    setInstituteType(v === "all" ? null : v)
                  }
                >
                  <SelectTrigger className="border-2 border-black">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {filterOptions.instituteTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}s
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Gender
                </Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="border-2 border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.genders.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <Button
              onClick={handleSearch}
              disabled={!rankInput || loading}
              className="flex-grow h-12 text-lg border-2 border-black bg-blue-500 hover:bg-blue-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Search className="w-5 h-5 mr-2" />
              )}
              Find Colleges
            </Button>
            {searched && (
              <Button
                variant="noShadow"
                onClick={clearFilters}
                className="border-2 border-black hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && (
        <div>
          {/* Results Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {loading ? (
                "Searching..."
              ) : results.length > 0 ? (
                <>
                  Found{" "}
                  <span className="text-blue-600">{groupedResults.length}</span>{" "}
                  colleges with{" "}
                  <span className="text-green-600">{results.length}</span>{" "}
                  branches
                </>
              ) : (
                "No colleges found for your rank"
              )}
            </h2>
            {!loading && results.length > 0 && (
              <Badge className="bg-green-100 text-green-800 border border-green-300">
                Rank: {rank?.toLocaleString()} | {category} | {year}
              </Badge>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500 mb-4" />
              <p className="text-gray-500">Finding colleges for your rank...</p>
            </div>
          )}

          {/* No Results */}
          {!loading && results.length === 0 && searched && (
            <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-yellow-50">
              <CardContent className="p-8 text-center">
                <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Colleges Found
                </h3>
                <p className="text-gray-600 mb-4">
                  No colleges found for rank {rank?.toLocaleString()} in{" "}
                  {category} category for {year}.
                </p>
                <div className="text-sm text-gray-500">
                  <p>Try:</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Increasing your rank number</li>
                    <li>Changing the category</li>
                    <li>Selecting a different year</li>
                    <li>Removing institute type filter</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cutoff Matrix */}
          {!loading && results.length > 0 && rank && (
            <CutoffMatrix
              results={results}
              userRank={rank}
              category={category}
              year={year}
              isLoading={loading}
            />
          )}
        </div>
      )}
    </div>
  );
}
