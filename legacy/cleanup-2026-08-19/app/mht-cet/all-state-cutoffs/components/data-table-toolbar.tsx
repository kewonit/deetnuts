"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTableViewOptions } from "./data-table-view-options";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { CategoryFilter } from "./category-filter";
import { AllocationFilter } from "./allocation-filter";
import { useState, useEffect, useRef } from "react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onFilterChange?: (
    filterType:
      | "collegeFilter"
      | "branchFilter"
      | "categoryFilter"
      | "allocationFilter",
    value: string[],
  ) => void;
}

export function DataTableToolbar<TData>({
  table,
  onFilterChange,
}: DataTableToolbarProps<TData>) {
  const [categories, setCategories] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // Get all unique values from the data
  useEffect(() => {
    // Get all unique categories
    const uniqueCategories = Array.from(
      table.getColumn("category")?.getFacetedUniqueValues().keys() || [],
    ).filter(
      (value) => value !== undefined && value !== null && value !== "",
    ) as string[];

    // Get all unique branches
    const uniqueBranches = Array.from(
      table.getColumn("course_name")?.getFacetedUniqueValues().keys() || [],
    ).filter(
      (value) => value !== undefined && value !== null && value !== "",
    ) as string[];

    setCategories(uniqueCategories.sort());
    setBranches(uniqueBranches.sort());
  }, [table]);

  // Add state to track and persist filter selections
  const [activeFilters, setActiveFilters] = React.useState({
    branch: new Set<string>(),
    category: new Set<string>(),
    allocation: new Set<string>(),
  });

  // Handle faceted filter changes with improved server-side filtering and state persistence
  const handleFacetedFilterChange = (
    filterType:
      | "collegeFilter"
      | "branchFilter"
      | "categoryFilter"
      | "allocationFilter",
    value: string[],
  ) => {
    // Update our local active filters state to ensure persistence
    if (filterType === "branchFilter") {
      setActiveFilters((prev) => ({ ...prev, branch: new Set(value) }));
    } else if (filterType === "categoryFilter") {
      setActiveFilters((prev) => ({ ...prev, category: new Set(value) }));
    } else if (filterType === "allocationFilter") {
      setActiveFilters((prev) => ({ ...prev, allocation: new Set(value) }));
    }

    // Get the corresponding column based on filter type
    const column = table.getColumn(
      filterType === "branchFilter"
        ? "course_name"
        : filterType === "categoryFilter"
          ? "category"
          : filterType === "allocationFilter"
            ? "seat_allocation_section"
            : "college_name",
    );

    // Set the column filter value directly to ensure the UI updates
    if (column) {
      column.setFilterValue(value);
    }

    // If we have a callback, call it to trigger server-side filtering
    if (onFilterChange) {
      onFilterChange(filterType, value);
    }
  };

  // Static filter options for branches
  const staticBranches = [
    "Computer Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Electronics Engineering",
    "Information Technology",
    "Electronics & Telecommunication Engineering",
    "Chemical Engineering",
    "Artificial Intelligence & Data Science",
    "Artificial Intelligence & Machine Learning",
    "Computer Science and Engineering (Data Science)",
    "Computer Science and Engineering (AI & ML)",
    "Automobile Engineering",
    "Robotics Engineering",
    "Aerospace Engineering",
    "Biotechnology",
    "Production Engineering",
    "Instrumentation Engineering",
    "Food Technology",
    "Textile Engineering",
    "Mining Engineering",
    "Petroleum Engineering",
  ];

  // Get selected filters
  const collegeFilter = table
    .getColumn("college_name")
    ?.getFilterValue() as string;
  const isFiltered = collegeFilter || table.getState().columnFilters.length > 0;

  return (
    <div className="bg-white border-2 border-black rounded-base p-4 shadow-base">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-heading text-black">
            🔧 Advanced Filters
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* College search filter */}
          <Input
            placeholder="🏫 Search colleges..."
            value={collegeFilter ?? ""}
            onChange={(event) =>
              table
                .getColumn("college_name")
                ?.setFilterValue(event.target.value)
            }
            className="max-w-xs border-2 border-black rounded-base focus:border-black focus:ring-0"
          />

          {/* Faceted filters */}
          <DataTableFacetedFilter
            title="📚 Branch"
            options={staticBranches.map((branch) => ({
              label: branch,
              value: branch,
            }))}
            column={table.getColumn("course_name")}
            onFilterChange={(values) =>
              handleFacetedFilterChange("branchFilter", values)
            }
          />

          <CategoryFilter
            title="👥 Category"
            column={table.getColumn("category")}
            onFilterChange={(values) =>
              handleFacetedFilterChange("categoryFilter", values)
            }
          />

          <AllocationFilter
            title="🎯 Allocation"
            column={table.getColumn("seat_allocation_section")}
            onFilterChange={(values) =>
              handleFacetedFilterChange("allocationFilter", values)
            }
          />

          {/* Clear filters button */}
          {isFiltered && (
            <Button
              variant="neutral"
              onClick={() => {
                table.resetColumnFilters();
                // Clear faceted filters via the callback if we have one
                if (onFilterChange) {
                  onFilterChange("branchFilter", []);
                  onFilterChange("categoryFilter", []);
                  onFilterChange("allocationFilter", []);
                }
              }}
              className="h-10 px-3 bg-red-100 border-2 border-black hover:bg-red-200"
            >
              <X className="h-4 w-4 mr-2" />
              <span className="font-base">❌ Clear filters</span>
            </Button>
          )}

          {/* View options */}
          <div className="ml-auto">
            <DataTableViewOptions table={table} />
          </div>
        </div>
      </div>
    </div>
  );
}
