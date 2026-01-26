export interface PredictionRecord {
  seat_id: string;
  institute: string;
  branch: string;
  seat_type: string;
  quota: string;
  predicted_cutoff_2026: number;
  change_from_2025: number;
  pct_change_from_2025: number;
}

export interface PredictionFilters {
  institute: string;
  branch: string;
  seatType: string;
  quota: string;
  search: string;
  minCutoff: number | null;
  maxCutoff: number | null;
  minChange: number | null;
  maxChange: number | null;
}

export interface PredictionResponse {
  success: boolean;
  data: PredictionRecord[];
  pagination: {
    page: number;
    perPage: number;
    totalRecords: number;
    totalPages: number;
  };
  filters: {
    institutes: string[];
    branches: string[];
    seatTypes: string[];
    quotas: string[];
  };
  stats: {
    totalRecords: number;
    filteredRecords: number;
    averagePredictedCutoff: number;
    averageChange: number;
    averagePercentChange: number;
  };
  error?: string;
}

export const SEAT_TYPE_LABELS: Record<string, string> = {
  "0": "OPEN",
  "1": "EWS",
  "2": "EWS (PwD)",
  "3": "OBC-NCL",
  "4": "OBC-NCL (PwD)",
  "5": "OPEN (PwD)",
  "6": "SC",
  "7": "SC (PwD)",
  "8": "ST",
  "9": "ST (PwD)",
};

export const QUOTA_LABELS: Record<string, string> = {
  "0": "All India",
  "3": "Home State",
  "4": "Other State",
};
