import { getPocketBase } from "@/lib/pocketbaseClient";
import { unstable_cache as cache } from "next/cache";

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

export const getCollegesData = cache(
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
