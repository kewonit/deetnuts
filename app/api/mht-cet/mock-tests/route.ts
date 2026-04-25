import { NextResponse } from "next/server";

import {
  createAttemptWithQuestions,
  getCurrentUserOrUnauthorized,
  loadApprovedQuestionPool,
  MhtCetMockTestError,
  normalizeUnknownMockConfig,
} from "@/lib/mht-cet/mock-tests/supabase";
import { checkMockTestRateLimit } from "@/lib/mht-cet/mock-tests/rate-limit";
import { selectQuestionsForMock } from "@/lib/mht-cet/mock-tests/select-questions";

function jsonError(error: MhtCetMockTestError) {
  return NextResponse.json(
    { error: { code: error.code, message: error.message } },
    { status: error.status },
  );
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUserOrUnauthorized();
    const rateLimit = checkMockTestRateLimit({
      key: `mock-create:${user.id}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.ok) {
      throw new MhtCetMockTestError(
        429,
        "rate_limited",
        `Try again in ${rateLimit.retryAfterSeconds} seconds.`,
      );
    }

    const config = normalizeUnknownMockConfig(await request.json());
    const seed = crypto.randomUUID();
    const pool = await loadApprovedQuestionPool(config);
    const selection = selectQuestionsForMock({ pool, config, seed });

    if (!selection.ok) {
      return NextResponse.json(
        {
          error: {
            code: selection.reason,
            message:
              "Not enough approved questions for this mock configuration.",
            available: selection.available,
            required: selection.required,
          },
        },
        { status: 409 },
      );
    }

    const attemptId = await createAttemptWithQuestions(
      user.id,
      config,
      selection.questions,
      seed,
    );

    return NextResponse.json({ attemptId }, { status: 201 });
  } catch (error) {
    if (error instanceof MhtCetMockTestError) {
      return jsonError(error);
    }

    return NextResponse.json(
      {
        error: {
          code: "mock_create_failed",
          message: "Could not create mock test.",
        },
      },
      { status: 500 },
    );
  }
}
