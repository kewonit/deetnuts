"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/app/mht-cet/all-india-cutoffs/components/data-table-view-options"

import { branch, status, categories, allocation, cities } from "@/app/mht-cet/all-state-cutoffs/data/data"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

function getAvailableOptions<TData>(
  table: Table<TData>,
  columnId: string,
  options: { label: string; value: string }[]
): { label: string; value: string }[] {
  const column = table.getColumn(columnId);
  if (!column) return [];

  const availableValues = new Set<string>();
  table.getFilteredRowModel().rows.forEach((row) => {
    const value = row.getValue(columnId) as string;
    if (value) availableValues.add(value);
  });

  return options.filter(option => availableValues.has(option.value));
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  const availableBranches = getAvailableOptions(table, "Branch", branch);
  const availableCategories = getAvailableOptions(table, "Category", categories);
  const availableCities = getAvailableOptions(table, "City", cities);
  const availableStatuses = getAvailableOptions(table, "Status", status);
  const availableAllocations = getAvailableOptions(table, "Allocation", allocation);

  return (
    <div className="flex items-center justify-between">
      <div className="block flex-1 items-center pb-6 sm:pb-0  sm:space-x-2 sm:flex sm:flex-1 space-y-6 sm:space-y-0">
        <Input
          placeholder="Search Colleges..."
          value={(table.getColumn("College")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("College")?.setFilterValue(event.target.value)
          }
          className="h-8 w-full lg:w-[250px]"
        />
        {table.getColumn("Branch") && availableBranches.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn("Branch")}
            title="Branch"
            options={availableBranches}
          />
        )}
        {table.getColumn("Category") && availableCategories.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn("Category")}
            title="Category"
            options={availableCategories}
          />
        )}
        {table.getColumn("City") && availableCities.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn("City")}
            title="City"
            options={availableCities}
          />
        )}
        {table.getColumn("Status") && availableStatuses.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn("Status")}
            title="Status"
            options={availableStatuses}
          />
        )}
        {table.getColumn("Allocation") && availableAllocations.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn("Allocation")}
            title="Allocation"
            options={availableAllocations}
          />
        )}
        {isFiltered && (
          <Button
            variant="default"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}