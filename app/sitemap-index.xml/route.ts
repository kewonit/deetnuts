import { NextResponse } from "next/server";
import { getJeeSeoRoutes } from "@/lib/jee-cutoffs/seo";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

export const dynamic = "force-static";

const indexableShardTypes = new Set(["year", "program", "profile"]);

export async function GET() {
  const routes = await getJeeSeoRoutes();
  const shardDates = new Map<string, string>();
  for (const route of routes) {
    if (!route.indexable || !route.examId || !route.year || !indexableShardTypes.has(route.routeType)) continue;
    const location = `${PRODUCTION_SITE_URL}/sitemaps/${route.examId}/${route.year}`;
    const currentDate = shardDates.get(location);
    if (!currentDate || route.lastChangedAt > currentDate) shardDates.set(location, route.lastChangedAt);
  }
  const coreDate = routes
    .filter((route) => route.indexable && ["entry", "directory", "hub"].includes(route.routeType))
    .reduce((latest, route) => (route.lastChangedAt > latest ? route.lastChangedAt : latest), "");
  const sitemaps = [
    { location: `${PRODUCTION_SITE_URL}/sitemap.xml`, lastModified: coreDate },
    ...Array.from(shardDates, ([location, lastModified]) => ({ location, lastModified })).sort((left, right) =>
      left.location.localeCompare(right.location),
    ),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps.map(({ location, lastModified }) => `  <sitemap><loc>${location}</loc><lastmod>${lastModified}</lastmod></sitemap>`).join("\n")}\n</sitemapindex>\n`;
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
