/**
 * stable URL contract for college predictor shared links
 * query params are sorted so encode and decode round trips produce identical URLs
 **/

import type { CollegePredictorFilters, ProbabilityBand } from "./engine";

export interface CollegePredictorUrlInput {
  rank: number;
  seat_type?: string;
  gender?: string;
  state?: string;
  quota?: string;
  filters?: CollegePredictorFilters;
  has_ews_certificate?: boolean;
  include_all?: boolean;
  band?: ProbabilityBand;
}

const DEFAULT_SEAT_TYPE = "OPEN";
const DEFAULT_GENDER = "Gender-Neutral";
const CATEGORY_TO_SEAT_TYPE: Record<string, string> = {
  gen: "OPEN",
  "gen-ews": "EWS",
  obc: "OBC-NCL",
  "obc-ncl": "OBC-NCL",
  sc: "SC",
  st: "ST",
};
const GENDER_TO_SEAT_GENDER: Record<string, string> = {
  neutral: "Gender-Neutral",
  female: "Female-only (including Supernumerary)",
};
const QUOTA_TO_API: Record<string, string> = {
  ai: "AI",
  hs: "HS",
  os: "OS",
  AI: "AI",
  HS: "HS",
  OS: "OS",
};
const QUERY_KEYS = [
  "band",
  "ews",
  "filters",
  "gender",
  "include_all",
  "quota",
  "rank",
  "seat_type",
  "state",
] as const;

function stableNormalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableNormalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, stableNormalize(entry)]),
    );
  }
  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableNormalize(value));
}

function parseBoolean(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseQuota(value: string | null): string | undefined {
  if (!value) return undefined;
  return QUOTA_TO_API[value] ?? QUOTA_TO_API[value.toLowerCase()];
}

function parseFilters(
  value: string | null,
): CollegePredictorFilters | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as CollegePredictorFilters)
      : undefined;
  } catch {
    return undefined;
  }
}

export function decodeCollegePredictorUrlParams(
  params: URLSearchParams,
): CollegePredictorUrlInput {
  const rankValue = params.get("rank");
  const rank = rankValue ? Number.parseInt(rankValue, 10) : Number.NaN;
  const category = params.get("category") ?? params.get("category_id");
  const gender = params.get("gender") ?? params.get("gender_id");
  const state = params.get("state") ?? params.get("state_of_domicile");
  const rawFilters = parseFilters(params.get("filters"));
  const band = params.get("band") as ProbabilityBand | null;
  const filterWithBand = band ? { ...rawFilters, band: [band] } : rawFilters;
  const hasEwsCertificate =
    parseBoolean(params.get("has_ews_certificate")) ??
    parseBoolean(params.get("ews_toggle")) ??
    parseBoolean(params.get("ews"));
  const includeAll = parseBoolean(params.get("include_all"));
  const quota = parseQuota(params.get("quota"));

  return {
    rank,
    seat_type:
      params.get("seat_type") ??
      (category ? CATEGORY_TO_SEAT_TYPE[category] : undefined) ??
      DEFAULT_SEAT_TYPE,
    gender:
      (gender ? GENDER_TO_SEAT_GENDER[gender] : undefined) ??
      gender ??
      DEFAULT_GENDER,
    ...(state ? { state } : {}),
    ...(quota ? { quota } : {}),
    ...(filterWithBand ? { filters: filterWithBand } : {}),
    ...(hasEwsCertificate === undefined
      ? {}
      : { has_ews_certificate: hasEwsCertificate }),
    ...(includeAll === undefined ? {} : { include_all: includeAll }),
    ...(band ? { band } : {}),
  };
}

export function encodeCollegePredictorUrlParams(
  input: CollegePredictorUrlInput,
): URLSearchParams {
  const params = new URLSearchParams();
  const values: Record<(typeof QUERY_KEYS)[number], string | undefined> = {
    band: input.band,
    ews:
      input.has_ews_certificate === undefined
        ? undefined
        : String(input.has_ews_certificate),
    filters: input.filters ? stableStringify(input.filters) : undefined,
    gender: input.gender,
    include_all:
      input.include_all === undefined ? undefined : String(input.include_all),
    quota: input.quota?.toLowerCase(),
    rank: Number.isFinite(input.rank) ? String(input.rank) : undefined,
    seat_type: input.seat_type,
    state: input.state,
  };

  for (const key of QUERY_KEYS) {
    const value = values[key];
    if (value !== undefined && value !== "") params.set(key, value);
  }

  return params;
}

export function buildCollegePredictorSharePath(
  path: string,
  input: CollegePredictorUrlInput,
): string {
  const query = encodeCollegePredictorUrlParams(input).toString();
  return query ? `${path}?${query}` : path;
}
