"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { Card } from "@/components/ui/card";

interface FilterState {
  collegeFilter: string;
  branchFilter: string[];
  categoryFilter: string[];
  allocationFilter: string[];
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination?: {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
  onPaginationChange?: (page: number, perPage: number) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  filters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  filters,
  onFiltersChange,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  // Use the provided sorting state or create a local one
  const [localSorting, setLocalSorting] = React.useState<SortingState>([]);
  const effectiveSorting = sorting || localSorting;

  // Default to hiding the ID column for cleaner UI
  React.useEffect(() => {
    setColumnVisibility((prev) => ({
      ...prev,
      ID: false,
    }));
  }, []);

  // Local filter state for when server-side filtering is not used
  const [localCollegeFilter, setLocalCollegeFilter] = React.useState("");
  const [localBranchFilter, setLocalBranchFilter] = React.useState<string[]>(
    [],
  );
  const [localCategoryFilter, setLocalCategoryFilter] = React.useState<
    string[]
  >([]);
  const [localAllocationFilter, setLocalAllocationFilter] = React.useState<
    string[]
  >([]);

  // Handle column filter changes
  const handleColumnFilterChange = (
    updaterOrValue:
      | ColumnFiltersState
      | ((old: ColumnFiltersState) => ColumnFiltersState),
  ) => {
    // Apply the updater to get the new filters
    const newFilters =
      typeof updaterOrValue === "function"
        ? updaterOrValue(columnFilters)
        : updaterOrValue;

    // Update our local state
    setColumnFilters(newFilters);

    // If we have server-side filtering and a callback
    if (onFiltersChange) {
      // Extract the college filter
      const collegeFilterValue =
        (newFilters.find((f) => f.id === "College")?.value as string) || "";

      // Handle the filter updates
      onFiltersChange({
        collegeFilter: collegeFilterValue,
        branchFilter: localBranchFilter,
        categoryFilter: localCategoryFilter,
        allocationFilter: localAllocationFilter,
      });
    }
  };

  // Flag to track if this is a filter-triggered update
  const isFilterUpdate = React.useRef(false);

  // Handle faceted filter changes with better state persistence
  const handleFacetedFilterChange = (
    filterType:
      | "collegeFilter"
      | "branchFilter"
      | "categoryFilter"
      | "allocationFilter",
    value: string[],
  ) => {
    // Set flag to indicate this is a filter update
    isFilterUpdate.current = true;

    // Update our local filter state
    switch (filterType) {
      case "branchFilter":
        setLocalBranchFilter(value);
        break;
      case "categoryFilter":
        setLocalCategoryFilter(value);
        break;
      case "allocationFilter":
        setLocalAllocationFilter(value);
        break;
      case "collegeFilter":
        // College filter is handled separately through text input
        break;
    }

    // If we have server-side filtering and a callback
    if (onFiltersChange) {
      // Get the current college filter from column filters
      const collegeFilterValue =
        (columnFilters.find((f) => f.id === "College")?.value as string) || "";

      // Create the updated filter state with all current filters
      const updatedFilters = {
        collegeFilter: collegeFilterValue,
        branchFilter: filterType === "branchFilter" ? value : localBranchFilter,
        categoryFilter:
          filterType === "categoryFilter" ? value : localCategoryFilter,
        allocationFilter:
          filterType === "allocationFilter" ? value : localAllocationFilter,
      };

      // Send all filter values to parent component for server-side filtering
      onFiltersChange(updatedFilters);
    }

    // Clear flag after a short delay to ensure effects have processed
    setTimeout(() => {
      isFilterUpdate.current = false;
    }, 0);
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: effectiveSorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      ...(pagination
        ? {
            pagination: {
              pageIndex: pagination.page - 1,
              pageSize: pagination.perPage,
            },
          }
        : {}),
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const newSorting =
        updater instanceof Function ? updater(effectiveSorting) : updater;

      // Update local state
      setLocalSorting(newSorting);

      // If we have server-side sorting and a callback, call it
      if (onSortingChange) {
        onSortingChange(newSorting);
      }
    },
    onColumnFiltersChange: handleColumnFilterChange,
    onColumnVisibilityChange: setColumnVisibility,

    // If we're using external pagination, enable manual pagination
    ...(pagination
      ? {
          manualPagination: true,
          pageCount: pagination.totalPages,
        }
      : {}),

    // If we're using external sorting, enable manual sorting
    ...(onSortingChange
      ? {
          manualSorting: true,
        }
      : {}),

    // If we're using external filtering, enable manual filtering
    ...(onFiltersChange
      ? {
          manualFiltering: true,
        }
      : {}),

    // Handle pagination changes if we have a callback
    onPaginationChange:
      pagination && onPaginationChange
        ? (updater) => {
            const state =
              updater instanceof Function
                ? updater({
                    pageIndex: pagination.page - 1,
                    pageSize: pagination.perPage,
                  })
                : updater;
            onPaginationChange(state.pageIndex + 1, state.pageSize);
          }
        : undefined,

    // Table feature functions
    getCoreRowModel: getCoreRowModel(),

    // Only filter locally if we're not doing server-side filtering
    ...(onFiltersChange ? {} : { getFilteredRowModel: getFilteredRowModel() }),

    // Only paginate locally if we're not doing server-side pagination
    ...(pagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),

    // Only sort locally if we're not doing server-side sorting
    ...(onSortingChange ? {} : { getSortedRowModel: getSortedRowModel() }),

    // Always get faceted data for the UI
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),

    // Initial state
    initialState: {
      pagination: {
        pageSize: pagination?.perPage || 25,
      },
    },
  });

  // Create a ref to prevent the initial effect from resetting filters
  const isInitialRender = React.useRef(true);

  // Merge local and external filters with improved logic
  React.useEffect(() => {
    // Skip the effect on initial render to prevent filter reset
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (filters) {
      // For branch filter
      if (
        Array.isArray(filters.branchFilter) &&
        filters.branchFilter.length > 0
      ) {
        const branchColumn = table.getColumn("course_name");
        if (branchColumn) {
          branchColumn.setFilterValue(filters.branchFilter);
          setLocalBranchFilter(filters.branchFilter);
        }
      }

      // For category filter
      if (
        Array.isArray(filters.categoryFilter) &&
        filters.categoryFilter.length > 0
      ) {
        const categoryColumn = table.getColumn("category");
        if (categoryColumn) {
          categoryColumn.setFilterValue(filters.categoryFilter);
          setLocalCategoryFilter(filters.categoryFilter);
        }
      }

      // For college filter
      if (filters.collegeFilter) {
        const collegeColumn = table.getColumn("college_name");
        if (collegeColumn) {
          collegeColumn.setFilterValue(filters.collegeFilter);
        }
      }
    }
  }, [filters, table]);

  return (
    <div className="space-y-6">
      <DataTableToolbar
        table={table}
        onFilterChange={handleFacetedFilterChange}
      />
      <div className="bg-white border-2 border-black rounded-base overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b-2 border-black bg-main"
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className="text-black font-heading bg-main border-b-2 border-black"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`border-b border-black hover:bg-main/30 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-4 px-4 text-black font-base"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-black"
                  >
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-main border-2 border-black rounded-base flex items-center justify-center">
                        <span className="text-2xl">🔍</span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-lg font-heading">
                          No results found
                        </div>
                        <div className="text-sm font-base">
                          Try adjusting your filters or search criteria
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="bg-white border-2 border-black rounded-base p-4 shadow-base">
          <DataTablePagination
            table={table}
            totalItems={pagination?.totalItems}
          />
        </div>
      )}
    </div>
  );
}
