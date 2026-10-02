import { MHT_CET_CATEGORY_OPTIONS, MHT_CET_HOME_UNIVERSITIES } from "@/lib/mht-cet/state-cutoffs/candidate-profile";

export const MHT_CET_SEAT_VIEW_STORAGE_KEY = "deetnuts:mht-cet-seat-view:v1";

export const MHT_CET_SEAT_SPECIALS = [
  { value: "none", label: "None" },
  { value: "tfws", label: "TFWS" },
  { value: "ews", label: "EWS" },
  { value: "defence", label: "Defence" },
  { value: "pwd", label: "PWD" },
  { value: "orphan", label: "Orphan" },
] as const;

const CATEGORY_IDS = MHT_CET_CATEGORY_OPTIONS.map((option) => option.value);
const SPECIAL_IDS = MHT_CET_SEAT_SPECIALS.map((option) => option.value);
const UNIVERSITY_IDS = new Set<string>(MHT_CET_HOME_UNIVERSITIES.map((option) => option.id));

const HOME_SCOPE = "Home university";
const OTHER_SCOPE = "Other university";

export type MhtCetSeatCategoryId = (typeof MHT_CET_CATEGORY_OPTIONS)[number]["value"];
export type MhtCetSeatSpecial = (typeof MHT_CET_SEAT_SPECIALS)[number]["value"];

export type MhtCetSeatView = {
  categoryId: MhtCetSeatCategoryId;
  gender: "general" | "ladies";
  homeUniversityId: string | null;
  special: MhtCetSeatSpecial;
};

export const DEFAULT_MHT_CET_SEAT_VIEW: MhtCetSeatView = {
  categoryId: "open",
  gender: "general",
  homeUniversityId: null,
  special: "none",
};

type SeatRow = {
  poolFamily: string;
  poolLabel: string;
  poolScope: string | null;
};

function isCategoryId(value: string): value is MhtCetSeatCategoryId {
  return (CATEGORY_IDS as readonly string[]).includes(value);
}

function isSpecial(value: string): value is MhtCetSeatSpecial {
  return (SPECIAL_IDS as readonly string[]).includes(value);
}

function isLadies(row: SeatRow): boolean {
  return row.poolLabel.split(", ").includes("Ladies");
}

export function parseMhtCetSeatView(raw: string | null): MhtCetSeatView | null {
  if (!raw || raw.length > 2_000) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MhtCetSeatView>;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.categoryId !== "string" || !isCategoryId(parsed.categoryId)) return null;
    if (parsed.gender !== "general" && parsed.gender !== "ladies") return null;
    if (typeof parsed.special !== "string" || !isSpecial(parsed.special)) return null;
    if (parsed.homeUniversityId != null && typeof parsed.homeUniversityId !== "string") return null;
    if (parsed.homeUniversityId && !UNIVERSITY_IDS.has(parsed.homeUniversityId)) return null;
    return {
      categoryId: parsed.categoryId,
      gender: parsed.gender,
      homeUniversityId: parsed.homeUniversityId ?? null,
      special: parsed.special,
    };
  } catch {
    return null;
  }
}

export function seatViewFromCandidate(candidate: {
  categoryId: string;
  ladiesSeatEligible: boolean;
  homeUniversityId?: string | null;
}): MhtCetSeatView | null {
  if (!isCategoryId(candidate.categoryId)) return null;
  const homeUniversityId =
    candidate.homeUniversityId && UNIVERSITY_IDS.has(candidate.homeUniversityId)
      ? candidate.homeUniversityId
      : null;
  return {
    categoryId: candidate.categoryId,
    gender: candidate.ladiesSeatEligible ? "ladies" : "general",
    homeUniversityId,
    special: "none",
  };
}

export function seatCaption(view: MhtCetSeatView): string {
  if (view.special !== "none") {
    return MHT_CET_SEAT_SPECIALS.find((option) => option.value === view.special)?.label ?? view.special;
  }
  const category =
    MHT_CET_CATEGORY_OPTIONS.find((option) => option.value === view.categoryId)?.label ?? view.categoryId;
  return `${category}, ${view.gender === "ladies" ? "Ladies" : "General"}`;
}

export function seatCandidates<T extends SeatRow>(rows: T[], view: MhtCetSeatView): T[] {
  const family = view.special === "none" ? view.categoryId : view.special;
  const inFamily = rows.filter((row) => row.poolFamily === family);
  if (view.special !== "none") {
    const general = inFamily.filter((row) => !isLadies(row));
    return general.length > 0 ? general : inFamily;
  }
  return inFamily.filter((row) => isLadies(row) === (view.gender === "ladies"));
}

function hasHomeSplit(rows: SeatRow[]): boolean {
  return rows.some((row) => row.poolScope === HOME_SCOPE || row.poolScope === OTHER_SCOPE);
}

function statewideRow<T extends SeatRow>(rows: T[]): T | null {
  return (
    rows.find((row) => row.poolScope === "State level") ??
    rows.find((row) => row.poolScope === "Maharashtra state") ??
    (rows.length === 1 ? rows[0] : null)
  );
}

export function matchProgramSeat<T extends SeatRow>(
  rows: T[],
  view: MhtCetSeatView,
  collegeHomeUniversityId: string | null,
): T | null {
  const pool = seatCandidates(rows, view);
  if (pool.length === 0) return null;
  if (!hasHomeSplit(pool)) return statewideRow(pool);

  if (!view.homeUniversityId) {
    return pool.find((row) => row.poolScope === HOME_SCOPE) ?? pool.find((row) => row.poolScope === OTHER_SCOPE) ?? null;
  }

  const atHome = collegeHomeUniversityId != null && view.homeUniversityId === collegeHomeUniversityId;
  return pool.find((row) => row.poolScope === (atHome ? HOME_SCOPE : OTHER_SCOPE)) ?? null;
}

export function seatPlaceLine(
  rows: SeatRow[],
  view: MhtCetSeatView,
  collegeHomeUniversityId: string | null,
): string {
  const pool = seatCandidates(rows, view);
  if (pool.length === 0) return "This seat is not published for this college.";
  if (!hasHomeSplit(pool)) return "This college has one statewide cutoff.";
  if (!view.homeUniversityId) return "Choose your home university.";
  return view.homeUniversityId === collegeHomeUniversityId
    ? "Your home university"
    : "Outside your home university";
}
