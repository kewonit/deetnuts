'use client';

import { useMemo, useCallback } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, SortingState, ColumnFiltersState, VisibilityState } from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CutoffRecord, FilterState } from '../types';
import { calculatePercentileDistance } from '../utils';
import { ITEMS_PER_PAGE_OPTIONS, getDisplayNameForRound } from '../constants';
import { toast } from 'sonner';

// Table skeleton component for pagination loading
function TableSkeleton({ itemsPerPage }: { itemsPerPage: number }) {
    return (
        <>
            {Array.from({ length: itemsPerPage }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} className="h-12 md:h-14">
                    <TableCell className="py-2 h-12 md:h-14 text-xs md:text-sm px-2 md:px-4">
                        <Skeleton className="h-4 w-full max-w-[200px] sm:max-w-[300px]" />
                    </TableCell>
                    <TableCell className="py-2 h-12 md:h-14 text-xs md:text-sm px-2 md:px-4">
                        <Skeleton className="h-4 w-full max-w-[180px] sm:max-w-[250px]" />
                    </TableCell>
                    <TableCell className="py-2 h-12 md:h-14 text-xs md:text-sm px-2 md:px-4">
                        <Skeleton className="h-6 w-12 rounded-full" />
                    </TableCell>
                    <TableCell className="py-2 h-12 md:h-14 text-xs md:text-sm px-2 md:px-4">
                        <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="py-2 h-12 md:h-14 text-xs md:text-sm px-2 md:px-4">
                        <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="py-2 h-12 md:h-14 text-xs md:text-sm px-2 md:px-4">
                        <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="py-2 h-12 md:h-14 text-xs md:text-sm px-2 md:px-4">
                        <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="py-2 h-12 md:h-14 text-xs md:text-sm px-2 md:px-4">
                        <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="py-2 h-12 md:h-14 text-xs md:text-sm px-2 md:px-4">
                        <Skeleton className="h-4 w-16" />
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

interface CutoffTableProps {
    records: CutoffRecord[];
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    loading: boolean;
    paginationLoading: boolean;
    filters: FilterState;
    setCurrentPage: (page: number) => void;
    setItemsPerPage: (perPage: number) => void;
    sorting: SortingState;
    setSorting: (sorting: SortingState) => void;
    columnFilters: ColumnFiltersState;
    setColumnFilters: (filters: ColumnFiltersState) => void;
    columnVisibility: VisibilityState;
    setColumnVisibility: (visibility: VisibilityState) => void;
}

export function CutoffTable({
    records,
    totalItems,
    currentPage,
    itemsPerPage,
    loading,
    paginationLoading,
    filters,
    setCurrentPage,
    setItemsPerPage,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
}: CutoffTableProps) {

    // CSV Export function - exports only currently displayed data
    const exportToCSV = useCallback(() => {
        if (records.length === 0) {
            toast.error('No data to export');
            return;
        }

        try {
            // Define CSV headers
            const headers = [
                'College Name',
                'Course Name',
                'Category',
                'Cutoff Score',
                'Cutoff Percentile',
                'Last Rank',
                'College Code',
                'Course Code',
                'Status',
                'Home University'
            ];
            console.log(records);
            // Convert records to CSV rows
            const csvRows = records.map(record => [
                `"${record.college_name || ''}"`,
                `"${record.course_name || ''}"`,
                `"${record.category || ''}"`,
                record.cutoff_score || '',
                record.last_rank || '',
                record.college_code || '',
                record.course_code || '',
                `"${record.status || ''}"`,
                `"${record.home_university || ''}"`,
            ]);

            // Combine headers and rows
            const csvContent = [
                headers.join(','),
                ...csvRows.map(row => row.join(','))
            ].join('\n');

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            const fileName = `mht-cet-cutoffs-${filters.year}-${getDisplayNameForRound(filters.round).replace(/\s+/g, '-')}-page-${currentPage}.csv`;
            
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Exported ${records.length} records to CSV`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export data');
        }
    }, [records, filters.year, filters.round, currentPage]);

    const columns: ColumnDef<CutoffRecord>[] = useMemo(
        () => {
            const baseColumns: ColumnDef<CutoffRecord>[] = [
                {
                    accessorKey: "college_name",
                    header: ({ column }) => {
                        return (
                            <Button
                                variant="link"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                            >
                                College Name
                                <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        )
                    },
                    cell: ({ row }) => (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="font-abel font-medium max-w-[200px] sm:max-w-[300px] truncate text-xs sm:text-sm lg:text-base px-2 sm:px-3 cursor-help">
                                        {row.getValue("college_name")}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs z-50">
                                    <p className="font-abel text-sm">{row.getValue("college_name")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ),
                    size: 300,
                },
                {
                    accessorKey: "course_name",
                    header: ({ column }) => {
                        return (
                            <Button
                                variant="link"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                            >
                                Course Name
                                <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        )
                    },
                    cell: ({ row }) => (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="font-abel font-medium max-w-[180px] sm:max-w-[250px] truncate text-xs sm:text-sm lg:text-base px-2 sm:px-3 cursor-help">
                                        {row.getValue("course_name")}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs z-50">
                                    <p className="font-abel text-sm">{row.getValue("course_name")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ),
                    size: 250,
                },
                {
                    accessorKey: "category",
                    header: ({ column }) => {
                        return (
                            <Button
                                variant="link"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                            >
                                Category
                                <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        )
                    },
                    cell: ({ row }) => (
                        <div className="px-2 sm:px-3">
                            <Badge variant="neutral" className="font-abel text-xs sm:text-sm w-fit font-medium">
                                {row.getValue("category")}
                            </Badge>
                        </div>
                    ),
                    size: 120,
                },
                {
                    accessorKey: "last_rank",
                    header: ({ column }) => {
                        return (
                            <Button
                                variant="link"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                            >
                                Rank
                                <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        )
                    },
                    cell: ({ row }) => {
                        const rank = row.getValue("last_rank") as string;
                        const numRank = parseInt(rank);
                        return (
                            <div className="text-right font-abel font-medium w-[80px] sm:w-[100px] text-xs sm:text-sm lg:text-base px-2 sm:px-3">
                                {isNaN(numRank) ? rank : numRank.toLocaleString()}
                            </div>
                        );
                    },
                    size: 100,
                },
                {
                    accessorKey: "cutoff_score",
                    header: ({ column }) => {
                        return (
                            <Button
                                variant="link"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                            >
                                Percentile
                                <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        )
                    },
                    cell: ({ row }) => {
                        const currentPercentile = parseFloat(row.getValue("cutoff_score") as string);
                        const showDistance = filters.percentileInput && !isNaN(parseFloat(filters.percentileInput));

                        if (showDistance) {
                            const targetPercentile = parseFloat(filters.percentileInput);
                            const distance = calculatePercentileDistance(currentPercentile, targetPercentile);
                            const isTarget = Math.abs(distance) < 0.01;

                            return (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex flex-col items-end gap-1 w-[120px] sm:w-[140px] px-2 sm:px-3">
                                                <div className="text-right font-abel font-medium text-xs sm:text-sm lg:text-base">
                                                    {row.getValue("cutoff_score")}
                                                </div>
                                                <Badge
                                                    variant="neutral"
                                                    className={`text-xs px-1 py-0 font-abel ${isTarget ? 'bg-green-100 text-green-700 border-green-300' :
                                                        distance < 0 ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                                            'bg-red-100 text-red-700 border-red-300'
                                                        }`}
                                                >
                                                    {isTarget ? 'TARGET' : `${distance < 0 ? '' : '-'}${Math.abs(distance)}%`}
                                                </Badge>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs">
                                            <p className="font-abel text-sm">
                                                {isTarget ? 'This matches your target percentile exactly' :
                                                    distance < 0 ? `This is ${Math.abs(distance)}% below your target of ${targetPercentile}%` :
                                                        `This is ${Math.abs(distance)}% above your target of ${targetPercentile}%`}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        }

                        return (
                            <div className="text-right font-abel font-medium w-[80px] sm:w-[100px] text-xs sm:text-sm lg:text-base px-2 sm:px-3">
                                {row.getValue("cutoff_score")}
                            </div>
                        );
                    },
                    size: (filters.percentileInput && !isNaN(parseFloat(filters.percentileInput))) ? 140 : 100,
                }
            ];

            // Add remaining columns
            baseColumns.push(
                {
                    accessorKey: "total_admitted",
                    header: ({ column }) => {
                        return (
                            <Button
                                variant="link"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                            >
                                Admitted
                                <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        )
                    },
                    cell: ({ row }) => {
                        const value = row.getValue("total_admitted") as number;
                        return (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="text-right font-abel font-medium w-[80px] sm:w-[100px] text-xs sm:text-sm lg:text-base px-2 sm:px-3 cursor-help">
                                            {value.toLocaleString()}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="z-50">
                                        <p className="font-abel text-sm">Total students admitted: {value}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    },
                    size: 100,
                },
                {
                    accessorKey: "college_code",
                    header: ({ column }) => {
                        return (
                            <Button
                                variant="link"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                            >
                                College Code
                                <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        )
                    },
                    cell: ({ row }) => (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="font-abel text-xs sm:text-sm w-[90px] sm:w-[110px] font-medium px-2 sm:px-3 cursor-help">
                                        {row.getValue("college_code")}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="z-50">
                                    <p className="font-abel text-sm">College Code: {row.getValue("college_code")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ),
                    size: 110,
                },
                {
                    accessorKey: "course_code",
                    header: ({ column }) => {
                        return (
                            <Button
                                variant="link"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                            >
                                Course Code
                                <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        )
                    },
                    cell: ({ row }) => (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="font-abel text-xs sm:text-sm w-[90px] sm:w-[110px] font-medium px-2 sm:px-3 cursor-help">
                                        {row.getValue("course_code")}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="z-50">
                                    <p className="font-abel text-sm">Course Code: {row.getValue("course_code")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ),
                    size: 110,
                },
                {
                    accessorKey: "status",
                    header: ({ column }) => {
                        return (
                            <Button
                                variant="link"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                            >
                                Status
                                <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        )
                    },
                    cell: ({ row }) => (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="font-abel text-xs sm:text-sm w-[150px] sm:w-[180px] font-medium px-2 sm:px-3 truncate cursor-help">
                                        {row.getValue("status")}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs z-50">
                                    <p className="font-abel text-sm">{row.getValue("status")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ),
                    size: 180,
                },
                {
                    accessorKey: "home_university",
                    header: ({ column }) => {
                        return (
                            <Button
                                variant="link"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                className="h-8 sm:h-10 px-2 sm:px-3 lg:px-4 font-abel text-xs sm:text-sm lg:text-base"
                            >
                                Home University
                                <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        )
                    },
                    cell: ({ row }) => (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="font-abel text-xs sm:text-sm w-[200px] sm:w-[250px] font-medium px-2 sm:px-3 truncate cursor-help">
                                        {row.getValue("home_university")}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs z-50">
                                    <p className="font-abel text-sm">{row.getValue("home_university")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ),
                    size: 250,
                }
            );

            return baseColumns;
        },
        [filters.percentileInput]
    );

    const table = useReactTable({
        data: records,
        columns,
        onSortingChange: (updaterOrValue) => {
            if (typeof updaterOrValue === 'function') {
                setSorting(updaterOrValue(sorting));
            } else {
                setSorting(updaterOrValue);
            }
        },
        onColumnFiltersChange: (updaterOrValue) => {
            if (typeof updaterOrValue === 'function') {
                setColumnFilters(updaterOrValue(columnFilters));
            } else {
                setColumnFilters(updaterOrValue);
            }
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: (updaterOrValue) => {
            if (typeof updaterOrValue === 'function') {
                setColumnVisibility(updaterOrValue(columnVisibility));
            } else {
                setColumnVisibility(updaterOrValue);
            }
        },
        manualPagination: true,
        pageCount: Math.ceil(totalItems / itemsPerPage),
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            pagination: {
                pageIndex: currentPage - 1,
                pageSize: itemsPerPage,
            },
        },
        onPaginationChange: (updaterOrValue) => {
            // Don't use the table's pagination handler, we'll handle it manually
            // This prevents conflicts with our custom pagination
        },
    });

    const handlePageChange = useCallback((newPage: number) => {
        // No throttling here, as it's handled in the parent component's fetchRecords
        setCurrentPage(newPage);
    }, [setCurrentPage]);

    return (
        <div className="space-y-4">
            {/* Compact Results Summary */}
            <div className="flex flex-wrap gap-2 text-xs md:text-sm font-abel">
                <div className="flex items-center gap-1 md:gap-2 bg-muted/50 px-2 md:px-3 py-1 md:py-2 rounded-md">
                    <span className="font-medium">{getDisplayNameForRound(filters.round)}</span>
                    <span className="text-muted-foreground">round</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 bg-muted/50 px-2 md:px-3 py-1 md:py-2 rounded-md">
                    <span className="font-medium">{totalItems.toLocaleString()}</span>
                    <span className="text-muted-foreground">total</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 bg-muted/50 px-2 md:px-3 py-1 md:py-2 rounded-md">
                    <span className="font-medium">{records.length}</span>
                    <span className="text-muted-foreground">showing</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 bg-muted/50 px-2 md:px-3 py-1 md:py-2 rounded-md">
                    <span className="font-medium">{filters.categories.length}</span>
                    <span className="text-muted-foreground">categories</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 bg-muted/50 px-2 md:px-3 py-1 md:py-2 rounded-md">
                    <span className="font-medium">{filters.statuses.length}</span>
                    <span className="text-muted-foreground">statuses</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 bg-muted/50 px-2 md:px-3 py-1 md:py-2 rounded-md">
                    <span className="font-medium">{filters.homeUniversities.length}</span>
                    <span className="text-muted-foreground">universities</span>
                </div>
            </div>

            {/* Pagination Controls (Top) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                <p className="text-xs md:text-sm text-muted-foreground font-abel">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems.toLocaleString()} results
                </p>
                <div className="flex items-center gap-2 text-xs md:text-sm">
                    <span className="font-abel">Rows per page:</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                            setItemsPerPage(parseInt(value));
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="w-16 md:w-20 font-abel h-8 md:h-10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ITEMS_PER_PAGE_OPTIONS.map(option => (
                                <SelectItem key={option} value={option.toString()} className="font-abel">
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="h-10 md:h-12 bg-muted/30">
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead
                                                key={header.id}
                                                className="h-10 md:h-12 font-semibold whitespace-nowrap text-xs md:text-sm px-2 md:px-4"
                                                style={{ width: header.column.columnDef.size }}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {paginationLoading ? (
                                <TableSkeleton itemsPerPage={itemsPerPage} />
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className="h-12 md:h-14 hover:bg-muted/50 transition-colors duration-150"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                className="py-2 h-12 md:h-14 text-xs md:text-sm px-2 md:px-4"
                                                style={{ width: cell.column.columnDef.size }}
                                            >
                                                <div className="truncate">
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </div>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-20 md:h-24 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Search className="h-6 w-6 md:h-8 md:w-8" />
                                            <span className="font-abel text-sm md:text-base">No cutoff data found matching your criteria</span>
                                            <span className="text-xs font-abel">Try adjusting your filters</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination Controls (Bottom) */}
            <div className="flex flex-col md:flex-row items-center justify-between px-2 md:px-4 py-2 md:py-3 gap-3 md:gap-4">
                <div className="flex items-center space-x-2">
                    <p className="text-xs md:text-sm font-medium font-abel">Rows per page</p>
                    <Select
                        value={`${itemsPerPage}`}
                        onValueChange={(value) => {
                            const newPerPage = Number(value);
                            setItemsPerPage(newPerPage);
                            setCurrentPage(1); // Reset to first page when changing items per page
                        }}
                        disabled={loading || paginationLoading}
                    >
                        <SelectTrigger className="h-8 w-[60px] md:w-[70px] font-abel">
                            <SelectValue placeholder={itemsPerPage} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {ITEMS_PER_PAGE_OPTIONS.map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`} className="font-abel">
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-2 md:space-x-6 lg:space-x-8">
                    <div className="flex w-[80px] md:w-[100px] items-center justify-center text-xs md:text-sm font-medium font-abel">
                        {paginationLoading ? (
                            <div className="flex items-center space-x-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900"></div>
                                <span>Loading...</span>
                            </div>
                        ) : (
                            `Page ${currentPage} of ${Math.ceil(totalItems / itemsPerPage)}`
                        )}
                    </div>
                    <div className="flex items-center space-x-1">
                        <Button
                            variant="neutral"
                            className="hidden md:flex h-8 w-8 p-0"
                            onClick={() => {
                                console.log('First page button clicked!');
                                handlePageChange(1);
                            }}
                            disabled={currentPage === 1 || loading || paginationLoading || totalItems === 0}
                        >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="neutral"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                                console.log('Previous button clicked!');
                                handlePageChange(Math.max(1, currentPage - 1));
                            }}
                            disabled={currentPage === 1 || loading || paginationLoading || totalItems === 0}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="neutral"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                                console.log('Next button clicked!');
                                const totalPages = Math.ceil(totalItems / itemsPerPage);
                                handlePageChange(Math.min(totalPages, currentPage + 1));
                            }}
                            disabled={currentPage >= Math.ceil(totalItems / itemsPerPage) || loading || paginationLoading || totalItems === 0}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="neutral"
                            className="hidden md:flex h-8 w-8 p-0"
                            onClick={() => {
                                console.log('Last page button clicked!');
                                const totalPages = Math.ceil(totalItems / itemsPerPage);
                                handlePageChange(totalPages);
                            }}
                            disabled={currentPage >= Math.ceil(totalItems / itemsPerPage) || loading || paginationLoading || totalItems === 0}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table Info */}
            <div className="flex flex-col md:flex-row items-center justify-between px-2 md:px-4 pb-3 md:pb-4 gap-2">
                <div className="flex-1 text-xs md:text-sm text-muted-foreground font-abel text-center md:text-left">
                    Showing {table.getRowModel().rows.length} of {totalItems.toLocaleString()} results
                </div>
                <div className="text-xs md:text-sm text-muted-foreground font-abel">
                    {table.getFilteredRowModel().rows.length} row(s) displayed.
                </div>
            </div>

            {/* CSV Export Button */}
            <div className="flex justify-center px-2 md:px-4 pb-4">
                <Button
                    onClick={exportToCSV}
                    disabled={loading || records.length === 0}
                    variant="neutral"
                    className="shadow-base hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export Current Page to CSV
                </Button>
            </div>
        </div>
    );
}
