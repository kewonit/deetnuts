'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { SortingState, ColumnFiltersState, VisibilityState } from '@tanstack/react-table';

import { CutoffRecord, FilterState, PendingFilters } from './types';
import { useDebounce } from './utils';
import { CutoffFilters } from './components/CutoffFilters';
import { ActiveFiltersDisplay } from './components/ActiveFiltersDisplay';
import { CutoffTable } from './components/CutoffTable';
import { CutoffInfoCards } from './components/CutoffInfoCards';
import { getDisplayNameForRound } from './constants';

export default function StateCutoffsPage() {
    const [records, setRecords] = useState<CutoffRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [isRequestActive, setIsRequestActive] = useState(false);

    const [filters, setFilters] = useState<FilterState>({
        search: '',
        categories: [],
        courses: [],
        statuses: [],
        homeUniversities: [],
        percentileInput: '',
        round: 1,
        sortBy: 'last_rank',
        sortOrder: 'desc'
    });

    const [pendingFilters, setPendingFilters] = useState<PendingFilters>({
        search: '',
        categories: [],
        courses: [],
        statuses: [],
        homeUniversities: [],
        percentileInput: '',
        round: 1
    });

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const cacheRef = useRef<Map<string, any>>(new Map());
    const debouncedFilters = useDebounce(filters, 300);
    const paginationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const currentRequestParamsRef = useRef<string>('');
    const requestIdRef = useRef<number>(0);
    const lastPaginationClickRef = useRef<number>(0);
    const prevItemsPerPageRef = useRef<number>(itemsPerPage);

    const [sorting, setSorting] = useState<SortingState>([{ id: 'cutoff_score', desc: true }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [isSearching, setIsSearching] = useState(false);

    const memoizedRecords = useMemo(() => records, [records]);
    const memoizedTotalItems = useMemo(() => totalItems, [totalItems]);

    useEffect(() => {
        const filtersChanged = (
            pendingFilters.search !== filters.search ||
            JSON.stringify(pendingFilters.categories) !== JSON.stringify(filters.categories) ||
            JSON.stringify(pendingFilters.courses) !== JSON.stringify(filters.courses) ||
            JSON.stringify(pendingFilters.statuses) !== JSON.stringify(filters.statuses) ||
            JSON.stringify(pendingFilters.homeUniversities) !== JSON.stringify(filters.homeUniversities) ||
            pendingFilters.percentileInput !== filters.percentileInput ||
            pendingFilters.round !== filters.round
        );
        setHasUnsavedChanges(filtersChanged);
    }, [pendingFilters, filters]);

    useEffect(() => {
        // Reset to first page when items per page changes (but not on currentPage changes)
        if (prevItemsPerPageRef.current !== itemsPerPage && currentPage > 1) {
            setCurrentPage(1);
        }
        prevItemsPerPageRef.current = itemsPerPage;
    }, [itemsPerPage, currentPage]);

    useEffect(() => {
        if (memoizedTotalItems > 0) {
            const maxPages = Math.ceil(memoizedTotalItems / itemsPerPage);
            if (currentPage > maxPages) {
                setCurrentPage(Math.max(1, maxPages));
            }
        }
    }, [memoizedTotalItems, itemsPerPage, currentPage]);

    const fetchRecords = useCallback(async () => {
        if (!debouncedFilters.percentileInput || debouncedFilters.percentileInput.trim() === '') {
            setRecords([]);
            setTotalItems(0);
            setLoading(false);
            setIsSearching(false);
            setIsRequestActive(false);
            return;
        }

        const requestBody = {
            page: currentPage,
            perPage: itemsPerPage,
            search: debouncedFilters.search,
            categories: debouncedFilters.categories,
            courses: debouncedFilters.courses,
            statuses: debouncedFilters.statuses,
            homeUniversities: debouncedFilters.homeUniversities,
            percentileInput: debouncedFilters.percentileInput,
            round: debouncedFilters.round,
            sortBy: debouncedFilters.sortBy,
            sortOrder: debouncedFilters.sortOrder,
        };

        const cacheKey = JSON.stringify(requestBody);

        const currentRequestKey = `${debouncedFilters.search}-${debouncedFilters.categories.join(',')}-${debouncedFilters.courses.join(',')}-${debouncedFilters.statuses.join(',')}-${debouncedFilters.homeUniversities.join(',')}-${debouncedFilters.percentileInput}-${debouncedFilters.round}`;
        const isOnlyPaginationChange = currentRequestParamsRef.current === currentRequestKey;

        if (cacheRef.current.has(cacheKey)) {
            const cachedResult = cacheRef.current.get(cacheKey);
            setRecords(cachedResult.data);
            setTotalItems(cachedResult.totalItems);
            setLoading(false);
            setIsSearching(false);
            setIsRequestActive(false);
            return;
        }

        if (abortControllerRef.current && !isOnlyPaginationChange) {
            abortControllerRef.current.abort();
        }

        currentRequestParamsRef.current = currentRequestKey;

        const requestId = ++requestIdRef.current;

        abortControllerRef.current = new AbortController();

        setIsRequestActive(true);
        setLoading(true);

        try {
            const response = await fetch(`/api/mht-cet/state-cutoffs`, {
                method: 'POST',
                signal: abortControllerRef.current.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=300',
                },
                body: JSON.stringify(requestBody),
            });

            if (requestId !== requestIdRef.current) {
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (requestId !== requestIdRef.current) {
                return;
            }

            if (!result.success) {
                // Enhanced error handling for different error types
                if (result.error === 'Data not available') {
                    toast.error(`${getDisplayNameForRound(debouncedFilters.round)} data is not available yet. Please try Round 1 instead.`);
                } else if (result.error === 'Authentication required') {
                    toast.error('Please log in to access cutoff data.');
                } else {
                    toast.error(result.message || result.error || 'Failed to fetch data');
                }
                throw new Error(result.error || 'Failed to fetch data');
            }

            if (cacheRef.current.size > 50) {
                const firstKey = cacheRef.current.keys().next().value;
                if (firstKey) {
                    cacheRef.current.delete(firstKey);
                }
            }
            cacheRef.current.set(cacheKey, {
                data: result.data,
                totalItems: result.totalItems
            });

            setRecords(result.data);
            setTotalItems(result.totalItems);

            if (result.note) {
                toast.info(result.note);
            }
        } catch (error: any) {
            if (requestId !== requestIdRef.current) {
                return;
            }

            if (error.name === 'AbortError') {
                return;
            }

            console.error(`Request ${requestId} error:`, error);

            // Enhanced error handling for better user experience
            if (error instanceof Error) {
                if (error.message.includes('Data not available')) {
                    toast.error(`${getDisplayNameForRound(debouncedFilters.round)} data is not available yet. Please try Round 1 instead.`);
                } else if (error.message.includes('Authentication required')) {
                    toast.error('Please log in to access cutoff data.');
                } else if (error.message.includes('network') || error.message.includes('fetch')) {
                    toast.error('Network error. Please check your connection and try again.');
                } else {
                    toast.error(`Failed to fetch cutoff data: ${error.message}`);
                }
            } else {
                toast.error('Failed to fetch cutoff data. Please try again.');
            }
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
                setIsSearching(false);

            }
        }
    }, [currentPage, itemsPerPage, debouncedFilters]);

    useEffect(() => {
        if (paginationTimeoutRef.current) {
            clearTimeout(paginationTimeoutRef.current);
        }

        paginationTimeoutRef.current = setTimeout(() => {
            fetchRecords();
        }, 150);

        return () => {
            if (paginationTimeoutRef.current) {
                clearTimeout(paginationTimeoutRef.current);
            }
        };
    }, [fetchRecords, currentPage]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (paginationTimeoutRef.current) {
                clearTimeout(paginationTimeoutRef.current);
            }
        };
    }, []);

    const applyFilters = useCallback(() => {
        setIsSearching(true);
        cacheRef.current.clear();
        setFilters(prev => ({
            ...prev,
            search: pendingFilters.search,
            categories: pendingFilters.categories,
            courses: pendingFilters.courses,
            statuses: pendingFilters.statuses,
            homeUniversities: pendingFilters.homeUniversities,
            percentileInput: pendingFilters.percentileInput,
            round: pendingFilters.round
        }));
        setSorting([{ id: 'cutoff_score', desc: true }]);
        setCurrentPage(1);
        setIsRequestActive(false);
    }, [pendingFilters]);

    const clearAllFilters = useCallback(() => {
        const clearedFilters = {
            search: '',
            categories: [],
            courses: [],
            statuses: [],
            homeUniversities: [],
            percentileInput: '',
            round: 1
        };
        cacheRef.current.clear();
        setPendingFilters(clearedFilters);
        setFilters(prev => ({
            ...prev,
            ...clearedFilters
        }));
        setSorting([{ id: 'cutoff_score', desc: true }]);
        setCurrentPage(1);
        setIsRequestActive(false);
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
        const now = Date.now();
        const timeSinceLastClick = now - lastPaginationClickRef.current;

        if (newPage >= 1 && newPage <= Math.ceil(memoizedTotalItems / itemsPerPage)) {
            setCurrentPage(newPage);
            lastPaginationClickRef.current = now;
        }
    }, [memoizedTotalItems, itemsPerPage]);

    return (
        <div className="w-full max-w-full md:max-w-7xl lg:max-w-7xl xl:max-w-7xl 2xl:max-w-7xl mx-auto py-4 md:py-8 lg:py-16 xl:py-24 px-3 md:px-4 lg:px-6 space-y-4 md:space-y-6 font-inter">
            {/* Clean Header */}
            <div className="pt-20 lg:pt-6">
                <div className="flex flex-col gap-3">
                    <h1 className="text-3xl lg:text-3xl xl:text-4xl font-black tracking-tight text-gray-900 font-inter break-words">
                        MHT-CET State Cutoffs 2024 - {getDisplayNameForRound(filters.round)}
                    </h1>
                    <p className="text-gray-600 text-sm md:text-base lg:text-lg font-medium font-inter">
                        Use these to predict your chances of admission based on your percentile. (Data : 2024 {getDisplayNameForRound(filters.round)})
                    </p>
                </div>
            </div>

            <CutoffFilters
                filters={filters}
                pendingFilters={pendingFilters}
                setPendingFilters={setPendingFilters}
                hasUnsavedChanges={hasUnsavedChanges}
                isSearching={isSearching}
                loading={loading}
                applyFilters={applyFilters}
                clearAllFilters={clearAllFilters}
            />

            <ActiveFiltersDisplay filters={filters} clearAllFilters={clearAllFilters} />

            <CutoffTable
                records={memoizedRecords}
                totalItems={memoizedTotalItems}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                loading={loading}
                filters={filters}
                setCurrentPage={setCurrentPage}
                setItemsPerPage={setItemsPerPage}
                sorting={sorting}
                setSorting={setSorting}
                columnFilters={columnFilters}
                setColumnFilters={setColumnFilters}
                columnVisibility={columnVisibility}
                setColumnVisibility={setColumnVisibility}
            />

            <CutoffInfoCards />
        </div>
    );
}