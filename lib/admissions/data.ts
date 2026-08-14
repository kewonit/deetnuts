import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMhtCetCollegePath } from "@/lib/admissions/canonical";
import type {
  AdmissionsCutoffObservation,
  AdmissionsProgram,
  MhtCetCollegeDetailModel,
  MhtCetCollegeIdentity,
  MhtCetSeatMatrixRow,
} from "@/lib/admissions/types";
import {
  DEFAULT_ROUND,
  DEFAULT_YEAR,
  getCollectionForRound,
  isRoundAvailableForYear,
  ROUNDS_BY_YEAR,
} from "@/lib/mht-cet/state-cutoffs/config";

const MHT_BASE_CUTOFF_FIELDS =
  "id,college_code,college_name,course_code,course_name,category,seat_allocation_section,cutoff_score,last_rank,total_admitted,status,home_university,institute_home_university_id,affiliating_university_id,minority_community_id";
const MHT_2026_PROVENANCE_FIELDS =
  ",source_pdf,source_page,source_pdf_sha256,source_index_url";

export class AdmissionsDataError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAVAILABLE" | "INVALID_SOURCE" = "UNAVAILABLE",
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AdmissionsDataError";
  }
}

export interface MhtCetCutoffRow {
  id: string;
  college_code: string;
  college_name: string;
  course_code: string;
  course_name: string;
  category: string;
  seat_allocation_section: string;
  cutoff_score: number | string | null;
  last_rank: number | string | null;
  total_admitted?: number | null;
  status?: string | null;
  home_university?: string | null;
  institute_home_university_id?: string | null;
  affiliating_university_id?: string | null;
  minority_community_id?: string | null;
  source_pdf?: string | null;
  source_page?: number | null;
  source_pdf_sha256?: string | null;
  source_index_url?: string | null;
}

interface MhtCetMasterCollegeRow {
  id: string;
  college_id: string | number;
  college_name: string;
  status?: string | null;
  home_university?: string | null;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function asFiniteNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mode(values: Array<string | null | undefined>): string | null {
  const counts = new Map<string, number>();
  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  return (
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
    null
  );
}

function mhtCollegeCodes(id: string): string[] {
  const numeric = String(Number(id));
  return [...new Set([numeric, numeric.padStart(4, "0"), numeric.padStart(5, "0")])];
}

export const getCachedMhtCetCollegeCutoffs = unstable_cache(
  async (collegeId: string, year: number, round: number): Promise<MhtCetCutoffRow[]> => {
    if (!isRoundAvailableForYear(round, year)) return [];
    const table = getCollectionForRound(round, year);
    const fields = `${MHT_BASE_CUTOFF_FIELDS}${year >= 2026 ? MHT_2026_PROVENANCE_FIELDS : ""}`;
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from(table)
      .select(fields)
      .in("college_code", mhtCollegeCodes(collegeId))
      .order("course_name")
      .order("category");
    if (error) {
      throw new AdmissionsDataError(
        `MHT-CET ${year} Round ${round} cutoffs are unavailable`,
        "UNAVAILABLE",
        error,
      );
    }
    return (data ?? []) as unknown as MhtCetCutoffRow[];
  },
  ["admissions-v2-mht-college-cutoffs"],
  { revalidate: 60 * 60 },
);

const getCachedMhtCetMasterCollege = unstable_cache(
  async (collegeId: string): Promise<MhtCetMasterCollegeRow | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("2024_mht_cet_colleges")
      .select("id,college_id,college_name,status,home_university")
      .eq("college_id", Number(collegeId))
      .limit(1);
    if (error) {
      throw new AdmissionsDataError("MHT-CET college directory is unavailable", "UNAVAILABLE", error);
    }
    return ((data ?? [])[0] as MhtCetMasterCollegeRow | undefined) ?? null;
  },
  ["admissions-v2-mht-master-college"],
  { revalidate: 60 * 60 * 24 },
);

const getCachedMhtCetSeatMatrix = unstable_cache(
  async (collegeId: string): Promise<MhtCetSeatMatrixRow[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("2024_mht_cet_colleges_seat_matrix")
      .select(
        "id,college_code,choice_code,course_name,seat_type,SI,MS_seats,all_india,institute_seats,minority_seats,CAP_seats,Total",
      )
      .in("college_code", mhtCollegeCodes(collegeId))
      .order("course_name");
    if (error?.code === "42P01") return [];
    if (error) {
      throw new AdmissionsDataError("The 2024 seat matrix is unavailable", "UNAVAILABLE", error);
    }
    return (data ?? []).map((row) => ({
      ...row,
      SI: Number(row.SI) || 0,
      MS_seats: Number(row.MS_seats) || 0,
      all_india: Number(row.all_india) || 0,
      institute_seats: Number(row.institute_seats) || 0,
      minority_seats: Number(row.minority_seats) || 0,
      CAP_seats: Number(row.CAP_seats) || 0,
      Total: Number(row.Total) || 0,
    })) as MhtCetSeatMatrixRow[];
  },
  ["admissions-v2-mht-seat-matrix"],
  { revalidate: 60 * 60 * 24 },
);

function parseCollegeIdentifier(identifier: string): string | null {
  const decoded = safeDecode(identifier).trim();
  const match = decoded.match(/(?:^|-)(\d{1,5})$/);
  if (!match) return null;
  const numeric = Number(match[1]);
  return Number.isInteger(numeric) && numeric > 0 ? String(numeric) : null;
}

function mapMhtObservation(
  row: MhtCetCutoffRow,
  year: number,
  round: number,
): AdmissionsCutoffObservation | null {
  const rank = asFiniteNumber(row.last_rank);
  const percentile = asFiniteNumber(row.cutoff_score);
  const closingValue = rank && rank > 0 ? rank : percentile;
  if (closingValue === null) return null;
  return {
    id: row.id,
    programId: row.course_code,
    programCode: row.course_code,
    programName: row.course_name,
    year,
    round,
    category: row.category,
    allocation: row.seat_allocation_section,
    closingValue,
    metric: rank && rank > 0 ? "rank" : "percentile",
    rankValue: rank,
    percentileValue: percentile,
    sourceDocument: row.source_pdf,
    sourcePage: row.source_page,
    sourceUrl: row.source_index_url,
    sourceHash: row.source_pdf_sha256,
  };
}

export interface MhtCetDetailSelection {
  year?: number;
  round?: number;
}

export const getMhtCetCollegeDetail = cache(
  async (
    identifier: string,
    selection: MhtCetDetailSelection = {},
  ): Promise<MhtCetCollegeDetailModel | null> => {
    const collegeId = parseCollegeIdentifier(identifier);
    if (!collegeId) return null;
    const selectedYear = Object.hasOwn(ROUNDS_BY_YEAR, selection.year || 0)
      ? (selection.year as number)
      : DEFAULT_YEAR;
    const selectedRound = isRoundAvailableForYear(selection.round || 0, selectedYear)
      ? (selection.round as number)
      : selectedYear === DEFAULT_YEAR
        ? DEFAULT_ROUND
        : ROUNDS_BY_YEAR[selectedYear][0];

    const selectedCutoffsPromise = getCachedMhtCetCollegeCutoffs(
      collegeId,
      selectedYear,
      selectedRound,
    );
    const currentCutoffsPromise =
      selectedYear === DEFAULT_YEAR && selectedRound === DEFAULT_ROUND
        ? selectedCutoffsPromise
        : getCachedMhtCetCollegeCutoffs(collegeId, DEFAULT_YEAR, DEFAULT_ROUND);
    const [masterResult, selectedRowsResult, currentRowsResult, seatMatrixResult] = await Promise.allSettled([
      getCachedMhtCetMasterCollege(collegeId),
      selectedCutoffsPromise,
      currentCutoffsPromise,
      getCachedMhtCetSeatMatrix(collegeId),
    ]);
    if (selectedRowsResult.status === "rejected") throw selectedRowsResult.reason;
    if (currentRowsResult.status === "rejected") throw currentRowsResult.reason;
    const selectedRows = selectedRowsResult.value;
    const currentRows = currentRowsResult.value;
    if (
      masterResult.status === "rejected" &&
      currentRows.length === 0 &&
      selectedRows.length === 0
    ) {
      throw masterResult.reason;
    }
    const master = masterResult.status === "fulfilled" ? masterResult.value : null;
    const seatMatrix = seatMatrixResult.status === "fulfilled" ? seatMatrixResult.value : [];
    if (!master && currentRows.length === 0 && selectedRows.length === 0) return null;

    const identityRows = currentRows.length > 0 ? currentRows : selectedRows;
    const college: MhtCetCollegeIdentity = {
      recordId: master?.id,
      collegeId,
      name: mode(identityRows.map((row) => row.college_name)) || master?.college_name || `College ${collegeId}`,
      status: mode(identityRows.map((row) => row.status)) || master?.status || null,
      homeUniversity:
        mode(identityRows.map((row) => row.home_university)) || master?.home_university || null,
    };
    const canonicalName = college.name;
    const programsById = new Map<string, AdmissionsProgram>();
    for (const row of selectedRows) {
      if (!programsById.has(row.course_code)) {
        programsById.set(row.course_code, {
          id: row.course_code,
          code: row.course_code,
          name: row.course_name,
        });
      }
    }
    const observations = selectedRows
      .map((row) => mapMhtObservation(row, selectedYear, selectedRound))
      .filter((row): row is AdmissionsCutoffObservation => Boolean(row));
    const sourceRow = selectedRows.find((row) => row.source_pdf || row.source_index_url);

    return {
      system: "mht-cet",
      kind: "college",
      status:
        master &&
        currentRows.length > 0 &&
        seatMatrixResult.status === "fulfilled" &&
        seatMatrix.length > 0
          ? "ok"
          : "partial",
      canonicalPath: getMhtCetCollegePath(canonicalName, collegeId),
      college,
      programs: [...programsById.values()].sort((a, b) => a.name.localeCompare(b.name)),
      observations,
      seatMatrix,
      availableYears: Object.keys(ROUNDS_BY_YEAR)
        .map(Number)
        .sort((a, b) => b - a),
      availableRounds: [...ROUNDS_BY_YEAR[selectedYear]],
      selectedYear,
      selectedRound,
      provenance: {
        sourceName: "Maharashtra State CET Cell",
        year: selectedYear,
        round: selectedRound,
        sourceDocument: sourceRow?.source_pdf,
        sourcePage: sourceRow?.source_page,
        sourceUrl: sourceRow?.source_index_url,
        sourceHash: sourceRow?.source_pdf_sha256,
        note:
          selectedYear === 2026
            ? "Cutoff rows retain their official PDF, page, and source hash when available."
            : "Older imported cutoff rows may not include row-level source metadata.",
      },
    };
  },
);
