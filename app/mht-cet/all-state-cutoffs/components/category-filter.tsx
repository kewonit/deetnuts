"use client";

import * as React from "react";
import { CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  MHTCET_CATEGORY_GROUPS,
  ALL_CATEGORIES,
  CategoryGroup,
} from "../data/category-mappings";

interface CategoryFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  onFilterChange?: (values: string[]) => void;
}

export function CategoryFilter<TData, TValue>({
  column,
  title = "Category",
  onFilterChange,
}: CategoryFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const [selectedValues, setSelectedValues] = React.useState<Set<string>>(
    new Set(),
  );
  const [searchTerm, setSearchTerm] = React.useState("");

  // Initialize from column filter value
  React.useEffect(() => {
    const filterValue = column?.getFilterValue() as string[] | undefined;
    if (filterValue && Array.isArray(filterValue) && filterValue.length > 0) {
      setSelectedValues(new Set(filterValue));
    }
  }, [column]);

  // Handle selecting/deselecting categories
  const handleSelect = React.useCallback(
    (value: string) => {
      const newSelectedValues = new Set(selectedValues);

      if (newSelectedValues.has(value)) {
        newSelectedValues.delete(value);
      } else {
        newSelectedValues.add(value);
      }

      setSelectedValues(newSelectedValues);

      const valuesArray = Array.from(newSelectedValues);
      column?.setFilterValue(valuesArray);

      if (onFilterChange) {
        onFilterChange(valuesArray);
      }
    },
    [column, selectedValues, onFilterChange],
  );

  // Handle selecting/deselecting entire groups
  const handleGroupSelect = React.useCallback(
    (group: CategoryGroup) => {
      const newSelectedValues = new Set(selectedValues);
      const groupCategoriesInData = group.categories.filter(
        (cat) => facets?.has(cat), // Only include categories that exist in the data
      );

      // Check if all group categories are selected
      const allGroupSelected = groupCategoriesInData.every((cat) =>
        newSelectedValues.has(cat),
      );

      if (allGroupSelected) {
        // Deselect all group categories
        groupCategoriesInData.forEach((cat) => newSelectedValues.delete(cat));
      } else {
        // Select all group categories
        groupCategoriesInData.forEach((cat) => newSelectedValues.add(cat));
      }

      setSelectedValues(newSelectedValues);

      const valuesArray = Array.from(newSelectedValues);
      column?.setFilterValue(valuesArray);

      if (onFilterChange) {
        onFilterChange(valuesArray);
      }
    },
    [column, selectedValues, onFilterChange, facets],
  );

  // Clear all selections
  const clearAll = React.useCallback(() => {
    setSelectedValues(new Set());
    column?.setFilterValue([]);
    if (onFilterChange) {
      onFilterChange([]);
    }
  }, [column, onFilterChange]);

  // Filter categories based on search term
  const filteredCategories = React.useMemo(() => {
    if (!searchTerm) return ALL_CATEGORIES;

    return ALL_CATEGORIES.filter(
      (cat) =>
        cat.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  // Group filtered categories
  const groupedCategories = React.useMemo(() => {
    const grouped: Record<string, typeof filteredCategories> = {};

    filteredCategories.forEach((cat) => {
      if (!grouped[cat.groupId]) {
        grouped[cat.groupId] = [];
      }
      // Only include categories that exist in the data
      if (facets?.has(cat.value)) {
        grouped[cat.groupId].push(cat);
      }
    });

    return grouped;
  }, [filteredCategories, facets]);

  // Check if any filter is active
  const isFilterActive = selectedValues.size > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="neutral"
          className="h-10 border-2 border-black bg-white hover:bg-main/30 font-base"
        >
          <PlusCircledIcon className="h-4 w-4 mr-2" />
          {title}
          {isFilterActive && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4 bg-black" />
              <Badge
                variant="default"
                className="rounded-base px-2 font-base border-2 border-black lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="default"
                    className="rounded-base px-2 font-base border-2 border-black"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  Array.from(selectedValues)
                    .slice(0, 2)
                    .map((value) => (
                      <Badge
                        variant="default"
                        key={value}
                        className="rounded-base px-2 font-base border-2 border-black"
                      >
                        {value}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[350px] p-0 border-2 border-black rounded-base bg-white"
        align="start"
      >
        <Command className="border-0">
          <CommandInput
            placeholder="Search categories..."
            className="border-0 border-b-2 border-black rounded-none font-base"
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-[400px]">
            <CommandEmpty className="text-black font-base py-6 text-center">
              No categories found.
            </CommandEmpty>

            {/* Clear All Button */}
            {isFilterActive && (
              <div className="p-2 border-b-2 border-black">
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={clearAll}
                  className="w-full h-8 text-xs border border-black"
                >
                  Clear All ({selectedValues.size})
                </Button>
              </div>
            )}

            {/* Category Groups */}
            {MHTCET_CATEGORY_GROUPS.map((group) => {
              const groupCategories = groupedCategories[group.id] || [];
              if (groupCategories.length === 0) return null;

              const groupCategoriesInData = group.categories.filter((cat) =>
                facets?.has(cat),
              );
              const selectedInGroup = groupCategoriesInData.filter((cat) =>
                selectedValues.has(cat),
              ).length;
              const totalInGroup = groupCategoriesInData.length;
              const allGroupSelected =
                selectedInGroup === totalInGroup && totalInGroup > 0;
              const someGroupSelected = selectedInGroup > 0;

              return (
                <CommandGroup
                  key={group.id}
                  heading={
                    <div className="flex items-center justify-between w-full">
                      <span className="font-heading text-black">
                        {group.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black font-base">
                          {selectedInGroup}/{totalInGroup}
                        </span>
                        <Button
                          variant="neutral"
                          size="sm"
                          onClick={() => handleGroupSelect(group)}
                          className="h-5 w-5 p-0 text-xs border border-black"
                          title={
                            allGroupSelected
                              ? "Deselect all in group"
                              : "Select all in group"
                          }
                        >
                          {allGroupSelected ? "−" : "+"}
                        </Button>
                      </div>
                    </div>
                  }
                >
                  <div className="text-xs text-black/70 font-base mb-2 px-2">
                    {group.description}
                  </div>

                  {groupCategories.map((category) => {
                    const isSelected = selectedValues.has(category.value);
                    const count = facets?.get(category.value) ?? 0;

                    return (
                      <CommandItem
                        key={category.value}
                        onSelect={() => handleSelect(category.value)}
                        className="hover:bg-main/30 text-black font-base"
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-base border-2 border-black",
                            isSelected ? "bg-main text-black" : "bg-white",
                          )}
                        >
                          <CheckIcon
                            className={cn(
                              "h-3 w-3",
                              isSelected ? "visible" : "invisible",
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-base text-black">
                            {category.label}
                          </div>
                          <div className="text-xs text-black/70">
                            {category.description}
                          </div>
                        </div>
                        {count > 0 ? (
                          <Badge
                            variant="neutral"
                            className="ml-2 text-xs border border-black"
                          >
                            {count}
                          </Badge>
                        ) : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
