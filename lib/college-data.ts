import { ClientResponseError, getPocketBase } from "@/lib/pocketbaseClient";
import { unstable_cache as cache } from "next/cache";
import type { MhtCetCutoffRow } from "@/lib/admissions/data";
import { readLocalMhtCetCutoffArchive } from "@/lib/admissions/local-mht-cet-archive";
import { MHT_CET_HOME_UNIVERSITIES } from "@/lib/mht-cet/state-cutoffs/candidate-profile";
import { DEFAULT_ROUND, DEFAULT_YEAR } from "@/lib/mht-cet/state-cutoffs/config";

export interface College {
  id: string;
  college_id: string;
  college_name: string;
  status: string;
  home_university: string;
}

export interface CutoffData {
  id: string;
  college_code: string;
  college_name: string;
  course_code: string;
  course_name: string;
  category: string;
  seat_allocation_section: string;
  cutoff_score: string;
  last_rank: string;
  total_admitted: number;
  status: string;
  home_university: string;
  created: string;
  updated: string;
}

const getCachedColleges = cache(
  async (): Promise<College[]> => {
    const pb = getPocketBase();
    const records = await pb.collection("2024_mht_cet_colleges").getFullList({
      sort: "college_name",
    });

    return records as unknown as College[];
  },
  ["colleges"],
  { revalidate: 60 * 60 * 24 },
); // Cache for 24 hours

function mostCommon(values: Array<string | null | undefined>): string {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value?.trim();
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

// The cutoff rows repeat each college's identity; the university comes from the
// institute's own id, not the per-seat home university column.
export function summarizeArchiveColleges(rows: MhtCetCutoffRow[]): College[] {
  const byCode = new Map<string, MhtCetCutoffRow[]>();
  for (const row of rows) {
    const code = String(Number(row.college_code));
    const list = byCode.get(code);
    if (list) list.push(row);
    else byCode.set(code, [row]);
  }
  return [...byCode.entries()]
    .map(([code, list]) => {
      const universityId = mostCommon(list.map((row) => row.institute_home_university_id));
      return {
        id: code,
        college_id: code,
        college_name: mostCommon(list.map((row) => row.college_name)),
        status: mostCommon(list.map((row) => row.status)),
        home_university:
          MHT_CET_HOME_UNIVERSITIES.find((option) => option.id === universityId)?.label ?? "",
      };
    })
    .sort((a, b) => a.college_name.localeCompare(b.college_name, "en-IN"));
}

export async function getCollegesData(): Promise<College[]> {
  try {
    return await getCachedColleges();
  } catch (error) {
    // Same offline fallback as the college pages: the bundled current-round archive.
    if (error instanceof ClientResponseError && error.status === 0) {
      const local = readLocalMhtCetCutoffArchive(DEFAULT_YEAR, DEFAULT_ROUND);
      if (local) return summarizeArchiveColleges(local);
    }
    throw error;
  }
}
