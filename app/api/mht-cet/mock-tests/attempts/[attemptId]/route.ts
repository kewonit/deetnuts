import { NextResponse } from "next/server";

import {
  getCurrentUserOrUnauthorized,
  loadAttemptForUser,
  MhtCetMockTestError,
} from "@/lib/mht-cet/mock-tests/supabase";

function jsonError(error: MhtCetMockTestError) {
  return NextResponse.json(
    { error: { code: error.code, message: error.message } },
    { status: error.status },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await params;
    const { user } = await getCurrentUserOrUnauthorized();
    const attempt = await loadAttemptForUser(attemptId, user.id);

    return NextResponse.json(attempt);
  } catch (error) {
    if (error instanceof MhtCetMockTestError) {
      return jsonError(error);
    }

    return NextResponse.json(
      {
        error: {
          code: "attempt_load_failed",
          message: "Could not load attempt.",
        },
      },
      { status: 500 },
    );
  }
}
