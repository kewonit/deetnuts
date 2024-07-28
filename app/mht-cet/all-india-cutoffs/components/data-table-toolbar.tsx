"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/app/mht-cet/all-india-cutoffs/components/data-table-view-options"

import { priorities, statuses } from "../data/data"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
     <div className="block flex-1 items-center pb-6 sm:pb-0  sm:space-x-2 sm:flex sm:flex-1 space-y-6 sm:space-y-0">
        <Input
          placeholder="Search Colleges..."
          value={(table.getColumn("Institute Name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("Institute Name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-full lg:w-[250px]"
        />
        {table.getColumn("Course Name") && (
          <DataTableFacetedFilter
            column={table.getColumn("Course Name")}
            title="Course Name"
            options={statuses}
          />
        )}
        {table.getColumn("Exam(JEE/MHT-CET)") && (
          <DataTableFacetedFilter
            column={table.getColumn("Exam(JEE/MHT-CET)")}
            title="JEE / MHT-CET"
            options={priorities}
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
