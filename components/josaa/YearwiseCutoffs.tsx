"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, TrendingUp, TrendingDown } from "lucide-react";

interface CutoffData {
  year: number;
  round: number;
  opening_rank: number;
  closing_rank: number;
  category: string;
  gender: string;
}

interface YearwiseCutoffsProps {
  trends: CutoffData[];
  branchName?: string;
  instituteName?: string;
}

export default function YearwiseCutoffs({
  trends,
  branchName,
  instituteName,
}: YearwiseCutoffsProps) {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [selectedRound, setSelectedRound] = useState<string>("last");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"opening" | "closing">("closing");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Get unique values for filters
  const years = useMemo(() => {
    return [...new Set(trends.map((t) => t.year))].sort((a, b) => b - a);
  }, [trends]);

  const categories = useMemo(() => {
    return [...new Set(trends.map((t) => t.category))];
  }, [trends]);

  const genders = useMemo(() => {
    return [...new Set(trends.map((t) => t.gender))];
  }, [trends]);

  const rounds = useMemo(() => {
    return [...new Set(trends.map((t) => t.round))].sort((a, b) => a - b);
  }, [trends]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    // First, if selectedRound is "last", get only the last round for each year+category+gender
    let dataToFilter = trends;

    if (selectedRound === "last") {
      // Group by year+category+gender and keep only the last round
      const lastRoundMap = new Map<string, (typeof trends)[0]>();
      trends.forEach((item) => {
        const key = `${item.year}-${item.category}-${item.gender}`;
        const existing = lastRoundMap.get(key);
        if (!existing || item.round > existing.round) {
          lastRoundMap.set(key, item);
        }
      });
      dataToFilter = Array.from(lastRoundMap.values());
    } else if (selectedRound !== "all") {
      dataToFilter = trends.filter(
        (item) => item.round === parseInt(selectedRound),
      );
    }

    const filtered = dataToFilter.filter((item) => {
      if (selectedYear !== "all" && item.year !== parseInt(selectedYear))
        return false;
      if (selectedCategory !== "all" && item.category !== selectedCategory)
        return false;
      if (selectedGender !== "all" && item.gender !== selectedGender)
        return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          item.category.toLowerCase().includes(search) ||
          item.gender.toLowerCase().includes(search) ||
          item.year.toString().includes(search)
        );
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const aVal = sortBy === "opening" ? a.opening_rank : a.closing_rank;
      const bVal = sortBy === "opening" ? b.opening_rank : b.closing_rank;
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [
    trends,
    selectedYear,
    selectedCategory,
    selectedGender,
    selectedRound,
    searchTerm,
    sortBy,
    sortOrder,
  ]);

  // Group data by year
  const groupedData = useMemo(() => {
    const grouped: Record<number, CutoffData[]> = {};
    filteredData.forEach((item) => {
      if (!grouped[item.year]) {
        grouped[item.year] = [];
      }
      grouped[item.year].push(item);
    });
    return grouped;
  }, [filteredData]);

  const hasActiveFilters =
    selectedYear !== "all" ||
    selectedCategory !== "all" ||
    selectedGender !== "all" ||
    selectedRound !== "last" ||
    searchTerm !== "";

  const clearFilters = () => {
    setSelectedYear("all");
    setSelectedCategory("all");
    setSelectedGender("all");
    setSelectedRound("last");
    setSearchTerm("");
  };

  const getGenderColor = (gender: string) => {
    if (gender.toLowerCase().includes("female"))
      return "bg-pink-100 text-pink-800 border-pink-300";
    if (gender.toLowerCase().includes("male"))
      return "bg-blue-100 text-blue-800 border-blue-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      OPEN: "bg-green-100 text-green-800 border-green-300",
      EWS: "bg-yellow-100 text-yellow-800 border-yellow-300",
      "OBC-NCL": "bg-orange-100 text-orange-800 border-orange-300",
      SC: "bg-purple-100 text-purple-800 border-purple-300",
      ST: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[category] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          Historical Cutoffs
          {branchName && instituteName && (
            <span className="text-base font-normal text-gray-600 ml-2">
              - {branchName} at {instituteName}
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Filter and search through {trends.length} cutoff data points
        </p>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6 p-4 bg-gray-50 border-2 border-black rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Year Filter */}
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="border-2 border-black">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="border-2 border-black">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Gender Filter */}
            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger className="border-2 border-black">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                {genders.map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {gender}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Round Filter */}
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger className="border-2 border-black">
                <SelectValue placeholder="Round" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last">Final Round Only</SelectItem>
                <SelectItem value="all">All Rounds</SelectItem>
                {rounds.map((round) => (
                  <SelectItem key={round} value={round.toString()}>
                    Round {round}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-black"
              />
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold">Sort by:</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={sortBy === "opening" ? "default" : "noShadow"}
                onClick={() => setSortBy("opening")}
                className="border-2 border-black"
              >
                Opening Rank
              </Button>
              <Button
                size="sm"
                variant={sortBy === "closing" ? "default" : "noShadow"}
                onClick={() => setSortBy("closing")}
                className="border-2 border-black"
              >
                Closing Rank
              </Button>
            </div>
            <Button
              size="sm"
              variant="noShadow"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="border-2 border-black flex items-center gap-1"
            >
              {sortOrder === "asc" ? (
                <>
                  <TrendingUp className="w-4 h-4" /> Low to High
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4" /> High to Low
                </>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                size="sm"
                variant="noShadow"
                onClick={clearFilters}
                className="ml-auto border-2 border-black flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Clear All
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-600">
                Active:
              </span>
              {selectedYear !== "all" && (
                <Badge variant="neutral" className="border border-black">
                  Year: {selectedYear}
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="neutral" className="border border-black">
                  {selectedCategory}
                </Badge>
              )}
              {selectedGender !== "all" && (
                <Badge variant="neutral" className="border border-black">
                  {selectedGender}
                </Badge>
              )}
              {selectedRound !== "last" && (
                <Badge variant="neutral" className="border border-black">
                  {selectedRound === "all"
                    ? "All Rounds"
                    : `Round ${selectedRound}`}
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="neutral" className="border border-black">
                  Search: &quot;{searchTerm}&quot;
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-4 text-sm text-gray-600 font-medium">
          Showing {filteredData.length} of {trends.length} results
        </div>

        {/* Data Display */}
        <div className="space-y-4">
          {Object.keys(groupedData).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-semibold">No results found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            Object.entries(groupedData)
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .map(([year, data]) => (
                <div
                  key={year}
                  className="border-2 border-black rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-100 px-4 py-2 border-b-2 border-black flex items-center justify-between">
                    <span className="font-bold text-lg">{year}</span>
                    <Badge variant="neutral" className="border border-black">
                      {data.length} entries
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-black">
                          {selectedRound === "all" && (
                            <th className="text-center py-2 px-3 font-bold">
                              Round
                            </th>
                          )}
                          <th className="text-left py-2 px-3 font-bold">
                            Category
                          </th>
                          <th className="text-left py-2 px-3 font-bold">
                            Gender
                          </th>
                          <th className="text-right py-2 px-3 font-bold">
                            Opening
                          </th>
                          <th className="text-right py-2 px-3 font-bold">
                            Closing
                          </th>
                          <th className="text-right py-2 px-3 font-bold">
                            Spread
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`border-b border-gray-200 hover:bg-gray-50 ${
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                            }`}
                          >
                            {selectedRound === "all" && (
                              <td className="py-2 px-3 text-center">
                                <Badge
                                  variant="neutral"
                                  className="border border-gray-400 text-xs"
                                >
                                  R{row.round}
                                </Badge>
                              </td>
                            )}
                            <td className="py-2 px-3">
                              <Badge
                                className={`border-2 ${getCategoryColor(
                                  row.category,
                                )} font-bold`}
                              >
                                {row.category}
                              </Badge>
                            </td>
                            <td className="py-2 px-3">
                              <Badge
                                className={`border ${getGenderColor(
                                  row.gender,
                                )}`}
                              >
                                {row.gender}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-green-700">
                              {row.opening_rank?.toLocaleString() || "-"}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-red-700">
                              {row.closing_rank?.toLocaleString() || "-"}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-blue-700">
                              {(
                                (row.closing_rank || 0) -
                                (row.opening_rank || 0)
                              ).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
