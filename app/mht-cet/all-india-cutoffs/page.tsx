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

export default function AllIndiaCutoffsPage() {
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
        <div className="min-h-screen bg-[#E4DFF2] pt-[120px] pb-8">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black">
                            MHT-CET All India Cutoffs 2024
                        </h1>
                        <Button
                            variant="neutral"
                            size="sm"
                            onClick={refetch}
                            disabled={loading}
                            className="shadow-base hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Refresh
                        </Button>
                    </div>
                    <p className="text-gray-700 text-sm sm:text-base lg:text-lg">
                        Explore detailed cutoff data for all rounds of MHT-CET 2024 All India quota.
                        Use filters to find specific courses, colleges, or percentile ranges.
                    </p>
                </div>

                {/* Current Round Statistics */}
                <Card className="border-2 border-black shadow-base bg-white">
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
                        <CardTitle className="text-lg font-bold text-black">
                            {ROUND_LABELS[activeRound]} Statistics
                        </CardTitle>
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-[#F5F3FF] border-2 border-black rounded-base">
                                <div className="text-xl sm:text-2xl font-bold text-black">
                                    {pagination.totalItems.toLocaleString()}
                                </div>
                                <p className="text-sm text-gray-600 font-medium">
                                    Total Records
                                </p>
                            </div>
                            <div className="text-center p-3 bg-[#F0FDF4] border-2 border-black rounded-base">
                                <div className="text-2xl font-bold text-black">
                                    {pagination.totalPages.toLocaleString()}
                                </div>
                                <p className="text-sm text-gray-600 font-medium">
                                    Total Pages
                                </p>
                            </div>
                            <div className="text-center p-3 bg-[#FEF3C7] border-2 border-black rounded-base">
                                <div className="text-2xl font-bold text-black">
                                    {pagination.page}
                                </div>
                                <p className="text-sm text-gray-600 font-medium">
                                    Current Page
                                </p>
                            </div>
                            <div className="text-center p-3 bg-[#FEE2E2] border-2 border-black rounded-base">
                                <div className="text-2xl font-bold text-black">
                                    {data.length}
                                </div>
                                <p className="text-sm text-gray-600 font-medium">
                                    Records Shown
                                </p>
                            </div>
                        </div>
                        {error && (
                            <Alert variant="destructive" className="mt-4 border-2 border-red-600">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    {error}
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={refetch}
                                        className="ml-2 h-auto p-0 underline text-red-600"
                                    >
                                        Retry
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>                {/* Info Alert */}
                <Alert className="border-2 border-blue-500 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-gray-700">
                        Data shows actual cutoffs from MHT-CET 2024 All India quota.
                        Percentile range filters help you find seats within your score range.
                        Use the branch filter to narrow down to specific engineering disciplines.
                        {Object.values(filters).some(value => value !== '') && (
                            <Button
                                variant="link"
                                size="sm"
                                onClick={clearAllFilters}
                                className="ml-2 h-auto p-0 underline text-blue-600"
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
                />                {/* Round Tabs with Data Table */}
                <Tabs value={activeRound} onValueChange={handleRoundChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-white border-2 border-black shadow-base">
                        <TabsTrigger
                            value="round-one"
                            className="relative data-[state=active]:bg-main data-[state=active]:text-black font-bold"
                        >
                            {ROUND_LABELS['round-one']}
                            {activeRound === 'round-one' && pagination.totalItems > 0 && (
                                <Badge variant="neutral" className="ml-2 text-xs">
                                    {pagination.totalItems.toLocaleString()}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="round-two"
                            className="relative data-[state=active]:bg-main data-[state=active]:text-black font-bold"
                        >
                            {ROUND_LABELS['round-two']}
                            {activeRound === 'round-two' && pagination.totalItems > 0 && (
                                <Badge variant="neutral" className="ml-2 text-xs">
                                    {pagination.totalItems.toLocaleString()}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="round-three"
                            className="relative data-[state=active]:bg-main data-[state=active]:text-black font-bold"
                        >
                            {ROUND_LABELS['round-three']}
                            {activeRound === 'round-three' && pagination.totalItems > 0 && (
                                <Badge variant="neutral" className="ml-2 text-xs">
                                    {pagination.totalItems.toLocaleString()}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeRound} className="mt-6">
                        <Card className="border-2 border-black shadow-base bg-white">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold text-black">
                                        {ROUND_LABELS[activeRound]} Cutoffs
                                    </CardTitle>
                                    <div className="flex items-center space-x-2">
                                        {loading && (
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading...
                                            </div>
                                        )}
                                        {pagination.totalItems > 0 && (
                                            <Badge variant="neutral" className="bg-main">
                                                {pagination.totalItems.toLocaleString()} records
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    key={activeRound}
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
        </div>
    );
}