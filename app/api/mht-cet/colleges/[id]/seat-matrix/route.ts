import { NextResponse } from "next/server";
import {
  ClientResponseError,
  getPocketBase,
} from "@/lib/pocketbaseClient";
import { parseCollegeSlug } from "@/lib/slugify";

// Type definitions
interface SeatMatrixRecord {
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

interface College {
  id: string;
  college_id: number;
  college_name: string;
  status: string;
  home_university: string;
  created: string;
  updated: string;
}

// Function to normalize college codes for comparison
function normalizeCollegeCode(code: string | number): string {
  return String(code).padStart(4, "0");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;

  try {
    const pb = getPocketBase();

    const { id } = parseCollegeSlug(resolvedParams.id);

    // First get the college by college_id field (not the record ID)
    let college: College;
    try {
      college = (await pb
        .collection("2024_mht_cet_colleges")
        .getFirstListItem(`college_id=${id}`)) as College;
    } catch (collegeError) {
      if (
        collegeError instanceof ClientResponseError &&
        collegeError.status === 404
      ) {
        return NextResponse.json(
          { message: "College not found" },
          { status: 404 },
        );
      }
      throw collegeError;
    }

    const normalizedCollegeId = normalizeCollegeCode(college.college_id);

    // Try multiple filter strategies to find seat matrix data
    let seatMatrixRecords: SeatMatrixRecord[] = [];
    // Always match seat matrix by normalized college code (ignore leading zeros)
    try {
      seatMatrixRecords = (await pb
        .collection("2024_mht_cet_colleges_seat_matrix")
        .getFullList({
          // Match college_code by its raw string form or with a leading zero, to handle variations like '5380' and '05380'
          filter: `college_code="${String(college.college_id)}" || college_code="0${String(college.college_id)}"`,
          sort: "course_name,choice_code",
        })) as SeatMatrixRecord[];
    } catch (error) {
      console.warn(
        "Seat matrix fetch by normalized college_code failed:",
        error,
      );
    }

    return NextResponse.json({
      seatMatrix: seatMatrixRecords,
      college: college,
      matchInfo: {
        totalRecords: seatMatrixRecords.length,
        collegeId: college.college_id,
        normalizedCollegeId: normalizedCollegeId,
        collegeName: college.college_name,
      },
    });
  } catch (error: unknown) {
    if (error instanceof ClientResponseError) {
      return NextResponse.json(
        { message: "Failed to fetch seat matrix", error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      {
        message: "An unexpected error occurred",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
