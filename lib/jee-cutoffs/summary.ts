import "server-only";

import { PAPER_TWO } from "./labels";
import { buildDefaultSelection, getJeeCutoffCatalog } from "./repository";
import { getCutoffCollegePeaks } from "./year-data";
import type { CutoffSelection, CutoffServingRow, JeeExamId } from "./types";

export interface JeeYearHeadline {
  selection: CutoffSelection;
  // Most and least competitive engineering programs in the default seat pool.
  lowest: CutoffServingRow | null;
  highest: CutoffServingRow | null;
}

// The default seat (JoSAA last round, OPEN, Gender-Neutral, AI before OS before HS) across
// every program of one college-year. Paper 2 programs only count when nothing else exists.
export function summarizeCutoffYear(yearRows: CutoffServingRow[]): JeeYearHeadline {
  const selection = buildDefaultSelection(yearRows);
  const headline = yearRows.filter(
    (row) =>
      row.body === selection.body &&
      row.round === selection.round &&
      row.quota === selection.quota &&
      row.seat_type === selection.seatType &&
      row.gender === selection.gender,
  );
  const engineering = headline.filter((row) => !PAPER_TWO.test(row.degree));
  const ranked = (engineering.length ? engineering : headline).sort(
    (left, right) => left.closing_rank - right.closing_rank,
  );
  return { selection, lowest: ranked[0] ?? null, highest: ranked.at(-1) ?? null };
}

export interface JeePeerCollege {
  id: string;
  name: string;
  path: string;
  program: string;
  closingRank: number;
}

// The colleges whose best closing rank sits nearest on a log scale, within one exam's rank
// list: a JEE Advanced rank never compares with a JEE Main rank.
export async function getCutoffPeers(
  exam: JeeExamId,
  collegeId: string,
  limit = 6,
): Promise<JeePeerCollege[]> {
  const [peaks, catalog] = await Promise.all([
    getCutoffCollegePeaks(exam),
    getJeeCutoffCatalog(),
  ]);
  const own = peaks.get(collegeId);
  if (!own) return [];
  const names = new Map(catalog.colleges.map((college) => [college.id, college.seoName]));
  const distance = (rank: number) => Math.abs(Math.log(rank) - Math.log(own.closingRank));
  return [...peaks.values()]
    .filter((peak) => peak.collegeId !== collegeId && names.has(peak.collegeId))
    .sort((left, right) => distance(left.closingRank) - distance(right.closingRank))
    .slice(0, limit)
    .sort((left, right) => left.closingRank - right.closingRank)
    .map((peak) => ({
      id: peak.collegeId,
      name: names.get(peak.collegeId)!,
      path: `/${exam}/colleges/${peak.collegeId}`,
      program: peak.program,
      closingRank: peak.closingRank,
    }));
}
