import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { getAdmissionsCanonicalRouteDecision } from "@/lib/admissions/proxy-canonical";
import { parseLegacyMhtCetCutoffRoute } from "@/lib/admissions/legacy-route";

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
  return PREDICTOR_QUERY_KEYS.some((key) =>
    request.nextUrl.searchParams.has(key),
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    ["/jee-cutoffs", "/jee-main", "/jee-advanced", "/josaa", "/sitemaps", "/sitemap-index.xml"].some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return NextResponse.next();
  }
  if (pathname === "/" && hasPredictorQueryParams(request)) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/college-predictor";
    return NextResponse.redirect(destination, 301);
  }
  const notFound = () => {
    const destination = { label: "MHT-CET college or cutoff route", href: "/mht-cet/colleges", action: "Browse MHT-CET colleges" };
    return new NextResponse(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Admission detail not found | DEETNUTS</title><style>*{box-sizing:border-box}body{margin:0;background:#f6f7fb;color:#0f172a;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{min-height:100vh;display:grid;place-items:center;padding:2rem 1rem}.panel{width:min(100%,36rem);border:1px solid #dce1e8;background:#fff;padding:clamp(1.5rem,5vw,2.5rem)}.eyebrow{color:#6d28d9;font-size:.75rem;font-weight:800;letter-spacing:.15em;text-transform:uppercase}h1{font-size:clamp(2rem,8vw,3rem);line-height:1.05;letter-spacing:-.035em;margin:.75rem 0 0}p{color:#475569;line-height:1.75;margin:1rem 0 0}a{display:inline-flex;min-height:44px;align-items:center;margin-top:1.75rem;background:#0f172a;color:#fff;padding:.75rem 1.25rem;font-weight:750;text-decoration:none}a:focus-visible{outline:3px solid #7c3aed;outline-offset:3px}</style></head><body><main><section class="panel"><div class="eyebrow">Verified data only · 404</div><h1>${destination.label} not found</h1><p>This URL does not match a verified entity or a supported year and round. We do not substitute a similarly named record.</p><a href="${destination.href}">${destination.action}</a></section></main></body></html>`,
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "text/html; charset=utf-8",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
        },
      },
    );
  };
  const legacyMatch = pathname.match(
    /^\/mht-cet\/all-state-cutoffs\/([^/]+)\/([^/]+)\/?$/,
  );
  if (legacyMatch) {
    const parsed = parseLegacyMhtCetCutoffRoute(legacyMatch[1], legacyMatch[2]);
    if (parsed) {
      const destination = request.nextUrl.clone();
      destination.pathname = "/mht-cet/state-cutoffs";
      destination.search = `?year=${parsed.year}&round=${parsed.round}`;
      return NextResponse.redirect(destination, 308);
    }
    return notFound();
  }

  const canonicalDecision = getAdmissionsCanonicalRouteDecision(pathname);
  if (canonicalDecision?.type === "not-found") {
    return notFound();
  }
  if (canonicalDecision?.type === "redirect") {
    const destination = request.nextUrl.clone();
    destination.pathname = canonicalDecision.pathname;
    return NextResponse.redirect(destination, 308);
  }

  const mhtCetDisabled = process.env.ADMISSIONS_V2_MHT_CET?.toLowerCase() !== "true";
  if (mhtCetDisabled && /^\/mht-cet\/colleges\/[^/]+\/?$/.test(pathname)) {
    return NextResponse.redirect(new URL("/mht-cet/colleges", request.url), 307);
  }

  const isAdmissionsDetail = /^\/mht-cet\/colleges\/[^/]+\/?$/.test(pathname);
  const isEjamPage = pathname === "/college-predictor";
  request.headers.set(
    "x-deetnuts-admissions-detail",
    isAdmissionsDetail ? "1" : "0",
  );
  request.headers.set("x-deetnuts-ejam-page", isEjamPage ? "1" : "0");
  if (isAdmissionsDetail || isEjamPage) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
