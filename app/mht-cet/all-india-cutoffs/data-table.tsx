"use client";

import { useMemo, useState, useEffect } from 'react';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    ColumnSort,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { CutoffRecord, PaginationInfo } from './types';

interface DataTableProps {
    data: CutoffRecord[];
    pagination: PaginationInfo;
    loading: boolean;
    onPageChange: (page: number) => void;
    onSortChange: (sorting: SortingState) => void;
    onFiltersChange: (filters: ColumnFiltersState) => void;
}

export function DataTable({
    data,
    pagination,
    loading,
    onPageChange,
    onSortChange,
    onFiltersChange,
}: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([{ id: 'rank', desc: true }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    // Reset table state when data changes significantly
    useEffect(() => {
        if (!loading && data.length === 0) {
            setSorting([]);
            setColumnFilters([]);
        }
    }, [loading, data.length]);

    const columns: ColumnDef<CutoffRecord>[] = useMemo(
        () => [
            {
                accessorKey: 'sr_no',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="noShadow"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-auto p-0 font-bold hover:text-blue-600"
                        >
                            Sr. No.
                            {column.getIsSorted() === "asc" ? (
                                <ArrowUp className="ml-2 h-4 w-4" />
                            ) : column.getIsSorted() === "desc" ? (
                                <ArrowDown className="ml-2 h-4 w-4" />
                            ) : (
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <div className="w-16 text-center font-mono text-sm font-medium">
                        {row.getValue('sr_no')}
                    </div>
                ),
            },
            {
                accessorKey: 'rank',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="noShadow"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-auto p-0 font-bold hover:text-blue-600"
                        >
                            Rank
                            {column.getIsSorted() === "asc" ? (
                                <ArrowUp className="ml-2 h-4 w-4" />
                            ) : column.getIsSorted() === "desc" ? (
                                <ArrowDown className="ml-2 h-4 w-4" />
                            ) : (
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <div className="w-20 text-center">
                        <span className="inline-block px-2 py-1 bg-blue-100 border-2 border-blue-300 rounded-base font-mono font-bold text-blue-800">
                            {row.getValue('rank')}
                        </span>
                    </div>
                ),
                sortingFn: 'basic',
            },
            {
                accessorKey: 'percentile',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="noShadow"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-auto p-0 font-bold hover:text-blue-600"
                        >
                            Percentile
                            {column.getIsSorted() === "asc" ? (
                                <ArrowUp className="ml-2 h-4 w-4" />
                            ) : column.getIsSorted() === "desc" ? (
                                <ArrowDown className="ml-2 h-4 w-4" />
                            ) : (
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <div className="w-24 text-center">
                        <span className="inline-block px-2 py-1 bg-green-100 border-2 border-green-300 rounded-base font-mono font-bold text-green-800">
                            {row.getValue('percentile')}
                        </span>
                    </div>
                ),
                sortingFn: 'alphanumeric',
            },
            {
                accessorKey: 'college_name',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="noShadow"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-auto p-0 font-bold hover:text-blue-600"
                        >
                            College Name
                            {column.getIsSorted() === "asc" ? (
                                <ArrowUp className="ml-2 h-4 w-4" />
                            ) : column.getIsSorted() === "desc" ? (
                                <ArrowDown className="ml-2 h-4 w-4" />
                            ) : (
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <div className="min-w-0 max-w-xs lg:max-w-sm">
                        <div className="font-semibold text-sm text-gray-900 line-clamp-2 break-words">
                            {row.getValue('college_name')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Code: {row.original.college_code}
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: 'course_name',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="noShadow"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-auto p-0 font-bold hover:text-blue-600"
                        >
                            Course Name
                            {column.getIsSorted() === "asc" ? (
                                <ArrowUp className="ml-2 h-4 w-4" />
                            ) : column.getIsSorted() === "desc" ? (
                                <ArrowDown className="ml-2 h-4 w-4" />
                            ) : (
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                        </Button>
                    )
                },
                cell: ({ row }) => (
                    <div className="min-w-0 max-w-sm lg:max-w-md">
                        <div className="font-medium text-sm text-gray-900 line-clamp-2 break-words">
                            {row.getValue('course_name')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Code: {row.original.course_code}
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: 'institute_code',
                header: 'Institute Code',
                cell: ({ row }) => (
                    <div className="w-32 text-center">
                        <span className="inline-block px-2 py-1 bg-purple-100 border-2 border-purple-300 rounded-base font-mono text-sm">
                            {row.getValue('institute_code')}
                        </span>
                    </div>
                ),
                enableSorting: false,
            },
            {
                accessorKey: 'choice_code',
                header: 'Choice Code',
                cell: ({ row }) => (
                    <div className="w-28 text-center">
                        <span className="inline-block px-2 py-1 bg-gray-100 border-2 border-gray-300 rounded-base font-mono text-sm">
                            {row.getValue('choice_code')}
                        </span>
                    </div>
                ),
                enableSorting: false,
            },
        ],
        []
    );

    const table = useReactTable({
        data,
        columns,
        onSortingChange: (updater) => {
            const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
            setSorting(newSorting);
            onSortChange(newSorting);
        },
        onColumnFiltersChange: (updater) => {
            const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
            setColumnFilters(newFilters);
            onFiltersChange(newFilters);
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        pageCount: pagination.totalPages,
    });

    return (
        <div className="w-full space-y-4">
            {/* Table controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="text-sm text-gray-600 font-medium">
                    Showing {((pagination.page - 1) * pagination.perPage) + 1} to{' '}
                    {Math.min(pagination.page * pagination.perPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems.toLocaleString()} results
                </div>
            </div>

            {/* Table */}
            <div className="rounded-base border-2 border-black bg-white shadow-base overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="w-full min-w-[800px]">
                        <TableHeader className="bg-[#E4DFF2] border-b-2 border-black">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="hover:bg-[#E4DFF2]/80">
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id} className="text-center font-bold text-black border-r border-black last:border-r-0 py-3 px-2 sm:px-4">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 10 }).map((_, index) => (
                                    <TableRow key={`loading-${index}`} className="border-b border-gray-200">
                                        {columns.map((_, colIndex) => (
                                            <TableCell key={`loading-${index}-${colIndex}`} className="h-12 border-r border-gray-200 last:border-r-0">
                                                <div className="animate-pulse bg-gray-200 rounded h-4 w-full"></div>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row, index) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && 'selected'}
                                        className={`hover:bg-[#E4DFF2]/30 border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                            }`}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="text-center border-r border-gray-200 last:border-r-0 py-3 px-2 sm:px-4">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center border-r border-gray-200 last:border-r-0"
                                    >
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="text-gray-500 text-lg">No results found</div>
                                            <div className="text-gray-400 text-sm">Try adjusting your filters or search terms</div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 px-4 border-t-2 border-black bg-white">
                <div className="text-sm text-gray-600 font-medium">
                    Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="neutral"
                        size="sm"
                        onClick={() => onPageChange(1)}
                        disabled={pagination.page === 1}
                        className="shadow-base border-2 border-black hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="neutral"
                        size="sm"
                        onClick={() => onPageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="shadow-base border-2 border-black hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Current page info */}
                    <div className="flex items-center space-x-2 px-3 py-1 border-2 border-black rounded-base bg-white shadow-base">
                        <span className="text-sm font-medium">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                    </div>

                    <Button
                        variant="neutral"
                        size="sm"
                        onClick={() => onPageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="shadow-base border-2 border-black hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="neutral"
                        size="sm"
                        onClick={() => onPageChange(pagination.totalPages)}
                        disabled={pagination.page === pagination.totalPages}
                        className="shadow-base border-2 border-black hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
