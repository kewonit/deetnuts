"use client";

import { useState, useCallback } from "react";
import {
  Search,
  X,
  Filter,
  RotateCcw,
  Loader2,
  Check,
  ChevronDown,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FilterState } from "./types";
import { ENGINEERING_BRANCHES, COURSE_GROUPS } from "./constants";
import { Badge } from "@/components/ui/badge";

interface FiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSearch: () => void;
  loading: boolean;
}

export function Filters({
  filters,
  onFiltersChange,
  onSearch,
  loading,
}: FiltersProps) {
  const [branchPopoverOpen, setBranchPopoverOpen] = useState(false);

  const updateFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      onFiltersChange({
        ...filters,
        [key]: value,
      });
    },
    [filters, onFiltersChange],
  );

  const updateBranches = useCallback(
    (newBranches: string[]) => {
      onFiltersChange({
        ...filters,
        branches: newBranches,
      });
    },
    [filters, onFiltersChange],
  );

  const toggleBranch = useCallback(
    (branch: string) => {
      const currentBranches = filters.branches || [];
      const isSelected = currentBranches.includes(branch);

      if (isSelected) {
        updateBranches(currentBranches.filter((b) => b !== branch));
      } else {
        updateBranches([...currentBranches, branch]);
      }
    },
    [filters.branches, updateBranches],
  );

  const toggleGroup = useCallback(
    (groupName: string) => {
      const groupBranches =
        COURSE_GROUPS[groupName as keyof typeof COURSE_GROUPS] || [];
      const availableGroupBranches = groupBranches.filter((branch) =>
        ENGINEERING_BRANCHES.includes(branch as any),
      );
      const currentBranches = filters.branches || [];

      // Check if all branches in the group are selected
      const allGroupSelected = availableGroupBranches.every((branch) =>
        currentBranches.includes(branch),
      );

      if (allGroupSelected) {
        // Remove all group branches
        updateBranches(
          currentBranches.filter(
            (branch) => !availableGroupBranches.includes(branch),
          ),
        );
      } else {
        // Add all group branches (avoid duplicates)
        const newBranches = [
          ...new Set([...currentBranches, ...availableGroupBranches]),
        ];
        updateBranches(newBranches);
      }
    },
    [filters.branches, updateBranches],
  );

  const clearFilters = useCallback(() => {
    onFiltersChange({
      search: "",
      branch: "",
      branches: [],
      minPercentile: "",
      maxPercentile: "",
      minRank: "",
      maxRank: "",
      collegeName: "",
    });
  }, [onFiltersChange]);

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");
  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== "",
  ).length;

  // Get filtered branches based on search
  const filteredBranches = ENGINEERING_BRANCHES.filter((branch) =>
    branch.toLowerCase().includes((filters.search || "").toLowerCase()),
  );

  return (
    <Card className="w-full border-2 border-black shadow-base rounded-base bg-white">
      <CardHeader className="pb-3 bg-[#E4DFF2] border-b-2 border-black">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg font-bold text-black">
              Filters
            </CardTitle>
            {activeFilterCount > 0 && (
              <Badge
                variant="neutral"
                className="text-xs border-2 border-black shadow-base bg-white"
              >
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="neutral"
                size="sm"
                onClick={clearFilters}
                className="shadow-base border-2 border-black hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {/* Primary Search */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <Label htmlFor="search" className="text-sm font-medium text-black">
              Search
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search colleges, courses, or choice codes..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-10 border-2 border-black shadow-base rounded-base"
              />
              {filters.search && (
                <Button
                  variant="noShadow"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => updateFilter("search", "")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <Button
              onClick={onSearch}
              disabled={loading}
              className="shadow-base border-2 border-black hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Enhanced Multi-Select Branch Filter */}
        <div>
          <Label
            htmlFor="branch"
            className="text-sm font-medium text-black flex items-center space-x-2 mb-2"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Engineering Branches</span>
          </Label>
          <Popover open={branchPopoverOpen} onOpenChange={setBranchPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="neutral"
                role="combobox"
                aria-expanded={branchPopoverOpen}
                className="w-full justify-between border-2 border-black shadow-base rounded-base h-auto min-h-[48px] py-3 px-4 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <div className="flex flex-wrap gap-1.5 max-w-[calc(100%-40px)]">
                  {filters.branches && filters.branches.length > 0 ? (
                    <>
                      {filters.branches.slice(0, 3).map((branch) => (
                        <Badge
                          key={branch}
                          variant="neutral"
                          className="text-xs font-medium border-2 border-black bg-gradient-to-r from-[#E4DFF2] to-[#D6C7F7] shadow-sm"
                        >
                          {branch.length > 25
                            ? `${branch.substring(0, 25)}...`
                            : branch}
                        </Badge>
                      ))}
                      {filters.branches.length > 3 && (
                        <Badge
                          variant="neutral"
                          className="text-xs font-bold border-2 border-black bg-gradient-to-r from-blue-100 to-blue-200"
                        >
                          +{filters.branches.length - 3} more
                        </Badge>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-600">
                      <GraduationCap className="h-4 w-4" />
                      <span>
                        Select engineering branches or entire groups...
                      </span>
                    </div>
                  )}
                </div>
                <ChevronDown className="ml-2 h-5 w-5 shrink-0 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-full min-w-[350px] sm:min-w-[500px] max-w-[95vw] sm:max-w-[700px] p-0 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-base bg-white"
              align="start"
            >
              <div className="bg-gradient-to-r from-[#E4DFF2] to-[#D6C7F7] border-b-2 border-black p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-black flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Select Engineering Branches
                  </h3>
                  {filters.branches && filters.branches.length > 0 && (
                    <Badge
                      variant="neutral"
                      className="border-2 border-black bg-white font-bold"
                    >
                      {filters.branches.length} selected
                    </Badge>
                  )}
                </div>
              </div>
              <Command className="border-none">
                <div className="p-2 border-b border-gray-200">
                  <CommandInput
                    placeholder="🔍 Search for branches or keywords..."
                    className="h-10 border-2 border-black rounded-base shadow-sm"
                  />
                </div>
                <CommandList className="max-h-96 overflow-y-auto">
                  <CommandEmpty className="py-6 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 opacity-50" />
                      <span>No branches found matching your search.</span>
                    </div>
                  </CommandEmpty>

                  {/* Quick Actions */}
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => updateBranches([])}
                      className="font-medium text-red-600 hover:bg-red-50 border-b border-gray-100 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        Clear All Selections
                      </div>
                    </CommandItem>
                  </CommandGroup>

                  {/* Course Groups with Enhanced Design */}
                  {Object.entries(COURSE_GROUPS).map(
                    ([groupName, branches]) => {
                      const availableGroupBranches = branches.filter((branch) =>
                        ENGINEERING_BRANCHES.includes(branch as any),
                      );
                      const currentBranches = filters.branches || [];
                      const selectedInGroup = availableGroupBranches.filter(
                        (branch) => currentBranches.includes(branch),
                      ).length;
                      const allGroupSelected =
                        selectedInGroup === availableGroupBranches.length;
                      const someGroupSelected = selectedInGroup > 0;

                      return (
                        <CommandGroup key={groupName}>
                          <div className="bg-gray-50 border-y border-gray-200 sticky top-0 z-10">
                            <CommandItem
                              onSelect={() => toggleGroup(groupName)}
                              className="font-bold bg-gradient-to-r from-[#E4DFF2]/70 to-[#D6C7F7]/70 hover:from-[#E4DFF2] hover:to-[#D6C7F7] border-b border-gray-200 py-3"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center space-x-3">
                                  <Checkbox
                                    checked={allGroupSelected}
                                    className={`border-2 border-black h-5 w-5 ${
                                      someGroupSelected && !allGroupSelected
                                        ? "data-[state=checked]:bg-blue-500 bg-blue-200"
                                        : ""
                                    }`}
                                  />
                                  <span className="text-black">
                                    📁 {groupName}
                                  </span>
                                </div>
                                <Badge
                                  variant="neutral"
                                  className="border border-black bg-white text-xs font-bold"
                                >
                                  {selectedInGroup}/
                                  {availableGroupBranches.length}
                                </Badge>
                              </div>
                            </CommandItem>
                          </div>

                          {/* Individual Branches with better spacing */}
                          <div className="bg-white">
                            {availableGroupBranches.map((branch, index) => {
                              const isSelected =
                                currentBranches.includes(branch);
                              return (
                                <CommandItem
                                  key={branch}
                                  onSelect={() => toggleBranch(branch)}
                                  className={`pl-8 py-2.5 hover:bg-blue-50 ${
                                    index === availableGroupBranches.length - 1
                                      ? "border-b-2 border-gray-200 mb-2"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center space-x-3 w-full">
                                    <Checkbox
                                      checked={isSelected}
                                      className="border-2 border-black h-4 w-4"
                                    />
                                    <span className="text-sm text-gray-700 flex-1">
                                      {branch}
                                    </span>
                                    {isSelected && (
                                      <Check className="h-4 w-4 text-green-600" />
                                    )}
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </div>
                        </CommandGroup>
                      );
                    },
                  )}

                  {/* Enhanced Ungrouped Branches */}
                  {(() => {
                    const groupedBranches = Object.values(COURSE_GROUPS).flat();
                    const ungroupedBranches = ENGINEERING_BRANCHES.filter(
                      (branch) => !groupedBranches.includes(branch),
                    );

                    if (ungroupedBranches.length > 0) {
                      return (
                        <CommandGroup>
                          <div className="bg-gray-50 border-y border-gray-200 sticky top-0 z-10">
                            <div className="font-bold text-gray-700 py-2 px-4 bg-gray-100">
                              🔧 Other Engineering Branches
                            </div>
                          </div>
                          <div className="bg-white">
                            {ungroupedBranches.map((branch) => {
                              const isSelected = (
                                filters.branches || []
                              ).includes(branch);
                              return (
                                <CommandItem
                                  key={branch}
                                  onSelect={() => toggleBranch(branch)}
                                  className="pl-8 py-2.5 hover:bg-blue-50"
                                >
                                  <div className="flex items-center space-x-3 w-full">
                                    <Checkbox
                                      checked={isSelected}
                                      className="border-2 border-black h-4 w-4"
                                    />
                                    <span className="text-sm text-gray-700 flex-1">
                                      {branch}
                                    </span>
                                    {isSelected && (
                                      <Check className="h-4 w-4 text-green-600" />
                                    )}
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </div>
                        </CommandGroup>
                      );
                    }
                    return null;
                  })()}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <Separator />

        {/* Percentile Filter */}
        <div>
          <Label
            htmlFor="maxPercentile"
            className="text-sm font-medium text-black"
          >
            Your Percentile
          </Label>
          <p className="text-xs text-gray-500 mb-1">
            Find colleges with cutoffs at or below your percentile.
          </p>
          <Input
            id="maxPercentile"
            type="text"
            inputMode="decimal"
            placeholder="e.g., 98.54"
            value={filters.maxPercentile}
            onChange={(e) => {
              const { value } = e.target;
              // Regex to allow only numbers and a single decimal point.
              // Allows an empty string, a number, a number with a decimal, or a decimal followed by a number.
              if (/^$|^(\d+)?(\.\d*)?$/.test(value)) {
                updateFilter("maxPercentile", value);
              }
            }}
            className="border-2 border-black shadow-base rounded-base"
          />
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Filters:</Label>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="neutral" className="text-xs">
                  Search: {filters.search}
                  <Button
                    variant="noShadow"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => updateFilter("search", "")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.branch && (
                <Badge variant="neutral" className="text-xs">
                  Branch: {filters.branch}
                  <Button
                    variant="noShadow"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => updateFilter("branch", "")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {(filters.minPercentile || filters.maxPercentile) && (
                <Badge variant="neutral" className="text-xs">
                  Percentile: {filters.minPercentile || "0"} -{" "}
                  {filters.maxPercentile || "100"}
                  <Button
                    variant="noShadow"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => {
                      updateFilter("minPercentile", "");
                      updateFilter("maxPercentile", "");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {(filters.minRank || filters.maxRank) && (
                <Badge variant="neutral" className="text-xs">
                  Rank: {filters.minRank || "1"} - {filters.maxRank || "∞"}
                  <Button
                    variant="noShadow"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => {
                      updateFilter("minRank", "");
                      updateFilter("maxRank", "");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.collegeName && (
                <Badge variant="neutral" className="text-xs">
                  College: {filters.collegeName}
                  <Button
                    variant="noShadow"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => updateFilter("collegeName", "")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
