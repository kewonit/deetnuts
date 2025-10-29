'use client';

import { useState, useEffect, useCallback } from 'react';
import { PredictionRecord, PredictionResponse, PredictionFilters } from './types';

interface UsePredictionsResult {
    data: PredictionRecord[];
    loading: boolean;
    error: string | null;
    pagination: PredictionResponse['pagination'];
    filters: PredictionResponse['filters'];
    stats: PredictionResponse['stats'];
    fetchData: () => Promise<void>;
}

export function usePredictions(
    page: number,
    perPage: number,
    filters: PredictionFilters,
    sortBy: string,
    sortOrder: 'asc' | 'desc'
): UsePredictionsResult {
    const [data, setData] = useState<PredictionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PredictionResponse['pagination']>({
        page: 1,
        perPage: 50,
        totalRecords: 0,
        totalPages: 0,
    });
    const [filterOptions, setFilterOptions] = useState<PredictionResponse['filters']>({
        institutes: [],
        branches: [],
        seatTypes: [],
        quotas: [],
    });
    const [stats, setStats] = useState<PredictionResponse['stats']>({
        totalRecords: 0,
        filteredRecords: 0,
        averagePredictedCutoff: 0,
        averageChange: 0,
        averagePercentChange: 0,
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                perPage: perPage.toString(),
                sortBy,
                sortOrder,
            });

            // Add filters (only add non-empty values)
            if (filters.institute) params.append('institute', filters.institute);
            if (filters.branch) params.append('branch', filters.branch);
            if (filters.seatType) params.append('seatType', filters.seatType);
            if (filters.quota) params.append('quota', filters.quota);
            if (filters.search?.trim()) params.append('search', filters.search.trim());
            if (filters.minCutoff !== null && !isNaN(filters.minCutoff)) params.append('minCutoff', filters.minCutoff.toString());
            if (filters.maxCutoff !== null && !isNaN(filters.maxCutoff)) params.append('maxCutoff', filters.maxCutoff.toString());
            if (filters.minChange !== null && !isNaN(filters.minChange)) params.append('minChange', filters.minChange.toString());
            if (filters.maxChange !== null && !isNaN(filters.maxChange)) params.append('maxChange', filters.maxChange.toString());

            const response = await fetch(`/api/predictions?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result: PredictionResponse = await response.json();

            if (result.success && result.data) {
                setData(result.data);
                setPagination(result.pagination);
                setFilterOptions(result.filters);
                setStats(result.stats);
            } else {
                setError(result.error || 'Failed to fetch predictions data');
                setData([]);
            }
        } catch (err) {
            console.error('Error fetching predictions:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [page, perPage, filters, sortBy, sortOrder]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        pagination,
        filters: filterOptions,
        stats,
        fetchData,
    };
}
