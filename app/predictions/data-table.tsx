"use client";

import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PredictionRecord, SEAT_TYPE_LABELS, QUOTA_LABELS } from "./types";

interface PredictionsTableProps {
  data: PredictionRecord[];
  loading: boolean;
  sorting: SortingState;
  setSorting: (sorting: SortingState) => void;
}

export function PredictionsTable({
  data,
  loading,
  sorting,
  setSorting,
}: PredictionsTableProps) {
  const columns = useMemo<ColumnDef<PredictionRecord>[]>(
    () => [
      {
        accessorKey: "institute",
        header: ({ column }) => (
          <Button
            variant="noShadow"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-heading"
          >
            Institute
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="max-w-[300px] truncate font-abel text-sm cursor-help">
                  {row.getValue("institute")}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-abel">{row.getValue("institute")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        size: 300,
      },
      {
        accessorKey: "branch",
        header: ({ column }) => (
          <Button
            variant="noShadow"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-heading"
          >
            Branch
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-abel font-medium text-sm">
            {row.getValue("branch")}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: "seat_type",
        header: "Seat Type",
        cell: ({ row }) => {
          const seatType = row.getValue("seat_type") as string;
          return (
            <Badge variant="neutral" className="font-abel text-xs">
              {SEAT_TYPE_LABELS[seatType] || seatType}
            </Badge>
          );
        },
        size: 120,
      },
      {
        accessorKey: "quota",
        header: "Quota",
        cell: ({ row }) => {
          const quota = row.getValue("quota") as string;
          return (
            <Badge variant="default" className="font-abel text-xs">
              {QUOTA_LABELS[quota] || quota}
            </Badge>
          );
        },
        size: 100,
      },
      {
        accessorKey: "predicted_cutoff_2026",
        header: ({ column }) => (
          <Button
            variant="noShadow"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-heading"
          >
            Predicted Rank 2026
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const cutoff = row.getValue("predicted_cutoff_2026") as number;
          return (
            <div className="text-right font-abel font-bold text-base">
              {cutoff === 1 ? "N/A" : cutoff.toLocaleString()}
            </div>
          );
        },
        size: 150,
      },
      {
        accessorKey: "change_from_2025",
        header: ({ column }) => (
          <Button
            variant="noShadow"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-heading"
          >
            Change from 2025
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const change = row.getValue("change_from_2025") as number;
          const isPositive = change > 0;
          const isNegative = change < 0;
          const isNeutral = change === 0;

          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-end gap-2 cursor-help">
                    {isPositive && (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    )}
                    {isNegative && (
                      <TrendingDown className="h-4 w-4 text-emerald-700" />
                    )}
                    {isNeutral && <Minus className="h-4 w-4 text-gray-500" />}
                    <span
                      className={`font-abel font-medium ${
                        isPositive
                          ? "text-red-600"
                          : isNegative
                            ? "text-emerald-700"
                            : "text-gray-500"
                      }`}
                    >
                      {isPositive && "+"}
                      {change.toLocaleString()}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-abel text-sm">
                    {isPositive && "Cutoff rank increased (easier to get in)"}
                    {isNegative && "Cutoff rank decreased (harder to get in)"}
                    {isNeutral && "No change from 2025"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
        size: 180,
      },
      {
        accessorKey: "pct_change_from_2025",
        header: ({ column }) => (
          <Button
            variant="noShadow"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-heading"
          >
            % Change
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const pctChange = row.getValue("pct_change_from_2025") as number;
          const isPositive = pctChange > 0;
          const isNegative = pctChange < 0;
          const isNeutral = pctChange === 0;

          return (
            <div
              className={`text-right font-abel font-medium ${
                isPositive
                  ? "text-red-600"
                  : isNegative
                    ? "text-emerald-700"
                    : "text-gray-500"
              }`}
            >
              {isPositive && "+"}
              {pctChange.toFixed(2)}%
            </div>
          );
        },
        size: 120,
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updaterOrValue) => {
      if (typeof updaterOrValue === "function") {
        setSorting(updaterOrValue(sorting));
      } else {
        setSorting(updaterOrValue);
      }
    },
    state: {
      sorting,
    },
    enableSortingRemoval: false,
  });

  if (loading) {
    return (
      <div className="rounded-lg border-2 border-black bg-white p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border-2 border-black bg-white p-12 text-center">
        <p className="text-lg font-heading text-gray-600">
          No predictions found matching your filters.
        </p>
        <p className="mt-2 text-sm font-inter text-gray-500">
          Try adjusting your search criteria or clearing some filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-black bg-white overflow-hidden shadow-base">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b-2 border-black"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="bg-main font-heading text-black"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
