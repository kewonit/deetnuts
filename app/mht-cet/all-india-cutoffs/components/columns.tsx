"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

import { labels, priorities, statuses } from "../data/data"
import { Task } from "../data/schema"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

export const columns: ColumnDef<Task>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "All India Merit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="All India Merit" />
    ),
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("All India Merit")}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "Percentile",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Percentile" />
    ),
    cell: ({ row }) => {
      const instituteCode = row.original["Institute Code"];
      return (
        <div className="flex space-x-2">
          {instituteCode && <Badge variant="neutral">{instituteCode}</Badge>}
          <span className="max-w-[100px] truncate font-medium">
            {row.getValue("Percentile")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "Institute Name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Institute Name" />
    ),
    cell: ({ row }) => {
      const instituteName: string = row.getValue("Institute Name");
      return (
        <div className="flex w-[300px] items-center">
          <span className="w-[300px] truncate">{instituteName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "Course Name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Course Name" />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue("Course Name")
      )

      if (!status) {
        return <p>-</p>
      }

      return (
        <div className="flex w-[300px] items-center">
          {status.icon && (
            <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <span>{status.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "Exam(JEE/MHT-CET)",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Exam(JEE/MHT-CET)" />
    ),
    cell: ({ row }) => {
      const type = row.original["Type"];
      const priority = priorities.find(
        (priority) => priority.value === row.getValue("Exam(JEE/MHT-CET)")
      )

      if (!priority) {
        return null
      }

      return (
        <div className="flex items-center">
          {priority.icon && (
            <priority.icon className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <span>{priority.label}</span>
          <span className="pl-2">{type && <Badge variant="neutral">{type}</Badge>}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
]

{/*  
{
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
*/}