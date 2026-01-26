import { getPocketBase } from "@/lib/pocketbaseClient";
import { unstable_cache as cache } from "next/cache";
import { RecordModel } from "pocketbase";

export interface College {
  id: string;
  college_id: string;
  college_name: string;
  status: string;
  home_university: string;
}

export interface SeatMatrixData {
  id: string;
  page_number: string;
  college_code: string;
  college_name: string;
  choice_code: string;
  course_name: string;
  SI: number;
  MS_seats: number;
  minority_seats: number;
  all_india: number;
  institute_seats: number;
  orphan: number;
  CAP_seats: number;
  seat_type: string;
  OPEN_General: number;
  OPEN_Ladies: number;
  SC_General: number;
  SC_Ladies: number;
  ST_General: number;
  ST_Ladies: number;
  VJ_DT_General: number;
  VJ_DT_Ladies: number;
  NTB_General: number;
  NTB_Ladies: number;
  NTC_General: number;
  NTC_Ladies: number;
  NTD_General: number;
  NTD_Ladies: number;
  OBC_General: number;
  OBC_Ladies: number;
  SEBC_General: number;
  SEBC_Ladies: number;
  Total: number;
  PWD_total: number;
  PWD_common_reserved: number;
  DEF_total: number;
  DEF_common_reserved: number;
  EWS_seat: number;
  TFWS_choice_code: string;
  TFWS_seats: number;
  created: string;
  updated: string;
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
    const records: RecordModel[] = await pb
      .collection("2024_mht_cet_colleges")
      .getFullList({
        sort: "college_name",
      });

    // The records from PocketBase are RecordModel, we need to cast them.
    // This is safe if the collection schema matches the College interface.
    return records as unknown as College[];
  },
  ["colleges"],
  { revalidate: 60 * 60 * 24 },
); // Cache for 24 hours

export const getCollegeDetails = cache(
  async (collegeId: string) => {
    const pb = getPocketBase();

    // 1. Fetch college details
    const collegeRecord = await pb
      .collection("2024_mht_cet_colleges")
      .getFirstListItem(`college_id="${collegeId}"`);
    const college = collegeRecord as unknown as College;

    // 2. Pad college_id for other table lookups
    const paddedCollegeCode = collegeId.padStart(5, "0");

    // 3. Fetch seat matrix data
    const seatMatrixRecords = await pb
      .collection("2024_seat_matrix")
      .getFullList({
        filter: `college_code="${paddedCollegeCode}"`,
      });
    const seatMatrix = seatMatrixRecords as unknown as SeatMatrixData[];

    // 4. Fetch cutoff data
    const cutoffRecords = await pb
      .collection("2024_mht_cet_round_one_cutoffs_duplicate")
      .getFullList({
        filter: `college_code="${paddedCollegeCode}"`,
      });
    const cutoffs = cutoffRecords as unknown as CutoffData[];

    return {
      college,
      seatMatrix,
      cutoffs,
    };
  },
  ["collegeDetails"],
  { revalidate: 60 * 60 * 24 },
); // Cache for 24 hours
