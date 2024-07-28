"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { statuses } from "../data/data"
import { Task } from "../data/schema"
import { DataTableColumnHeader } from "./data-table-column-header"


export const columns: ColumnDef<Task>[] = [
  {
    id: "Serial_just_for_database",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px] mr-[6px]"
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
    accessorKey: "Program",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Program" />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue("Program")
      )

      if (!status) {
        return <p>-</p>
      }

      return (
        <div className="flex w-[300px] items-center">
          <span>{status.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "Pilani",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pilani" />
    ),
    cell: ({ row }) => {
      const instituteName: string = row.getValue("Pilani");
      return (
        <div className="flex w-[100px] items-center">
          <span className="w-[100px] truncate">{instituteName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "Goa",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Goa" />
    ),
    cell: ({ row }) => {
      const instituteName: string = row.getValue("Goa");
      return (
        <div className="flex w-[100px] items-center">
          <span className="w-[100px] truncate">{instituteName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "Hyderabad",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Hyderabad" />
    ),
    cell: ({ row }) => {
      const instituteName: string = row.getValue("Hyderabad");
      return (
        <div className="flex w-[100px] items-center">
          <span className="w-[100px] truncate">{instituteName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "OutOff",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="OutOff" />
    ),
    cell: ({ row }) => {
      const instituteName: string = row.getValue("OutOff");
      return (
        <div className="flex w-[100px] items-center">
          <span className="w-[100px] truncate">{instituteName}</span>
        </div>
      );
    },
  },
]

{/*  
{
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
*/}