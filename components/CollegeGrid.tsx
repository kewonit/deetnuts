"use client";

import { useState, useMemo, memo } from "react";
import Link from "next/link";
import { getMhtCetCollegePath } from "@/lib/admissions/canonical";
import fuzzysort from "fuzzysort";

interface College {
  id: string;
  college_id: string;
  college_name: string;
  status: string;
  home_university: string;
}

interface CollegeGridProps {
  colleges: College[];
}

// Memoized CollegeCard to prevent unnecessary re-renders when parent filters
const CollegeCard = memo(function CollegeCard({
  college,
}: {
  college: College;
}) {
  const collegePath = getMhtCetCollegePath(
    college.college_name,
    college.college_id,
  );

  return (
    <div className="group bg-white border-4 border-black rounded-base shadow-base hover:shadow-lg transition-all duration-300 overflow-hidden hover:border-main flex flex-col">
      <div className="p-6 flex-grow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link href={collegePath} scroll={false}>
              <h2 className="text-xl font-heading text-black hover:text-main transition-colors group-hover:text-main line-clamp-2 mb-3 h-14">
                {college.college_name}
              </h2>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-main border-2 border-black rounded-base flex items-center justify-center mr-4 shrink-0">
              <span className="text-2xl">🆔</span>
            </div>
            <div>
              <span className="font-heading text-black block text-lg">
                College ID
              </span>
              <span className="font-base text-black text-xl">
                {college.college_id}
              </span>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-12 h-12 bg-green-300 border-2 border-black rounded-base flex items-center justify-center mr-4 shrink-0">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <span className="font-heading text-black block text-lg">
                Status
              </span>
              <span className="font-base text-black text-xl italic">
                {college.status}
              </span>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-12 h-12 bg-purple-300 border-2 border-black rounded-base flex items-center justify-center mr-4 shrink-0">
              <span className="text-2xl">🏫</span>
            </div>
            <div>
              <span className="font-heading text-black block text-lg">
                Home University
              </span>
              <p className="font-base text-black text-xl line-clamp-2">
                {college.home_university}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 pt-4 border-t-2 border-black">
        <Link
          href={collegePath}
          scroll={false}
          className="w-full inline-flex items-center justify-center px-6 py-3 bg-main text-black font-heading rounded-base hover:bg-main-dark transition-all duration-200 border-2 border-black shadow-base"
        >
          <span>View Details</span>
          <svg
            className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
});

export default function CollegeGrid({ colleges }: CollegeGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredColleges = useMemo(() => {
    if (!searchTerm.trim() && statusFilter === "all") return colleges;

    let result = colleges;
    if (searchTerm.trim()) {
      // Fuzzy search across name, ID, and university
      const searchKeys = ["college_name", "college_id", "home_university"];
      // Combine all searchable fields into a string for each college
      const prepared = result.map((college) => ({
        ...college,
        _search: `${college.college_name} ${college.college_id} ${college.home_university}`,
      }));
      const fuzzyResults = fuzzysort.go(searchTerm, prepared, {
        key: "_search",
        threshold: -10000,
      });
      result = fuzzyResults.map((r) => r.obj);
    }
    if (statusFilter !== "all") {
      result = result.filter((college) => college.status === statusFilter);
    }
    return result;
  }, [colleges, searchTerm, statusFilter]);

  const uniqueStatuses = useMemo(() => {
    const statuses = colleges.map((college) => college.status);
    return Array.from(new Set(statuses)).sort();
  }, [colleges]);

  return (
    <div className="space-y-8">
      {/* Search and Filter Controls */}
      <div className="bg-white border-4 border-black rounded-base shadow-base p-4 sm:p-8 mb-8">
        <div className="mb-6">
          <h2 className="text-3xl font-heading text-black mb-2">
            Find Your Perfect College
          </h2>
          <p className="text-lg font-base text-black">
            Use the filters below to narrow down your search
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-semibold text-gray-700 mb-3"
            >
              🔍 Search Colleges
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by name, ID, or university..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black rounded-base shadow-base focus:outline-none focus:ring-2 focus:ring-main focus:border-main transition-all duration-200 text-black placeholder-gray-500"
            />
          </div>
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-semibold text-gray-700 mb-3"
            >
              📊 Filter by Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black rounded-base shadow-base focus:outline-none focus:ring-2 focus:ring-main focus:border-main transition-all duration-200 text-black bg-white"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="px-4 py-2 bg-main text-black rounded-base font-heading border-2 border-black shadow-base">
              📈 Showing {filteredColleges.length} of {colleges.length} colleges
            </span>
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 bg-red-300 text-black rounded-base hover:bg-red-400 transition-colors border-2 border-black shadow-base font-heading"
              >
                ✖️ Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Colleges Grid */}
      {filteredColleges.length === 0 ? (
        <div className="bg-white p-12 rounded-base shadow-base text-center border-4 border-black">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-black mb-2">
              No colleges found
            </h3>
            <p className="text-black mb-6">
              Try adjusting your search criteria or filters to find more
              results.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="px-6 py-3 bg-main text-black rounded-base hover:bg-main-dark transition-colors font-heading border-2 border-black shadow-base"
            >
              Reset Search
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredColleges.map((college) => (
            <CollegeCard key={college.id} college={college} />
          ))}
        </div>
      )}
    </div>
  );
}
