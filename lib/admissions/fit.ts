import "server-only";

import {
  getCachedMhtCetCollegeCutoffs,
  type MhtCetCutoffRow,
} from "@/lib/admissions/data";
import {
  calculatePercentileMargin,
  calculateRankMargin,
  MhtCetAdmissionsProfileSchema,
  type FitRequestV1,
} from "@/lib/admissions/profile";
import type {
  FitObservation,
  FitResponseV1,
  HistoricalFitSummary,
} from "@/lib/admissions/types";
import {
  deriveEligibleSeatPools,
  isAllocationSectionEligible,
} from "@/lib/mht-cet/state-cutoffs/candidate-profile";
import { isRoundAvailableForYear, ROUNDS_BY_YEAR } from "@/lib/mht-cet/state-cutoffs/config";

const MAX_FIT_OBSERVATIONS = 200;

export interface AdmissionsFitRepository {
  getMhtCetCollegeCutoffs(
    collegeId: string,
    year: number,
    round: number,
  ): Promise<MhtCetCutoffRow[]>;
}

const liveRepository: AdmissionsFitRepository = {
  getMhtCetCollegeCutoffs: getCachedMhtCetCollegeCutoffs,
};

function numberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function summarizeHistory(
  observations: FitObservation[],
  candidateYears: number[],
): HistoricalFitSummary | null {
  const years = candidateYears
    .map((year) => {
      const rows = observations.filter((row) => row.year === year);
      const bestMargin =
        rows.length > 0 ? Math.max(...rows.map((row) => row.margin)) : null;
      return {
        year,
        comparable: rows.length > 0,
        cleared: bestMargin !== null && bestMargin >= 0,
        bestMargin,
      };
    })
    .sort((a, b) => b.year - a.year);
  const comparableYears = years.filter((year) => year.comparable).length;
  if (comparableYears === 0) return null;
  return {
    comparableYears,
    clearedYears: years.filter((year) => year.cleared).length,
    years,
  };
}

function fitStatus(
  selected: FitObservation[],
  total: number,
  incomplete = false,
): FitResponseV1["status"] {
  if (incomplete) return "partial";
  if (selected.length === 0) return "no-comparable-data";
  return total > MAX_FIT_OBSERVATIONS ? "partial" : "ok";
}


function isMhtRowEligible(
  row: MhtCetCutoffRow,
  categoryCodes: Set<string>,
  minorityInstituteIds: Set<string>,
  candidate: Parameters<typeof isAllocationSectionEligible>[0],
): boolean {
  if (!categoryCodes.has(row.category)) return false;
  if (
    !isAllocationSectionEligible(
      candidate,
      row.seat_allocation_section,
      row.institute_home_university_id,
    )
  ) {
    return false;
  }
  if (row.category !== "MI") return true;
  return Boolean(
    row.minority_community_id &&
      minorityInstituteIds.has(row.minority_community_id),
  );
}

function mhtFitObservation(
  row: MhtCetCutoffRow,
  year: number,
  round: number,
  scoreMode: "rank" | "percentile",
  score: number,
): FitObservation | null {
  const closing =
    scoreMode === "rank"
      ? numberOrNull(row.last_rank)
      : numberOrNull(row.cutoff_score);
  if (closing === null || (scoreMode === "rank" && closing <= 0)) return null;
  const margin =
    scoreMode === "rank"
      ? calculateRankMargin(score, closing)
      : calculatePercentileMargin(score, closing);
  return {
    id: row.id,
    programId: row.course_code,
    programCode: row.course_code,
    programName: row.course_name,
    seatPool: `${row.category} · ${row.seat_allocation_section}`,
    year,
    round,
    metric: scoreMode,
    candidateValue: score,
    closingValue: closing,
    margin,
    outcome: margin >= 0 ? "cleared" : "missed",
    sourceDocument: row.source_pdf,
    sourcePage: row.source_page,
    sourceUrl: row.source_index_url,
  };
}

async function evaluateMhtCetFit(
  request: FitRequestV1,
  repository: AdmissionsFitRepository,
): Promise<FitResponseV1> {
  if (request.entity.kind !== "college") {
    return {
      status: "no-comparable-data",
      observations: [],
      history: null,
      provenance: {
        sourceName: "Maharashtra State CET Cell",
        year: request.year,
        round: request.round,
      },
    };
  }
  const parsedProfile = MhtCetAdmissionsProfileSchema.safeParse(request.profile);
  if (!parsedProfile.success) throw new TypeError("Invalid MHT-CET profile");
  const profile = parsedProfile.data;
  const derived = deriveEligibleSeatPools(profile.candidate);
  const categories = new Set(derived.categoryCodes);
  const minorities = new Set(derived.minorityInstituteIds);
  const comparableYears = Object.keys(ROUNDS_BY_YEAR)
    .map(Number)
    .filter((year) => isRoundAvailableForYear(request.round, year));
  const yearResults = await Promise.allSettled(
    comparableYears.map(async (year) => ({
      year,
      rows: await repository.getMhtCetCollegeCutoffs(
        request.entity.id,
        year,
        request.round,
      ),
    })),
  );
  const requestedYearResult = yearResults[comparableYears.indexOf(request.year)];
  if (requestedYearResult?.status === "rejected") {
    throw requestedYearResult.reason;
  }
  const rowsByYear = yearResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  const missingHistoryYears = yearResults.flatMap((result, index) =>
    result.status === "rejected" ? [comparableYears[index]] : [],
  );
  const allObservations = rowsByYear.flatMap(({ year, rows }) =>
    rows
      .filter((row) =>
        isMhtRowEligible(
          row,
          categories,
          minorities,
          profile.candidate,
        ),
      )
      .map((row) =>
        mhtFitObservation(
          row,
          year,
          request.round,
          profile.scoreMode,
          profile.score,
        ),
      )
      .filter((row): row is FitObservation => Boolean(row)),
  );
  const selectedAll = allObservations
    .filter((row) => row.year === request.year)
    .sort((a, b) => b.margin - a.margin || a.programName.localeCompare(b.programName));
  const bestSelected = selectedAll[0];
  const exactHistoryObservations = bestSelected
    ? allObservations.filter(
        (observation) =>
          observation.programId === bestSelected.programId &&
          observation.seatPool === bestSelected.seatPool &&
          observation.metric === bestSelected.metric,
      )
    : [];

  return {
    status: fitStatus(
      selectedAll,
      selectedAll.length,
      missingHistoryYears.length > 0,
    ),
    observations: selectedAll.slice(0, MAX_FIT_OBSERVATIONS),
    history: summarizeHistory(exactHistoryObservations, comparableYears),
    provenance: {
      sourceName: "Maharashtra State CET Cell",
      year: request.year,
      round: request.round,
      sourceDocument: selectedAll[0]?.sourceDocument,
      sourcePage: selectedAll[0]?.sourcePage,
      sourceUrl: selectedAll[0]?.sourceUrl,
      note:
        missingHistoryYears.length > 0
          ? `Compared only with exactly eligible category and allocation pools. Historical source data was unavailable for ${missingHistoryYears.join(", ")}.`
          : "Compared only with category and allocation pools derived as exactly eligible from the submitted profile.",
    },
  };
}


export async function evaluateAdmissionsFit(
  request: FitRequestV1,
  repository: AdmissionsFitRepository = liveRepository,
): Promise<FitResponseV1> {
  return evaluateMhtCetFit(request, repository);
}
