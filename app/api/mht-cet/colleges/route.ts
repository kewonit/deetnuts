import { NextResponse } from "next/server";
import { getCollegesData } from "@/lib/college-data";

export async function GET() {
  try {
    const records = await getCollegesData();
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json(
      {
        message: "An unexpected error occurred",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
