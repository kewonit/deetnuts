import { NextResponse } from "next/server";
import { getJeeSeoRoutes } from "@/lib/jee-cutoffs/seo";
import type { JeeExamId } from "@/lib/jee-cutoffs/types";

export const dynamicParams = true;

export function generateStaticParams() {
  return (["jee-main", "jee-advanced"] as const).flatMap((exam) =>
    Array.from({ length: 10 }, (_, index) => ({ exam, year: String(2016 + index) })),
  );
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ exam: string; year: string }> },
) {
  const { exam, year: rawYear } = await context.params;
  const year = Number(rawYear);
  if ((exam !== "jee-main" && exam !== "jee-advanced") || !Number.isInteger(year) || year < 2016 || year > 2025) {
    return new NextResponse("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" } });
  }
  const routes = (await getJeeSeoRoutes()).filter(
    (route) =>
      route.indexable &&
      route.examId === (exam as JeeExamId) &&
      route.year === year &&
      ["year", "program", "profile"].includes(route.routeType),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((route) => `  <url><loc>${escapeXml(`https://deetnuts.com${route.path}`)}</loc><lastmod>${escapeXml(route.lastChangedAt)}</lastmod></url>`).join("\n")}\n</urlset>\n`;
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
