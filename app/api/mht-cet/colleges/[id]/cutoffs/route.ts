import { NextResponse } from "next/server";
import { getPocketBase } from "@/lib/pocketbaseClient";
import { CutoffData } from "@/lib/college-data";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const { id } = params;
    const pb = getPocketBase();
    const collegeId = id;

    // The college ID in the slug might not be padded.
    // The college_code in the cutoffs table is padded to 5 digits.
    const paddedCollegeCode = collegeId.padStart(5, "0");

    const records = await pb
      .collection("2024_mht_cet_round_one_cutoffs_duplicate")
      .getFullList({
        filter: `college_code = "${paddedCollegeCode}"`,
      });

    const cutoffs = records as unknown as CutoffData[];

    return NextResponse.json({ cutoffs });
  } catch (error: any) {
    console.error("Error fetching cutoff data:", error);
    return new NextResponse(
      JSON.stringify({
        message: "Failed to fetch cutoff data",
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
