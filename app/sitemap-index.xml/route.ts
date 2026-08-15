import { NextResponse } from "next/server";

export const dynamic = "force-static";

const exams = ["jee-main", "jee-advanced"] as const;
const years = Array.from({ length: 10 }, (_, index) => 2016 + index);

export function GET() {
  const locations = [
    "https://deetnuts.com/sitemap.xml",
    ...exams.flatMap((exam) => years.map((year) => `https://deetnuts.com/sitemaps/${exam}/${year}`)),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locations.map((location) => `  <sitemap><loc>${location}</loc></sitemap>`).join("\n")}\n</sitemapindex>\n`;
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
