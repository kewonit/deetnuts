import { NextResponse } from "next/server";

import {
  getCurrentUserOrUnauthorized,
  MhtCetMockTestError,
  submitAttempt,
} from "@/lib/mht-cet/mock-tests/supabase";
import { checkMockTestRateLimit } from "@/lib/mht-cet/mock-tests/rate-limit";

function jsonError(error: MhtCetMockTestError) {
  return NextResponse.json(
    { error: { code: error.code, message: error.message } },
    { status: error.status },
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await params;
    const { user } = await getCurrentUserOrUnauthorized();
    const rateLimit = checkMockTestRateLimit({
      key: `attempt-submit:${user.id}:${attemptId}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.ok) {
      throw new MhtCetMockTestError(
        429,
        "rate_limited",
        `Try again in ${rateLimit.retryAfterSeconds} seconds.`,
      );
    }

    const result = await submitAttempt(attemptId, user.id);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MhtCetMockTestError) {
      return jsonError(error);
    }

    return NextResponse.json(
      {
        error: {
          code: "attempt_submit_failed",
          message: "Could not submit attempt.",
        },
      },
      { status: 500 },
    );
  }
}
