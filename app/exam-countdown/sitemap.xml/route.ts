import { NextResponse } from "next/server";
import { indexablePaths } from "@/lib/timekeeper/exams";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";
export const dynamic = "force-static";
export function GET() {
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + indexablePaths.map((path) => `  <url><loc>${PRODUCTION_SITE_URL}${path}</loc></url>`).join("\n") + "\n</urlset>\n";
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
}
