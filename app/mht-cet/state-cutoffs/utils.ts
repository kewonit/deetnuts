import { useState, useEffect } from 'react';

// Helper function to calculate percentile from rank (approximate)
export const calculatePercentile = (rank: string | number): number => {
    const numRank = typeof rank === 'string' ? parseInt(rank) : rank;
    if (isNaN(numRank)) return 0;

    // Approximate calculation: assuming ~150,000 total candidates
    // This is a rough estimate and should be adjusted based on actual data
    const totalCandidates = 150000;
    const percentile = Math.max(0, Math.min(100, ((totalCandidates - numRank) / totalCandidates) * 100));
    return Math.round(percentile * 100) / 100; // Round to 2 decimal places
};

// Helper function to handle precise decimal arithmetic for percentile range
export const getPrecisePercentileRange = (targetPercentile: number): { min: number; max: number } => {
    // Use higher precision (10 decimal places) to avoid floating-point errors
    const max = Math.round(targetPercentile * 10000000000) / 10000000000;
    const min = 0; // Changed: range from target percentile down to 0%
    return { min, max };
};

// Helper function to calculate distance from target percentile
export const calculatePercentileDistance = (currentPercentile: number, targetPercentile: number): number => {
    return Math.round((targetPercentile - currentPercentile) * 100) / 100;
};

// Debounce hook for performance optimization
export const useDebounce = (value: any, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};
