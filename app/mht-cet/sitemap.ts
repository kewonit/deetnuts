import { MetadataRoute } from "next";
import { getCollegesData } from "@/lib/college-data";
import { createCollegeSlug } from "@/lib/slugify";

// Force dynamic rendering for sitemap generation
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://deetnuts.com";
  const currentDate = new Date();

  // Static MHT-CET pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/mht-cet`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/mht-cet/colleges`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/mht-cet/all-india-cutoffs`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/mht-cet/state-cutoffs`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // Dynamic college pages
  try {
    const colleges = await getCollegesData();

    const collegePages: MetadataRoute.Sitemap = colleges.map((college) => ({
      url: `${baseUrl}/mht-cet/colleges/${createCollegeSlug(college.college_name, college.college_id)}`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticPages, ...collegePages];
  } catch (error) {
    console.error("Failed to generate MHT-CET college sitemap:", error);
    return staticPages;
  }
}
