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
import { Input } from "@/components/ui/input";

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options?: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  onFilterChange?: (values: string[]) => void;
  onRangeFilterChange?: (range: [number, number]) => void;
  isRangeFilter?: boolean;
  minValue?: number;
  maxValue?: number;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options = [],
  onFilterChange,
  onRangeFilterChange,
  isRangeFilter = false,
  minValue = 0,
  maxValue = 100,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  // Store the selected values in state to prevent them from being reset
  const [persistedValues, setPersistedValues] = React.useState<Set<string>>(
    new Set(),
  );

  // Initialize from column filter value
  React.useEffect(() => {
    const filterValue = column?.getFilterValue() as string[] | undefined;
    if (filterValue && Array.isArray(filterValue) && filterValue.length > 0) {
      setPersistedValues(new Set(filterValue));
    }
  }, [column]);

  // Use persisted values instead of direct column value to ensure filter persistence
  const selectedValues = persistedValues;

  // For range filter
  const [rangeMin, setRangeMin] = React.useState<number | undefined>(undefined);
  const [rangeMax, setRangeMax] = React.useState<number | undefined>(undefined);
  const [debouncedRange, setDebouncedRange] = React.useState<
    [number, number] | undefined
  >(undefined);

  // Function to handle selecting an option for categorical filters
  const handleSelect = React.useCallback(
    (value: string) => {
      if (!column) return;

      // Create a new set from the current selectedValues
      const newSelectedValues = new Set(selectedValues);

      // Toggle the selected value
      if (newSelectedValues.has(value)) {
        newSelectedValues.delete(value);
      } else {
        newSelectedValues.add(value);
      }

      // Update our persisted state
      setPersistedValues(newSelectedValues);

      // Convert to array for the column filter and API
      const valuesArray = Array.from(newSelectedValues);

      // First update the local column filter
      column.setFilterValue(valuesArray);

      // Then trigger the server-side filter update
      if (onFilterChange) {
        onFilterChange(valuesArray);
      }
    },
    [column, selectedValues, onFilterChange, setPersistedValues],
  );

  // Debounce the range filter changes
  React.useEffect(() => {
    if (isRangeFilter && (rangeMin !== undefined || rangeMax !== undefined)) {
      const min = rangeMin !== undefined ? rangeMin : minValue;
      const max = rangeMax !== undefined ? rangeMax : maxValue;

      const handler = setTimeout(() => {
        setDebouncedRange([min, max]);
        // Apply the filter
        column?.setFilterValue([min, max]);

        // Trigger the server-side filter update if callback is provided
        if (onRangeFilterChange) {
          onRangeFilterChange([min, max]);
        }
      }, 500);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [
    rangeMin,
    rangeMax,
    isRangeFilter,
    column,
    minValue,
    maxValue,
    onRangeFilterChange,
  ]);

  // Get current range filter values
  React.useEffect(() => {
    if (isRangeFilter && column?.getFilterValue()) {
      const [min, max] = column?.getFilterValue() as [number, number];
      if (min !== undefined && min !== minValue) {
        setRangeMin(min);
      }
      if (max !== undefined && max !== maxValue) {
        setRangeMax(max);
      }
    }
  }, [column, isRangeFilter, minValue, maxValue]);

  // Handle range input changes
  const handleRangeMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : Number(e.target.value);
    setRangeMin(value);
  };

  const handleRangeMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : Number(e.target.value);
    setRangeMax(value);
  };

  // Reset range filter
  const resetRangeFilter = () => {
    setRangeMin(undefined);
    setRangeMax(undefined);
    column?.setFilterValue(undefined);
    if (onRangeFilterChange) {
      onRangeFilterChange([minValue, maxValue]);
    }
  };

  // Calculate if the filter is active
  const isRangeFilterActive =
    isRangeFilter &&
    ((rangeMin !== undefined && rangeMin > minValue) ||
      (rangeMax !== undefined && rangeMax < maxValue));

  const isCategoricalFilterActive = !isRangeFilter && selectedValues?.size > 0;

  const isFilterActive = isRangeFilterActive || isCategoricalFilterActive;

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
              {isRangeFilterActive ? (
                <Badge
                  variant="default"
                  className="rounded-base px-2 font-base border-2 border-black"
                >
                  {rangeMin !== undefined ? rangeMin : minValue}
                  {" - "}
                  {rangeMax !== undefined ? rangeMax : maxValue}
                </Badge>
              ) : (
                <>
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
                      options
                        .filter((option) => selectedValues.has(option.value))
                        .map((option) => (
                          <Badge
                            variant="default"
                            key={option.value}
                            className="rounded-base px-2 font-base border-2 border-black"
                          >
                            {option.label}
                          </Badge>
                        ))
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-0 border-2 border-black rounded-base bg-white"
        align="start"
      >
        {isRangeFilter ? (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-heading text-black">Min {title}</span>
                {isRangeFilterActive && (
                  <Button
                    variant="neutral"
                    size="sm"
                    className="h-auto p-1 text-xs border border-black"
                    onClick={resetRangeFilter}
                  >
                    Reset
                  </Button>
                )}
              </div>
              <Input
                type="number"
                placeholder={`Min (${minValue})`}
                value={rangeMin ?? ""}
                onChange={handleRangeMinChange}
                className="h-8 border-2 border-black rounded-base"
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-heading text-black">Max {title}</span>
              </div>
              <Input
                type="number"
                placeholder={`Max (${maxValue})`}
                value={rangeMax ?? ""}
                onChange={handleRangeMaxChange}
                className="h-8 border-2 border-black rounded-base"
              />
            </div>
            <div className="text-xs text-black font-base">
              {isRangeFilterActive
                ? `Filtering: ${rangeMin ?? minValue} - ${rangeMax ?? maxValue}`
                : `Full range: ${minValue} - ${maxValue}`}
            </div>
          </div>
        ) : (
          <Command className="border-0">
            <CommandInput
              placeholder={title}
              className="border-0 border-b-2 border-black rounded-none font-base"
            />
            <CommandList>
              <CommandEmpty className="text-black font-base">
                No results found.
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedValues.has(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
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
                      <span>{option.label}</span>
                      {facets?.get(option.value) && (
                        <span className="ml-auto flex h-4 w-4 items-center justify-center font-base text-xs bg-main border border-black rounded-base">
                          {facets.get(option.value)}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
