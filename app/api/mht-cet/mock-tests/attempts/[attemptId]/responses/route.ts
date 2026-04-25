import { NextResponse } from "next/server";

import {
  getCurrentUserOrUnauthorized,
  MhtCetMockTestError,
  parseAttemptResponseInput,
  upsertAttemptResponse,
} from "@/lib/mht-cet/mock-tests/supabase";
import { checkMockTestRateLimit } from "@/lib/mht-cet/mock-tests/rate-limit";

function jsonError(error: MhtCetMockTestError) {
  return NextResponse.json(
    { error: { code: error.code, message: error.message } },
    { status: error.status },
  );
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await params;
    const { user } = await getCurrentUserOrUnauthorized();
    const rateLimit = checkMockTestRateLimit({
      key: `response-save:${user.id}:${attemptId}`,
      limit: 240,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateLimit.ok) {
      throw new MhtCetMockTestError(
        429,
        "rate_limited",
        `Try again in ${rateLimit.retryAfterSeconds} seconds.`,
      );
    }

    const response = parseAttemptResponseInput(await request.json());
    const result = await upsertAttemptResponse(attemptId, user.id, response);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MhtCetMockTestError) {
      return jsonError(error);
    }

    return NextResponse.json(
      {
        error: {
          code: "response_save_failed",
          message: "Could not save response.",
        },
      },
      { status: 500 },
    );
  }
}
