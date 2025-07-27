export interface CutoffRecord {
    id: string;
    sr_no: string;
    rank: number;
    percentile: string;
    choice_code: string;
    institute_code: string;
    merit_exam: string;
    type: string;
    seat_type: string;
    college_code: string;
    course_name: string;
    college_name: string;
    created: string;
    updated: string;
}

export interface PaginationInfo {
    page: number;
    perPage: number;
    totalPages: number;
    totalItems: number;
}

export interface ApiResponse {
    success: boolean;
    data: CutoffRecord[];
    pagination: PaginationInfo;
    error?: string;
    details?: string;
}

export interface FilterState {
    search: string;
    branch: string;
    branches: string[]; // New field for multi-select branches
    minPercentile: string;
    maxPercentile: string;
    minRank: string;
    maxRank: string;
    collegeName: string;
}

export type RoundType = 'round-one' | 'round-two' | 'round-three';

export const ROUND_LABELS = {
    'round-one': 'Round 1',
    'round-two': 'Round 2',
    'round-three': 'Round 3'
} as const;

export const ROUND_ENDPOINTS = {
    'round-one': '/api/mht-cet/all-india-cutoffs/2024-round-one',
    'round-two': '/api/mht-cet/all-india-cutoffs/2024-round-two',
    'round-three': '/api/mht-cet/all-india-cutoffs/2024-round-three'
} as const;
