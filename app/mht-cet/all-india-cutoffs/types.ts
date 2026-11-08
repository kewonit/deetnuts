import type { AllIndiaCutoffRow } from "@/lib/mht-cet/all-india/query";

export type CutoffRecord = AllIndiaCutoffRow;

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
}

export interface FilterState {
  search: string;
  branch: string;
  branches: string[];
  minPercentile: string;
  maxPercentile: string;
  minRank: string;
  maxRank: string;
  collegeName: string;
}
