"use client";

import { useState, useCallback } from 'react';
import { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from './data-table';
import { Filters } from './filters';
import { useAllIndiaCutoffs } from './use-all-india-cutoffs';
import {
    FilterState,
    RoundType,
    ROUND_LABELS
} from './types';

const initialFilters: FilterState = {
    search: '',
    branch: '',
    branches: [],
    minPercentile: '',
    maxPercentile: '',
    minRank: '',
    maxRank: '',
    collegeName: '',
};

export default function AllIndiaCutoffsPageOptimized() {
    const [activeRound, setActiveRound] = useState<RoundType>('round-one');
    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(50);

    // Use optimized hook for current round
    const {
        data,
        pagination,
        loading,
        error,
        refetch
    } = useAllIndiaCutoffs({
        round: activeRound,
        filters,
        sorting,
        page: currentPage,
        perPage,
        debounceMs: 300,
    });

    // Get stats for all rounds (simplified - you might want to implement a separate hook for this)
    const handleRoundChange = useCallback((newRound: string) => {
        setActiveRound(newRound as RoundType);
        setCurrentPage(1); // Reset to first page when changing rounds
    }, []);

    const handleFiltersChange = useCallback((newFilters: FilterState) => {
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page when filters change
    }, []);

    const handleSearch = useCallback(() => {
        // The search is handled automatically by the hook through debouncing
        // This is mainly for explicit search button clicks
        setCurrentPage(1);
        refetch();
    }, [refetch]);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const handleSortChange = useCallback((newSorting: SortingState) => {
        setSorting(newSorting);
        setCurrentPage(1); // Reset to first page when sorting changes
    }, []);

    const handleColumnFiltersChange = useCallback((columnFilters: ColumnFiltersState) => {
        // Convert column filters to our filter format
        const newFilters = { ...filters };

        columnFilters.forEach(filter => {
            if (filter.id === 'college_name' && typeof filter.value === 'string') {
                newFilters.search = filter.value;
            }
        });

        setFilters(newFilters);
        setCurrentPage(1);
    }, [filters]);

    const clearAllFilters = useCallback(() => {
        setFilters(initialFilters);
        setCurrentPage(1);
    }, []);

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">
                        MHT-CET All India Cutoffs 2024
                    </h1>
                    <Button
                        variant="neutral"
                        size="sm"
                        onClick={refetch}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh
                    </Button>
                </div>
                <p className="text-muted-foreground">
                    Explore detailed cutoff data for all rounds of MHT-CET 2024 All India quota.
                    Use filters to find specific courses, colleges, or percentile ranges.
                </p>
            </div>

            {/* Current Round Statistics */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {ROUND_LABELS[activeRound]} Statistics
                    </CardTitle>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-2xl font-bold">
                                {pagination.totalItems.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total Records
                            </p>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">
                                {pagination.totalPages.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total Pages
                            </p>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">
                                {pagination.page}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Current Page
                            </p>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">
                                {data.length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Records Shown
                            </p>
                        </div>
                    </div>
                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                {error}
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={refetch}
                                    className="ml-2 h-auto p-0 underline"
                                >
                                    Retry
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Info Alert */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Data shows actual cutoffs from MHT-CET 2024 All India quota.
                    Percentile range filters help you find seats within your score range.
                    Use the branch filter to narrow down to specific engineering disciplines.
                    {Object.values(filters).some(value => value !== '') && (
                        <Button
                            variant="link"
                            size="sm"
                            onClick={clearAllFilters}
                            className="ml-2 h-auto p-0 underline"
                        >
                            Clear all filters
                        </Button>
                    )}
                </AlertDescription>
            </Alert>

            {/* Filters */}
            <Filters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onSearch={handleSearch}
                loading={loading}
            />

            {/* Round Tabs with Data Table */}
            <Tabs value={activeRound} onValueChange={handleRoundChange}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="round-one" className="relative">
                        {ROUND_LABELS['round-one']}
                        {activeRound === 'round-one' && pagination.totalItems > 0 && (
                            <Badge variant="neutral" className="ml-2 text-xs">
                                {pagination.totalItems.toLocaleString()}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="round-two" className="relative">
                        {ROUND_LABELS['round-two']}
                        {activeRound === 'round-two' && pagination.totalItems > 0 && (
                            <Badge variant="neutral" className="ml-2 text-xs">
                                {pagination.totalItems.toLocaleString()}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="round-three" className="relative">
                        {ROUND_LABELS['round-three']}
                        {activeRound === 'round-three' && pagination.totalItems > 0 && (
                            <Badge variant="neutral" className="ml-2 text-xs">
                                {pagination.totalItems.toLocaleString()}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeRound}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{ROUND_LABELS[activeRound]} Cutoffs</CardTitle>
                                <div className="flex items-center space-x-2">
                                    {loading && (
                                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading...
                                        </div>
                                    )}
                                    {pagination.totalItems > 0 && (
                                        <Badge variant="neutral">
                                            {pagination.totalItems.toLocaleString()} records
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={data}
                                pagination={pagination}
                                loading={loading}
                                onPageChange={handlePageChange}
                                onSortChange={handleSortChange}
                                onFiltersChange={handleColumnFiltersChange}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
