import "server-only";
import { ClientResponseError, getPocketBase } from "@/lib/pocketbaseClient";
import { getMhtCetCollegeNames } from "@/lib/admissions/college-media";
import { getMhtCetDirectory } from "@/lib/admissions/mht-cet-directory";
import { getCanonicalMhtCetCollegePath } from "@/lib/admissions/proxy-canonical";

export const ALL_INDIA_PER_PAGE = 50;
const MAX_PER_PAGE = 200;
const DEFAULT_SORT = "rank";
const FIELDS =
  "id,rank,percentile,choice_code,institute_code,merit_exam,seat_type,college_code,course_name,college_name,total_admitted";

export type AllIndiaCutoffRow = {
  id: string;
  rank: number;
  percentile: number;
  choice_code: string;
  institute_code: string;
  merit_exam: string;
  seat_type: string;
  course_name: string;
  /** As the college pages spell it. */
  college_name: string;
  college_path: string | null;
  /** Published from 2026 on (derived from the allotment lists). */
  total_admitted: number | null;
};

export type AllIndiaPage = {
  data: AllIndiaCutoffRow[];
  pagination: { page: number; perPage: number; totalPages: number; totalItems: number };
};

function clampPositiveInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseOptionalNumber(value: string | null, integer: boolean): number | null {
  if (!value) return null;
  const parsed = integer ? Number.parseInt(value, 10) : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n|\r/g, "").trim();
}

function normalizeSort(sort: string | null): string {
  const value = sort?.trim();
  if (!value) return DEFAULT_SORT;
  const columns = value.split(",").map((part) => part.trim());
  return columns.every((column) => /^-?[a-zA-Z0-9_]+$/.test(column)) ? value : DEFAULT_SORT;
}

function orderedRange(min: number | null, max: number | null): [number | null, number | null] {
  return min !== null && max !== null && min > max ? [max, min] : [min, max];
}

function buildFilter(params: URLSearchParams): string {
  const filters: string[] = [];
  const search = params.get("search")?.trim();
  if (search) {
    const safe = sanitizeFilterValue(search);
    filters.push(`(course_name ~ "${safe}" || college_name ~ "${safe}" || choice_code ~ "${safe}")`);
  }
  const branch = params.get("branch")?.trim();
  if (branch) filters.push(`course_name ~ "${sanitizeFilterValue(branch)}"`);
  const branches = (params.get("branches") || "")
    .split(",")
    .map(sanitizeFilterValue)
    .filter(Boolean);
  if (branches.length > 0) {
    filters.push(`(${branches.map((item) => `course_name ~ "${item}"`).join(" || ")})`);
  }
  const [minPercentile, maxPercentile] = orderedRange(
    parseOptionalNumber(params.get("minPercentile"), false),
    parseOptionalNumber(params.get("maxPercentile"), false),
  );
  if (minPercentile !== null) filters.push(`percentile >= ${minPercentile}`);
  if (maxPercentile !== null) filters.push(`percentile <= ${maxPercentile}`);
  const [minRank, maxRank] = orderedRange(
    parseOptionalNumber(params.get("minRank"), true),
    parseOptionalNumber(params.get("maxRank"), true),
  );
  if (minRank !== null) filters.push(`rank >= ${minRank}`);
  if (maxRank !== null) filters.push(`rank <= ${maxRank}`);
  const collegeName = params.get("collegeName")?.trim();
  if (collegeName) filters.push(`college_name ~ "${sanitizeFilterValue(collegeName)}"`);
  return filters.join(" && ");
}

let namesByCode: Map<string, string> | null = null;
function displayName(code: string, fallback: string): string {
  if (!namesByCode) {
    namesByCode = new Map(getMhtCetDirectory().map((college) => [String(Number(college.code)), college.name]));
    for (const [id, name] of Object.entries(getMhtCetCollegeNames())) namesByCode.set(id, name);
  }
  return namesByCode.get(code) ?? fallback;
}

/** One page of an All India collection; the names and links are resolved here, not in the browser. */
export async function queryAllIndiaCutoffs(
  collection: string,
  params: URLSearchParams,
): Promise<AllIndiaPage> {
  const page = clampPositiveInt(params.get("page"), 1, 1, 100_000);
  const perPage = clampPositiveInt(params.get("perPage"), ALL_INDIA_PER_PAGE, 1, MAX_PER_PAGE);
  const result = await getPocketBase()
    .collection(collection)
    .getList<Record<string, unknown>>(page, perPage, {
      filter: buildFilter(params),
      sort: normalizeSort(params.get("sort")),
      fields: FIELDS,
    });
  return {
    data: result.items.map((row) => {
      const code = String(Number(row.institute_code ?? row.college_code));
      return {
        id: String(row.id),
        rank: Number(row.rank),
        percentile: Number(row.percentile),
        choice_code: String(row.choice_code ?? ""),
        institute_code: code.padStart(5, "0"),
        merit_exam: String(row.merit_exam ?? ""),
        seat_type: String(row.seat_type ?? "AI"),
        course_name: String(row.course_name ?? ""),
        college_name: displayName(code, String(row.college_name ?? "")),
        college_path: getCanonicalMhtCetCollegePath(code),
        total_admitted:
          row.total_admitted === undefined || row.total_admitted === null || row.total_admitted === ""
            ? null
            : Number(row.total_admitted),
      };
    }),
    pagination: {
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    },
  };
}

export function isAllIndiaUnavailable(error: unknown) {
  return error instanceof ClientResponseError && error.status === 0;
}
