import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_ROUND,
  DEFAULT_YEAR,
  getCollectionForRound,
  getDisplayNameForRound,
  isRoundAvailableForYear,
  isSupportedYear,
} from "@/lib/mht-cet/state-cutoffs/config";
import {
  type BotCutoffCategoryGroup,
  getSupportedBotCategoryLabels,
  resolveBotCutoffCategoryGroup,
} from "./categories";
import {
  type BotBranchGroup,
  getSupportedBotBranchLabels,
  matchesBotBranchGroup,
  resolveBotBranchGroup,
} from "./branch-groups";
import {
  type BotCutoffSubcategoryGroup,
  filterBotCategoryCodesBySubcategory,
  getSupportedBotSubcategoryLabels,
  resolveBotCutoffSubcategoryGroup,
} from "./subcategories";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;
const MIN_PERCENTILE = 0;
const MAX_PERCENTILE = 100;

export const botCutoffQuerySchema = z.object({
  percentile: z.number().min(MIN_PERCENTILE).max(MAX_PERCENTILE),
  year: z.number().int().optional(),
  round: z.number().int().optional(),
  limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
  category: z.string().trim().optional(),
  subcategory: z.string().trim().optional(),
  branch: z.string().trim().optional(),
  course: z.string().trim().optional(),
});

export type BotCutoffQueryInput = z.input<typeof botCutoffQuerySchema>;

export interface NormalizedBotCutoffQuery {
  percentile: number;
  year: number;
  round: number;
  limit: number;
  categoryGroup: BotCutoffCategoryGroup;
  subcategoryGroup: BotCutoffSubcategoryGroup;
  categoryCodes: readonly string[];
  branchGroup: BotBranchGroup;
}

export interface RawStateCutoffRow {
  id?: string | null;
  college_code?: string | number | null;
  college_name?: string | null;
  course_name?: string | null;
  category?: string | null;
  cutoff_score?: string | number | null;
  last_rank?: string | number | null;
  home_university?: string | null;
}

export interface BotCutoffRow {
  collegeCode: string | null;
  collegeName: string;
  courseName: string;
  category: string;
  cutoffScore: number;
  lastRank: number | null;
  homeUniversity: string | null;
}

export interface BotCutoffResult {
  query: {
    percentile: number;
    year: number;
    round: number;
    roundLabel: string;
    categoryGroup: string;
    category: BotCutoffCategoryGroup["id"];
    subcategoryGroup: string;
    subcategory: BotCutoffSubcategoryGroup["id"];
    courseGroup: string;
    course: BotBranchGroup["id"];
    branchGroup: string;
    branch: BotBranchGroup["id"];
  };
  rows: BotCutoffRow[];
  totalMatched: number;
  sourceUrl: string;
}

export type FetchBotCutoffRows = (
  query: NormalizedBotCutoffQuery,
) => Promise<{ rows: RawStateCutoffRow[]; totalMatched: number }>;

export class BotCutoffError extends Error {
  code:
    | "INVALID_INPUT"
    | "UNSUPPORTED_YEAR"
    | "UNSUPPORTED_ROUND"
    | "DATA_UNAVAILABLE"
    | "QUERY_FAILED";

  constructor(
    code: BotCutoffError["code"],
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "BotCutoffError";
    this.code = code;
  }
}

export function normalizeBotCutoffQuery(
  input: BotCutoffQueryInput,
): NormalizedBotCutoffQuery {
  const parsed = botCutoffQuerySchema.safeParse(input);
  if (!parsed.success) {
    throw new BotCutoffError("INVALID_INPUT", "Invalid cutoff query");
  }

  const year = parsed.data.year ?? DEFAULT_YEAR;
  const round = parsed.data.round ?? DEFAULT_ROUND;
  const categoryGroup = resolveBotCutoffCategoryGroup(parsed.data.category);
  const subcategoryGroup = resolveBotCutoffSubcategoryGroup(
    parsed.data.subcategory,
  );
  const branchGroup = resolveBotBranchGroup(
    parsed.data.branch ?? parsed.data.course,
  );

  if (!categoryGroup) {
    throw new BotCutoffError(
      "INVALID_INPUT",
      `Unsupported category. Use one of: ${getSupportedBotCategoryLabels()}`,
    );
  }

  if (!subcategoryGroup) {
    throw new BotCutoffError(
      "INVALID_INPUT",
      `Unsupported subcategory. Use one of: ${getSupportedBotSubcategoryLabels()}`,
    );
  }

  const categoryCodes = filterBotCategoryCodesBySubcategory(
    categoryGroup,
    subcategoryGroup,
  );

  if (categoryCodes.length === 0) {
    throw new BotCutoffError(
      "INVALID_INPUT",
      `${subcategoryGroup.label} is not available for ${categoryGroup.label}. Try All subcategories.`,
    );
  }

  if (!branchGroup) {
    throw new BotCutoffError(
      "INVALID_INPUT",
      `Unsupported branch/course. Use one of: ${getSupportedBotBranchLabels()}`,
    );
  }

  if (parsed.data.branch && parsed.data.course) {
    const courseGroup = resolveBotBranchGroup(parsed.data.course);
    if (!courseGroup || courseGroup.id !== branchGroup.id) {
      throw new BotCutoffError(
        "INVALID_INPUT",
        "Use either branch or course, or make both refer to the same branch group.",
      );
    }
  }

  if (!isSupportedYear(year)) {
    throw new BotCutoffError(
      "UNSUPPORTED_YEAR",
      `Year ${year} is not supported`,
    );
  }

  if (!isRoundAvailableForYear(round, year)) {
    throw new BotCutoffError(
      "UNSUPPORTED_ROUND",
      `Round ${round} is not available for ${year}`,
    );
  }

  return {
    percentile: parsed.data.percentile,
    year,
    round,
    limit: parsed.data.limit ?? DEFAULT_LIMIT,
    categoryGroup,
    subcategoryGroup,
    categoryCodes,
    branchGroup,
  };
}

function toFiniteNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toNullableString(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const stringValue = String(value).trim();
  return stringValue || null;
}

function normalizeRawRow(row: RawStateCutoffRow): BotCutoffRow | null {
  const cutoffScore = toFiniteNumber(row.cutoff_score);
  if (cutoffScore === null) return null;

  const collegeName = toNullableString(row.college_name);
  const courseName = toNullableString(row.course_name);
  const category = toNullableString(row.category);

  if (!collegeName || !courseName || !category) {
    return null;
  }

  const lastRankValue = toFiniteNumber(row.last_rank);

  return {
    collegeCode: toNullableString(row.college_code),
    collegeName,
    courseName,
    category,
    cutoffScore,
    lastRank: lastRankValue === null ? null : Math.trunc(lastRankValue),
    homeUniversity: toNullableString(row.home_university),
  };
}

function dedupeKey(row: BotCutoffRow) {
  return `${row.collegeCode ?? row.collegeName.toLowerCase()}::${row.courseName.toLowerCase()}`;
}

export function selectTopUniqueCutoffRows(
  rows: RawStateCutoffRow[],
  limit = DEFAULT_LIMIT,
  branchGroup?: BotBranchGroup,
): BotCutoffRow[] {
  const selected = new Map<string, BotCutoffRow>();

  const normalizedRows = rows
    .map(normalizeRawRow)
    .filter((row): row is BotCutoffRow => Boolean(row))
    .filter(
      (row) =>
        !branchGroup || matchesBotBranchGroup(row.courseName, branchGroup),
    )
    .sort((a, b) => b.cutoffScore - a.cutoffScore);

  for (const row of normalizedRows) {
    const key = dedupeKey(row);
    if (!selected.has(key)) {
      selected.set(key, row);
    }

    if (selected.size >= limit) {
      break;
    }
  }

  return [...selected.values()];
}

export function buildStateCutoffsUrl(query: NormalizedBotCutoffQuery) {
  const params = new URLSearchParams({
    percentile: String(query.percentile),
    year: String(query.year),
    round: String(query.round),
    categories: query.categoryCodes.join(","),
  });

  if (query.branchGroup.courses.length > 0) {
    params.set("courses", query.branchGroup.courses.join(","));
  }

  return `https://deetnuts.com/mht-cet/state-cutoffs?${params.toString()}`;
}

export async function fetchBotStateCutoffRows(
  query: NormalizedBotCutoffQuery,
): Promise<{ rows: RawStateCutoffRow[]; totalMatched: number }> {
  const supabase = createAdminClient();
  const collectionName = getCollectionForRound(query.round, query.year);
  const overfetchLimit = Math.max(
    query.limit * query.categoryCodes.length * 2,
    50,
  );

  let request = supabase
    .from(collectionName)
    .select(
      "id,college_code,college_name,course_name,category,cutoff_score,last_rank,home_university",
      { count: "exact" },
    )
    .gte("cutoff_score", 0)
    .lte("cutoff_score", query.percentile)
    .in("category", [...query.categoryCodes])
    .order("cutoff_score", { ascending: false });

  if (query.branchGroup.courses.length > 0) {
    request = request.in("course_name", [...query.branchGroup.courses]);
  }

  const { data, error, count } = await request.limit(overfetchLimit);

  if (error) {
    const message = error.message || "Failed to query cutoff data";
    const code =
      error.code === "42P01" || message.includes("does not exist")
        ? "DATA_UNAVAILABLE"
        : "QUERY_FAILED";
    throw new BotCutoffError(code, message, { cause: error });
  }

  return {
    rows: (data ?? []) as RawStateCutoffRow[],
    totalMatched: count ?? data?.length ?? 0,
  };
}

export async function queryBotStateCutoffs(
  input: BotCutoffQueryInput,
  options: { fetchRows?: FetchBotCutoffRows } = {},
): Promise<BotCutoffResult> {
  const query = normalizeBotCutoffQuery(input);
  const fetchRows = options.fetchRows ?? fetchBotStateCutoffRows;
  const { rows, totalMatched } = await fetchRows(query);

  return {
    query: {
      percentile: query.percentile,
      year: query.year,
      round: query.round,
      roundLabel: getDisplayNameForRound(query.round),
      categoryGroup: query.categoryGroup.label,
      category: query.categoryGroup.id,
      subcategoryGroup: query.subcategoryGroup.label,
      subcategory: query.subcategoryGroup.id,
      courseGroup: query.branchGroup.label,
      course: query.branchGroup.id,
      branchGroup: query.branchGroup.label,
      branch: query.branchGroup.id,
    },
    rows: selectTopUniqueCutoffRows(rows, query.limit, query.branchGroup),
    totalMatched,
    sourceUrl: buildStateCutoffsUrl(query),
  };
}
