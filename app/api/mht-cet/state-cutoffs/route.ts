import { after, NextRequest, NextResponse } from "next/server";
import {
  getCutoffRecords,
  getProfiledCutoffRecords,
} from "../../../mht-cet/state-cutoffs/actions";
import { createClient } from "@/app/lib/supabase/server";
import {
  ANONYMOUS_STATE_CUTOFF_API_COOKIE,
  ANONYMOUS_STATE_CUTOFF_API_REQUEST_LIMIT,
  parseAnonymousUsageCount,
} from "@/app/mht-cet/state-cutoffs/anonymous-usage";
import {
  DEFAULT_ROUND,
  isRoundAvailableForYear,
  ROUNDS_BY_YEAR,
} from "@/app/mht-cet/state-cutoffs/constants";
import {
  buildStateCutoffSearchUsageEvent,
  scheduleStateCutoffSearchUsage,
} from "@/lib/mht-cet/state-cutoffs/search-usage";
import {
  getUtf8ByteLength,
  STATE_CUTOFF_MAX_REQUEST_BYTES,
  StateCutoffApiRequestSchema,
} from "@/lib/mht-cet/state-cutoffs/api-request";
import { safeLogBotUsageEvent } from "@/lib/bot/usage";

const ANONYMOUS_API_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

const RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

function jsonResponse(
  body: unknown,
  init?: { status?: number },
): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: RESPONSE_HEADERS,
  });
}

function stripPrivateErrorDetails(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const publicValue = { ...(value as Record<string, unknown>) };
  delete publicValue.details;
  return publicValue;
}

async function isRequestAuthenticated(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    return !error && Boolean(user);
  } catch (error) {
    console.warn(
      "State cutoffs auth check failed; treating as anonymous",
      error,
    );
    return false;
  }
}

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  const requestId = crypto.randomUUID();
  let shouldLogUsage = false;

  const scheduleUsage = (status: "served" | "rejected" | "failed") => {
    if (!shouldLogUsage) {
      return;
    }

    scheduleStateCutoffSearchUsage(
      buildStateCutoffSearchUsageEvent({
        requestId,
        status,
        durationMs: performance.now() - startedAt,
      }),
      after,
      safeLogBotUsageEvent,
    );
  };

  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (
      Number.isFinite(contentLength) &&
      contentLength > STATE_CUTOFF_MAX_REQUEST_BYTES
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Request too large",
          message: "The state cutoff request is too large.",
        },
        { status: 413 },
      );
    }

    const rawBody = await request.text();
    if (getUtf8ByteLength(rawBody) > STATE_CUTOFF_MAX_REQUEST_BYTES) {
      return jsonResponse(
        {
          success: false,
          error: "Request too large",
          message: "The state cutoff request is too large.",
        },
        { status: 413 },
      );
    }

    let untrustedBody: unknown;
    try {
      untrustedBody = JSON.parse(rawBody);
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "Invalid request",
          message: "Send a valid JSON request body.",
        },
        { status: 400 },
      );
    }

    const parsedBody = StateCutoffApiRequestSchema.safeParse(untrustedBody);
    if (!parsedBody.success) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid request",
          message: "Check the submitted cutoff filters and try again.",
          fieldErrors: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      page,
      perPage,
      search,
      categories,
      courses,
      statuses,
      homeUniversities,
      percentileInput,
      scoreMode,
      scoreValue,
      profile,
      round,
      year,
      sortBy,
      sortOrder,
      requestKind,
    } = parsedBody.data;

    shouldLogUsage = requestKind === "search";

    const isAuthenticated = await isRequestAuthenticated();
    const currentAnonymousRequestCount = parseAnonymousUsageCount(
      request.cookies.get(ANONYMOUS_STATE_CUTOFF_API_COOKIE)?.value,
      ANONYMOUS_STATE_CUTOFF_API_REQUEST_LIMIT,
    );

    if (
      !isAuthenticated &&
      currentAnonymousRequestCount >= ANONYMOUS_STATE_CUTOFF_API_REQUEST_LIMIT
    ) {
      const response = jsonResponse(
        {
          success: false,
          error: "Authentication required",
          loginRequired: true,
          message: "Please login to continue using state cutoffs.",
        },
        { status: 401 },
      );
      response.cookies.set(
        ANONYMOUS_STATE_CUTOFF_API_COOKIE,
        String(currentAnonymousRequestCount),
        ANONYMOUS_API_COOKIE_OPTIONS,
      );
      scheduleUsage("rejected");
      return response;
    }

    const sanitizedYear =
      Number.isInteger(year) && ROUNDS_BY_YEAR[year] ? year : 2025;

    // Validate round parameter
    const sanitizedRound =
      Number.isInteger(round) && isRoundAvailableForYear(round, sanitizedYear)
        ? round
        : DEFAULT_ROUND;
    if (sanitizedRound !== round) {
      console.warn(
        `Invalid round ${round} provided in API, using round ${sanitizedRound}`,
      );
    }

    const result = profile
      ? await getProfiledCutoffRecords({
          page,
          perPage,
          search,
          categories,
          courses,
          statuses,
          homeUniversities,
          scoreMode: scoreMode === "rank" ? "rank" : "percentile",
          scoreValue: scoreValue || percentileInput,
          round: sanitizedRound,
          year: sanitizedYear,
          profile,
        })
      : await getCutoffRecords(
          page,
          perPage,
          search,
          categories,
          courses,
          statuses,
          homeUniversities,
          percentileInput,
          sanitizedRound,
          sanitizedYear,
          sortBy,
          sortOrder,
        );

    const response = jsonResponse(stripPrivateErrorDetails(result), {
      status:
        !result.success && "fieldErrors" in result
          ? 400
          : 200,
    });

    if (isAuthenticated) {
      response.cookies.set(ANONYMOUS_STATE_CUTOFF_API_COOKIE, "", {
        ...ANONYMOUS_API_COOKIE_OPTIONS,
        maxAge: 0,
      });
    } else if (requestKind === "search") {
      response.cookies.set(
        ANONYMOUS_STATE_CUTOFF_API_COOKIE,
        String(currentAnonymousRequestCount + 1),
        ANONYMOUS_API_COOKIE_OPTIONS,
      );
    }

    scheduleUsage(result.success ? "served" : "failed");
    return response;
  } catch (error: unknown) {
    console.error("API Route Error:", error);
    scheduleUsage("failed");
    return jsonResponse(
      {
        success: false,
        error: "Failed to fetch cutoff data",
        message: "The cutoff request could not be completed. Try again.",
      },
      { status: 500 },
    );
  }
}
