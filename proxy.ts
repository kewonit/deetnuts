import { NextResponse, type NextRequest } from "next/server";
import { getAdmissionsCanonicalRouteDecision } from "@/lib/admissions/proxy-canonical";
import { parseLegacyMhtCetCutoffRoute } from "@/lib/admissions/legacy-route";
import { parseMhtCetDetailSelection } from "@/lib/admissions/query-state";
import { getJeeCollegeCanonicalRedirectPath } from "@/lib/jee-cutoffs/canonical";
import { getRequestOrigin } from "@/lib/site-url";
import { timekeeperCsp } from "@/lib/timekeeper/csp";

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

const AUTH_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-deetnuts_auth"
    : "deetnuts_auth";
const PROTECTED_ROUTES = ["/account", "/dashboard", "/profile", "/settings"];

function hasPredictorQueryParams(request: NextRequest): boolean {
  return PREDICTOR_QUERY_KEYS.some((key) =>
    request.nextUrl.searchParams.has(key),
  );
}

function redirectUrl(request: NextRequest, pathname: string): URL {
  const destination = new URL(pathname, getRequestOrigin(request.url));
  destination.search = request.nextUrl.search;
  return destination;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/exam-countdown" || pathname.startsWith("/exam-countdown/")) {
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", timekeeperCsp(process.env.TIMEKEEPER_SUPABASE_URL, process.env.NODE_ENV === "production"));
    if ((request.headers.get("host") ?? request.nextUrl.host) !== "www.deetnuts.com") response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  if (
    ["/sitemaps", "/sitemap-index.xml"].some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return NextResponse.next();
  }
  if (pathname === "/" && hasPredictorQueryParams(request)) {
    const destination = redirectUrl(request, "/college-predictor");
    return NextResponse.redirect(destination, 301);
  }
  // Unknown MHT-CET routes render the section's own 404 page; the URL stays as typed.
  const notFound = () => {
    // Same-origin rewrite: the public origin would turn this into an external fetch.
    const destination = request.nextUrl.clone();
    destination.pathname = "/mht-cet/not-found";
    destination.search = "";
    const response = NextResponse.rewrite(destination, { status: 404 });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  };
  const legacyMatch = pathname.match(
    /^\/mht-cet\/all-state-cutoffs\/([^/]+)\/([^/]+)\/?$/,
  );
  if (legacyMatch) {
    const parsed = parseLegacyMhtCetCutoffRoute(legacyMatch[1], legacyMatch[2]);
    if (parsed) {
      const destination = redirectUrl(request, "/mht-cet/state-cutoffs");
      destination.search = `?year=${parsed.year}&round=${parsed.round}`;
      return NextResponse.redirect(destination, 308);
    }
    return notFound();
  }

  const jeeCanonicalPath = getJeeCollegeCanonicalRedirectPath(pathname);
  if (jeeCanonicalPath) {
    return NextResponse.redirect(redirectUrl(request, jeeCanonicalPath), 308);
  }

  const canonicalDecision = getAdmissionsCanonicalRouteDecision(pathname);
  if (canonicalDecision?.type === "not-found") {
    return notFound();
  }
  if (canonicalDecision?.type === "redirect") {
    const destination = redirectUrl(request, canonicalDecision.pathname);
    return NextResponse.redirect(destination, 308);
  }

  if (/^\/mht-cet\/colleges\/[^/]+\/?$/.test(pathname)) {
    const query = request.nextUrl.searchParams;
    if (
      query.getAll("year").length > 1 ||
      query.getAll("round").length > 1 ||
      !parseMhtCetDetailSelection(
        query.get("year") ?? undefined,
        query.get("round") ?? undefined,
      )
    )
      return notFound();
  }

  const mhtCetDisabled =
    process.env.ADMISSIONS_V2_MHT_CET?.toLowerCase() !== "true";
  if (mhtCetDisabled && /^\/mht-cet\/colleges\/[^/]+\/?$/.test(pathname)) {
    return NextResponse.redirect(
      new URL("/mht-cet/colleges", getRequestOrigin(request.url)),
      307,
    );
  }

  const isAdmissionsDetail = /^\/mht-cet\/colleges\/[^/]+\/?$/.test(pathname);
  const isEjamPage =
    pathname === "/college-predictor" ||
    pathname === "/jee-cutoffs" ||
    pathname.startsWith("/jee-cutoffs/") ||
    pathname.startsWith("/jee-main") ||
    pathname.startsWith("/jee-advanced") ||
    pathname === "/mht-cet" ||
    /^\/mht-cet\/colleges\/[^/]+\/?$/.test(pathname);
  request.headers.set(
    "x-deetnuts-admissions-detail",
    isAdmissionsDetail ? "1" : "0",
  );
  request.headers.set("x-deetnuts-ejam-page", isEjamPage ? "1" : "0");
  if (isAdmissionsDetail || isEjamPage) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  if (
    PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) &&
    !request.cookies.has(AUTH_COOKIE_NAME)
  ) {
    const url = new URL("/login", getRequestOrigin(request.url));
    url.searchParams.set("redirect", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers: request.headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
