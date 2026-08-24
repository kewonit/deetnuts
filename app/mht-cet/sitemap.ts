import { MetadataRoute } from "next";
import { getCanonicalMhtCetCollegePaths } from "@/lib/admissions/proxy-canonical";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

// Force dynamic rendering for sitemap generation
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seoLastUpdated = new Date("2026-08-03T00:00:00.000Z");

  // Static MHT-CET pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${PRODUCTION_SITE_URL}/mht-cet`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${PRODUCTION_SITE_URL}/mht-cet/colleges`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${PRODUCTION_SITE_URL}/mht-cet/all-india-cutoffs`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${PRODUCTION_SITE_URL}/mht-cet/state-cutoffs`,
      lastModified: seoLastUpdated,
    },
  ];

  const collegePages: MetadataRoute.Sitemap =
    getCanonicalMhtCetCollegePaths().map((path) => ({
      url: `${PRODUCTION_SITE_URL}${path}`,
    }));

  return [...staticPages, ...collegePages];
}
