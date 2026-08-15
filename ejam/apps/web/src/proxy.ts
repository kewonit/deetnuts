import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Query keys that indicate a legacy college predictor share link at `/`. */
const PREDICTOR_QUERY_KEYS = [
  "band",
  "category",
  "category_id",
  "counselling",
  "exam",
  "ews",
  "ews_toggle",
  "filters",
  "gender",
  "gender_id",
  "has_ews_certificate",
  "include_all",
  "quota",
  "rank",
  "seat_type",
  "state",
  "state_of_domicile",
] as const;

function hasPredictorQueryParams(request: NextRequest): boolean {
  for (const key of PREDICTOR_QUERY_KEYS) {
    if (request.nextUrl.searchParams.has(key)) return true;
  }
  return false;
}

export function proxy(request: NextRequest) {
  if (!hasPredictorQueryParams(request)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/college-predictor";
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: ["/"],
};
