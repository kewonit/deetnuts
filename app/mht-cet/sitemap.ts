import { MetadataRoute } from "next";
import { getCollegesData } from "@/lib/college-data";
import { createCollegeSlug } from "@/lib/slugify";

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

  // Dynamic college pages
  try {
    const colleges = await getCollegesData();

    const collegePages: MetadataRoute.Sitemap = colleges.map((college) => ({
      url: `${baseUrl}/mht-cet/colleges/${createCollegeSlug(college.college_name, college.college_id)}`,
    }));

    return [...staticPages, ...collegePages];
  } catch (error) {
    console.error("Failed to generate MHT-CET college sitemap:", error);
    return staticPages;
  }
}
