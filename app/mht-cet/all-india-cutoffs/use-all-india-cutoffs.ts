import { useState, useEffect, useCallback, useRef } from 'react';
import { SortingState } from '@tanstack/react-table';
import { CutoffRecord, PaginationInfo, ApiResponse, FilterState, RoundType, ROUND_ENDPOINTS } from './types';

interface UseAllIndiaCutoffsProps {
    round: RoundType;
    filters: FilterState;
    sorting: SortingState;
    page: number;
    perPage?: number;
    debounceMs?: number;
}

interface UseAllIndiaCutoffsReturn {
    data: CutoffRecord[];
    pagination: PaginationInfo;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useAllIndiaCutoffs({
    round,
    filters,
    sorting,
    page,
    perPage = 50,
    debounceMs = 300,
}: UseAllIndiaCutoffsProps): UseAllIndiaCutoffsReturn {
    const [data, setData] = useState<CutoffRecord[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        perPage: 50,
        totalPages: 1,
        totalItems: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    const buildQueryParams = useCallback((
        filters: FilterState,
        sorting: SortingState,
        page: number,
        perPage: number
    ) => {
        const params = new URLSearchParams();

        params.set('page', page.toString());
        params.set('perPage', perPage.toString());

        if (sorting.length > 0) {
            const sortField = sorting[0].id;
            const sortDirection = sorting[0].desc ? '-' : '';
            params.set('sort', `${sortDirection}${sortField}`);
        }

        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'branches' && Array.isArray(value) && value.length > 0) {
                // Handle multiple branches - join them with commas
                params.set('branches', value.join(','));
            } else if (key !== 'branches' && typeof value === 'string' && value.trim()) {
                params.set(key, value.trim());
            }
        });

        return params.toString();
    }, []);

    const fetchData = useCallback(async (
        round: RoundType,
        filters: FilterState,
        sorting: SortingState,
        page: number,
        perPage: number,
        signal?: AbortSignal
    ) => {
        try {
            const queryParams = buildQueryParams(filters, sorting, page, perPage);
            const url = `${ROUND_ENDPOINTS[round]}?${queryParams}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
                signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: ApiResponse = await response.json();

            if (result.success) {
                if (isMountedRef.current) {
                    setData(result.data);
                    setPagination(result.pagination);
                    setError(null);
                }
            } else {
                throw new Error(result.error || 'Failed to fetch data');
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return; // Request was cancelled, don't update state
            }

            console.error(`Error fetching ${round} data:`, error);
            if (isMountedRef.current) {
                setError(error instanceof Error ? error.message : 'Unknown error occurred');
                setData([]);
                setPagination({
                    page: 1,
                    perPage: 50,
                    totalPages: 1,
                    totalItems: 0,
                });
            }
        }
    }, [buildQueryParams]);

    const refetch = useCallback(() => {
        // Clear any pending debounced requests
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Cancel any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        if (isMountedRef.current) {
            setLoading(true);
            setError(null);
        }

        fetchData(round, filters, sorting, page, perPage, abortControllerRef.current.signal)
            .finally(() => {
                if (isMountedRef.current) {
                    setLoading(false);
                }
            });
    }, [round, filters, sorting, page, perPage, fetchData]);

    // Effect to handle data fetching with debouncing
    useEffect(() => {
        // Clear any pending debounced requests
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Cancel any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // For non-search operations (pagination, sorting), fetch immediately
        const isSearchOperation = filters.search !== '' || filters.branch !== '';
        const delay = isSearchOperation ? debounceMs : 0;

        debounceTimeoutRef.current = setTimeout(() => {
            // Create new abort controller
            abortControllerRef.current = new AbortController();

            if (isMountedRef.current) {
                setLoading(true);
                setError(null);
            }

            fetchData(round, filters, sorting, page, perPage, abortControllerRef.current.signal)
                .finally(() => {
                    if (isMountedRef.current) {
                        setLoading(false);
                    }
                });
        }, delay);

        // Cleanup function
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [round, filters, sorting, page, perPage, debounceMs, fetchData]);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        data,
        pagination,
        loading,
        error,
        refetch,
    };
}
