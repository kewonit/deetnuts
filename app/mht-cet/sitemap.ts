import { MetadataRoute } from "next";
import { getCanonicalMhtCetCollegePaths } from "@/lib/admissions/proxy-canonical";

// Force dynamic rendering for sitemap generation
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://deetnuts.com";
  const seoLastUpdated = new Date("2026-08-03T00:00:00.000Z");

  // Static MHT-CET pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/mht-cet`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${baseUrl}/mht-cet/colleges`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${baseUrl}/mht-cet/all-india-cutoffs`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${baseUrl}/mht-cet/state-cutoffs`,
      lastModified: seoLastUpdated,
    },
  ];

  const collegePages: MetadataRoute.Sitemap =
    getCanonicalMhtCetCollegePaths().map((path) => ({
      url: `${baseUrl}${path}`,
    }));

  return [...staticPages, ...collegePages];
}
