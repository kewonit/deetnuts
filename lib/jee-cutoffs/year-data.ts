import "server-only";

import {
  buildDefaultSelection,
  getCutoffCollegeRows,
  getJeeCutoffCatalog,
} from "./repository";
import { getJeeSeoRoutes } from "./seo";
import type { CounsellingBody, CutoffServingRow, JeeExamId } from "./types";

export interface YearProgram {
  id: string;
  name: string;
  degree: string;
  years: number;
  // The program page is `${yearPath}/programs/${slug}`.
  slug: string | null;
}

export interface YearPool {
  body: CounsellingBody;
  quota: string;
  seatType: string;
  gender: string;
  // The seat-pool page path relative to a program page, e.g. "josaa/all-india/open/gender-neutral".
  suffix: string | null;
}

// [program index, pool index, round, opening rank, closing rank]
export type YearRow = [number, number, number, number, number];

// One college-year, dictionary-encoded so the explorer can filter every view on the client.
export interface JeeYearData {
  programs: YearProgram[];
  pools: YearPool[];
  rows: YearRow[];
}

const poolKey = (
  body: string,
  quota: string,
  seatType: string,
  gender: string,
) => `${body}|${quota}|${seatType}|${gender}`;

export async function getCutoffYearData(
  exam: JeeExamId,
  slug: string,
  year: number,
): Promise<JeeYearData | null> {
  const catalog = await getJeeCutoffCatalog();
  const college = catalog.colleges.find((entry) => entry.id === slug);
  if (!college || college.examId !== exam) return null;
  const rows = (await getCutoffCollegeRows(college)).filter(
    (row) => row.year === year,
  );
  if (rows.length === 0) return null;

  const programSlugs = new Map<string, string>();
  const suffixes = new Map<string, string>();
  for (const route of await getJeeSeoRoutes()) {
    if (
      route.examId !== exam ||
      route.collegeId !== slug ||
      route.year !== year
    )
      continue;
    if (
      route.routeType === "program" &&
      route.offeringId &&
      route.programSlug
    ) {
      programSlugs.set(route.offeringId, route.programSlug);
    }
    if (
      route.routeType === "profile" &&
      route.body &&
      route.quota &&
      route.seatType &&
      route.gender
    ) {
      suffixes.set(
        poolKey(route.body, route.quota, route.seatType, route.gender),
        route.path.split("/").slice(-4).join("/"),
      );
    }
  }

  const programs: YearProgram[] = [];
  const programIndex = new Map<string, number>();
  for (const row of [...rows].sort((a, b) =>
    a.source_program_name.localeCompare(b.source_program_name, "en"),
  )) {
    if (programIndex.has(row.offering_id)) continue;
    programIndex.set(row.offering_id, programs.length);
    programs.push({
      id: row.offering_id,
      name: row.source_program_name,
      degree: row.degree,
      years: row.duration_years,
      slug: programSlugs.get(row.offering_id) ?? null,
    });
  }

  const pools: YearPool[] = [];
  const poolIndex = new Map<string, number>();
  const encoded: YearRow[] = rows.map((row) => {
    const key = poolKey(row.body, row.quota, row.seat_type, row.gender);
    let index = poolIndex.get(key);
    if (index === undefined) {
      index = pools.length;
      poolIndex.set(key, index);
      pools.push({
        body: row.body,
        quota: row.quota,
        seatType: row.seat_type,
        gender: row.gender,
        suffix: suffixes.get(key) ?? null,
      });
    }
    return [
      programIndex.get(row.offering_id)!,
      index,
      row.round,
      row.opening_rank,
      row.closing_rank,
    ];
  });

  return { programs, pools, rows: encoded };
}

export interface CollegePeak {
  collegeId: string;
  year: number;
  closingRank: number;
  program: string;
}

// Architecture and planning seats are allotted on JEE Main Paper 2 ranks, so they never
// rank against engineering programs.
const PAPER_TWO = /arch|plan/i;

function peakFor(
  collegeId: string,
  year: number,
  allRows: CutoffServingRow[],
): CollegePeak | null {
  const rows = allRows.filter((row) => !PAPER_TWO.test(row.degree));
  if (rows.length === 0) return null;
  const selection = buildDefaultSelection(rows);
  let best: CutoffServingRow | null = null;
  for (const row of rows) {
    if (
      row.body !== selection.body ||
      row.round !== selection.round ||
      row.quota !== selection.quota ||
      row.seat_type !== selection.seatType ||
      row.gender !== selection.gender
    )
      continue;
    if (!best || row.closing_rank < best.closing_rank) best = row;
  }
  return best
    ? {
        collegeId,
        year,
        closingRank: best.closing_rank,
        program: best.source_program_name,
      }
    : null;
}

// Each college's most competitive engineering closing rank in its latest year, in the default
// seat pool the college page charts: JoSAA last round, OPEN, Gender-Neutral, AI before OS before HS.
export async function getCutoffCollegePeaks(
  exam?: JeeExamId,
): Promise<Map<string, CollegePeak>> {
  const catalog = await getJeeCutoffCatalog();
  const peaks = new Map<string, CollegePeak>();
  for (const college of catalog.colleges) {
    if (exam && college.examId !== exam) continue;
    const year = Math.max(...college.pages.map((page) => page.year));
    const rows = (await getCutoffCollegeRows(college)).filter(
      (row) => row.year === year,
    );
    const peak = peakFor(college.id, year, rows);
    if (peak) peaks.set(college.id, peak);
  }
  return peaks;
}
