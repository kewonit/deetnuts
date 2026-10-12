import "server-only";

import { unstable_cache } from "next/cache";
import { ClientResponseError, getPocketBase } from "@/lib/pocketbaseClient";
import { getCanonicalMhtCetCollegePath } from "@/lib/admissions/proxy-canonical";
import { readLocalMhtCetCutoffArchive } from "@/lib/admissions/local-mht-cet-archive";
import {
  DEFAULT_ROUND,
  DEFAULT_YEAR,
  getCollectionForRound,
} from "@/lib/mht-cet/state-cutoffs/config";

const OPEN_GENERAL_CODES = ["GOPENS", "GOPENH", "GOPENO"];

interface OpenGeneralRow {
  college_code: string;
  college_name: string;
  course_name: string;
  category: string;
  cutoff_score: number | string | null;
}

export interface MhtCetPeerCollege {
  collegeId: string;
  name: string;
  path: string;
  program: string;
  percentile: number;
}

export function summarizeOpenGeneralPeaks(rows: OpenGeneralRow[]): MhtCetPeerCollege[] {
  const best = new Map<string, MhtCetPeerCollege>();
  for (const row of rows) {
    if (!OPEN_GENERAL_CODES.includes(row.category)) continue;
    const percentile = Number(row.cutoff_score);
    const collegeId = String(Number(row.college_code));
    if (!Number.isFinite(percentile) || collegeId === "NaN") continue;
    const current = best.get(collegeId);
    if (current && current.percentile >= percentile) continue;
    const path = getCanonicalMhtCetCollegePath(collegeId);
    if (!path) continue;
    best.set(collegeId, {
      collegeId,
      name: row.college_name.trim(),
      path,
      program: row.course_name.trim(),
      percentile,
    });
  }
  return [...best.values()];
}

export function pickPeerColleges(
  peaks: MhtCetPeerCollege[],
  collegeId: string,
  limit = 6,
): MhtCetPeerCollege[] {
  const self = peaks.find((peak) => peak.collegeId === String(Number(collegeId)));
  if (!self) return [];
  return peaks
    .filter((peak) => peak.collegeId !== self.collegeId)
    .sort(
      (a, b) =>
        Math.abs(a.percentile - self.percentile) - Math.abs(b.percentile - self.percentile) ||
        a.name.localeCompare(b.name, "en-IN"),
    )
    .slice(0, limit)
    .sort((a, b) => b.percentile - a.percentile || a.name.localeCompare(b.name, "en-IN"));
}

const getCachedOpenGeneralPeaks = unstable_cache(
  async (year: number, round: number): Promise<MhtCetPeerCollege[]> => {
    const rows = await getPocketBase()
      .collection(getCollectionForRound(round, year))
      .getFullList<OpenGeneralRow>({
        fields: "college_code,college_name,course_name,category,cutoff_score",
        filter: OPEN_GENERAL_CODES.map((code) => `category = "${code}"`).join(" || "),
      });
    return summarizeOpenGeneralPeaks(rows);
  },
  ["admissions-v2-mht-open-general-peaks"],
  { revalidate: 60 * 60 },
);

async function getOpenGeneralPeaks(year: number, round: number): Promise<MhtCetPeerCollege[]> {
  try {
    return await getCachedOpenGeneralPeaks(year, round);
  } catch (error) {
    // Same offline fallback as the detail page, outside the persistent cache.
    if (error instanceof ClientResponseError && error.status === 0) {
      const local = readLocalMhtCetCutoffArchive(year, round);
      if (local) return summarizeOpenGeneralPeaks(local);
    }
    throw error;
  }
}

// Related links are a progressive enhancement; the college page renders without them.
export async function getMhtCetPeerColleges(collegeId: string): Promise<MhtCetPeerCollege[]> {
  try {
    return pickPeerColleges(await getOpenGeneralPeaks(DEFAULT_YEAR, DEFAULT_ROUND), collegeId);
  } catch {
    return [];
  }
}
