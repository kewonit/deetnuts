import type { SortingState } from "@tanstack/react-table";
import type { CutoffRecord, FilterState, PaginationInfo } from "./types";

// Shared by the server page and the browser; no React here.

export const EMPTY_FILTERS: FilterState = {
  search: "",
  branch: "",
  branches: [],
  minPercentile: "",
  maxPercentile: "",
  minRank: "",
  maxRank: "",
  collegeName: "",
};

export const DEFAULT_SORTING: SortingState = [{ id: "rank", desc: false }];

export type AllIndiaQuery = {
  year: number;
  round: number;
  filters: FilterState;
  sorting: SortingState;
  page: number;
  perPage: number;
};

export type AllIndiaInitialPage = {
  key: string;
  data: CutoffRecord[];
  pagination: PaginationInfo;
};

export function allIndiaQueryString({ year, round, filters, sorting, page, perPage }: AllIndiaQuery) {
  const params = new URLSearchParams({
    year: String(year),
    round: String(round),
    page: String(page),
    perPage: String(perPage),
  });
  if (sorting[0]) params.set("sort", `${sorting[0].desc ? "-" : ""}${sorting[0].id}`);
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value) && value.length > 0) params.set(key, value.join(","));
    else if (typeof value === "string" && value.trim()) params.set(key, value.trim());
  }
  return params.toString();
}
