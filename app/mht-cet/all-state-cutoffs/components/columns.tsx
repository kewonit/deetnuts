"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

import { branch, status, categories, allocation, cities } from "../data/data"
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
    accessorKey: "College",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="College" />
    ),
    cell: ({ row }) => {
      const instituteName: string = row.getValue("College");
      return (
        <div className="flex w-[300px] items-center ml-2">
          <span className="w-[300px] ">{instituteName}</span>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "Branch",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Branch" />
    ),
    cell: ({ row }) => {
      const status = branch.find(
        (status) => status.value === row.getValue("Branch")
      )

      if (!status) {
        return <p>-</p>
      }
      return (
        <div className="flex items-center w-[250px]">
          {status.icon && (
            <status.icon className="mr-2 flex-none h-4 w-4 text-muted-foreground" />
          )}
          <span className="flex-grow">{status.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "Category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => {
      const statuss = categories.find(
        (statuss) => statuss.value === row.getValue("Category")
      )

      if (!statuss) {
        return <p>-</p>
      }

      return (
        <div className="flex w-[125px] items-center">
          <span>{statuss.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "Percentile",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Percentile" />
    ),
    cell: ({ row }) => {
      const instituteCode = row.original["Cutoff"];
      return (
        <div className="flex space-x-2">
          {instituteCode && <Badge variant="neutral">{instituteCode}</Badge>}
          <span className="max-w-[300px] truncate font-medium">
            {row.getValue("Percentile")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "City",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="City" />
    ),
    cell: ({ row }) => {
      const Citi = cities.find(
        (Citi) => Citi.value === row.getValue("City")
      )

      if (!Citi) {
        return <p>-</p>
      }

      return (
        <div className="flex w-[100px] items-center">
          <span>{Citi.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "Status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const statuss = status.find(
        (statuss) => statuss.value === row.getValue("Status")
      )

      if (!statuss) {
        return <p>-</p>
      }

      return (
        <div className="flex w-[250px] items-center">
          <span>{statuss.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "Allocation",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Allocation" />
    ),
    cell: ({ row }) => {
      const allocate = allocation.find(
        (allocate) => allocate.value === row.getValue("Allocation")
      )

      if (!allocate) {
        return <p>-</p>
      }

      return (
        <div className="flex w-[450px] items-center">
          <span>{allocate.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "Branch_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Branch_id" />
    ),
    cell: ({ row }) => {
      const Branchh_id: string = row.getValue("Branch_id");
      return (
        <div className="flex w-[100px] items-left ml-2">
          {Branchh_id && <Badge variant="neutral">{Branchh_id}</Badge>}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
]

{/*  
{
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
*/}