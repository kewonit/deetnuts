import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCutoffRecords } from "../../../mht-cet/state-cutoffs/actions";
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

const ANONYMOUS_API_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

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
  try {
    const body = await request.json();
    const isAuthenticated = await isRequestAuthenticated();
    const currentAnonymousRequestCount = parseAnonymousUsageCount(
      request.cookies.get(ANONYMOUS_STATE_CUTOFF_API_COOKIE)?.value,
      ANONYMOUS_STATE_CUTOFF_API_REQUEST_LIMIT,
    );

    if (
      !isAuthenticated &&
      currentAnonymousRequestCount >= ANONYMOUS_STATE_CUTOFF_API_REQUEST_LIMIT
    ) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          loginRequired: true,
          message: "Please login to continue using state cutoffs.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
      response.cookies.set(
        ANONYMOUS_STATE_CUTOFF_API_COOKIE,
        String(currentAnonymousRequestCount),
        ANONYMOUS_API_COOKIE_OPTIONS,
      );
      return response;
    }

    const {
      page = 1,
      perPage = 25,
      search = "",
      categories = [],
      courses = [],
      statuses = [],
      homeUniversities = [],
      percentileInput = "",
      round = 1,
      year = 2025, // Add year to destructuring
      sortBy = "last_rank",
      sortOrder = "desc",
    } = body;

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

    // Call the server action
    const result = await getCutoffRecords(
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

    const response = NextResponse.json(result);

    if (isAuthenticated) {
      response.cookies.set(ANONYMOUS_STATE_CUTOFF_API_COOKIE, "", {
        ...ANONYMOUS_API_COOKIE_OPTIONS,
        maxAge: 0,
      });
    } else {
      response.cookies.set(
        ANONYMOUS_STATE_CUTOFF_API_COOKIE,
        String(currentAnonymousRequestCount + 1),
        ANONYMOUS_API_COOKIE_OPTIONS,
      );
    }

    return response;
  } catch (error: unknown) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch cutoff data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
