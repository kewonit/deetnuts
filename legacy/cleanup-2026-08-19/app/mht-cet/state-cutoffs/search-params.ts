import {
  createSearchParamsCache,
  parseAsString,
  parseAsInteger,
  parseAsArrayOf,
  parseAsStringLiteral,
} from "nuqs/server";
import { DEFAULT_YEAR } from "./constants";

// Define all search params for the state cutoffs page
export const searchParamsParser = {
  // Core filters
  percentile: parseAsString.withDefault(""),
  search: parseAsString.withDefault(""),
  year: parseAsInteger.withDefault(DEFAULT_YEAR),
  round: parseAsInteger.withDefault(1),

  // Multi-select filters (stored as comma-separated)
  categories: parseAsArrayOf(parseAsString, ",").withDefault([]),
  courses: parseAsArrayOf(parseAsString, ",").withDefault([]),
  statuses: parseAsArrayOf(parseAsString, ",").withDefault([]),
  universities: parseAsArrayOf(parseAsString, ",").withDefault([]),

  // Pagination & sorting
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sortBy: parseAsString.withDefault("cutoff_score"),
  sortOrder: parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),

  // View preferences
  density: parseAsStringLiteral([
    "compact",
    "comfortable",
    "spacious",
  ] as const).withDefault("comfortable"),
};

export const searchParamsCache = createSearchParamsCache(searchParamsParser);
