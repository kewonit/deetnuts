"use client";

import { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalItems?: number;
}

export function DataTablePagination<TData>({
  table,
  totalItems,
}: DataTablePaginationProps<TData>) {
  // Use either provided totalItems or count from the table
  const total = totalItems || table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;

  // Calculate displayed items range
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
      <div className="flex-1 text-sm text-black font-base">
        {total > 0 ? (
          <p>
            📊 Showing <strong>{start}</strong> to <strong>{end}</strong> of{" "}
            <strong>{total.toLocaleString()}</strong> results
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <>
                {" "}
                (
                <strong>
                  {table.getFilteredSelectedRowModel().rows.length}
                </strong>{" "}
                selected)
              </>
            )}
          </p>
        ) : (
          <p>❌ No results</p>
        )}
      </div>

      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-heading text-black">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-10 w-[70px] border-2 border-black rounded-base bg-white font-base">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent
              side="top"
              className="border-2 border-black rounded-base bg-white"
            >
              {[10, 25, 50, 100].map((size) => (
                <SelectItem
                  key={size}
                  value={`${size}`}
                  className="font-base hover:bg-main/30"
                >
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center text-sm font-base text-black">
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="neutral"
              className="h-10 w-10 p-0 hover:bg-main/30"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="neutral"
              className="h-10 w-10 p-0 hover:bg-main/30"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="mx-2 md:mx-4 bg-main border-2 border-black rounded-base px-3 py-1">
              Page <strong>{pageIndex + 1}</strong> of{" "}
              <strong>{table.getPageCount() || 1}</strong>
            </span>

            <Button
              variant="neutral"
              className="h-10 w-10 p-0 hover:bg-main/30"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="neutral"
              className="h-10 w-10 p-0 hover:bg-main/30"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
