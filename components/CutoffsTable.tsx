"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { CutoffData } from "@/lib/college-data";
import { BarChart, Filter, Search } from "lucide-react";

interface CutoffsTableProps {
  data: CutoffData[];
  isLoading?: boolean;
  error?: string | null;
}

export default function CutoffsTable({
  data,
  isLoading,
  error,
}: CutoffsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredData = useMemo(() => {
    let filtered = data || [];

    return filtered.filter((row) => {
      const matchesSearch =
        row.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.course_code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || row.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [data, searchTerm, categoryFilter]);

  const uniqueCategories = useMemo(() => {
    if (!data) return [];
    let categories = data.map((row) => row.category);
    return Array.from(new Set(categories)).sort();
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black rounded-base shadow-base p-8">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border-4 border-red-500 text-red-700 px-4 py-3 rounded-base relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="bg-yellow-100 border-4 border-yellow-500 text-yellow-700 px-4 py-3 rounded-base relative text-center"
        role="alert"
      >
        <strong className="font-heading">No Cutoff Data!</strong>
        <p className="font-base">
          Cutoff information for this college is not currently available. Please
          check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black rounded-base shadow-base">
      <div className="p-6 border-b-4 border-black flex justify-between items-center bg-blue-300">
        <h2 className="text-3xl font-heading text-black flex items-center">
          <BarChart className="w-8 h-8 mr-4" />
          MHT-CET 2024 Round 1 Cutoffs
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Search by course name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="border-2 border-black rounded-base overflow-hidden">
          <Table>
            <TableHeader className="bg-main">
              <TableRow>
                <TableHead className="font-heading text-black">
                  Course Code
                </TableHead>
                <TableHead className="font-heading text-black">
                  Course Name
                </TableHead>
                <TableHead className="font-heading text-black">
                  Category
                </TableHead>
                <TableHead className="font-heading text-black">
                  Cutoff Score
                </TableHead>
                <TableHead className="font-heading text-black">Rank</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-100">
                  <TableCell>{row.course_code}</TableCell>
                  <TableCell>{row.course_name}</TableCell>
                  <TableCell>
                    <span className="font-mono bg-gray-200 px-2 py-1 rounded-md text-sm">
                      {row.category}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {row.cutoff_score}
                  </TableCell>
                  <TableCell>{row.last_rank}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredData.length === 0 && (
          <div className="text-center p-8">
            <p className="font-heading text-lg">
              No results found for your filters.
            </p>
            <p className="text-gray-600">
              Try adjusting your search or category filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
