import { MetadataRoute } from "next";
import { getAllInstitutes } from "@/lib/josaa-client";

// Force dynamic rendering for sitemap generation
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://deetnuts.com";
  const seoLastUpdated = new Date("2026-07-29T00:00:00.000Z");

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/josaa`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${baseUrl}/josaa/institutes`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${baseUrl}/josaa/all-colleges`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${baseUrl}/josaa/search`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${baseUrl}/josaa/compare`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${baseUrl}/josaa/trends`,
      lastModified: seoLastUpdated,
    },
  ];

  // Dynamic institute and branch pages
  try {
    const institutes = await getAllInstitutes();

    const institutePages: MetadataRoute.Sitemap = institutes.map((inst) => ({
      url: `${baseUrl}/josaa/institutes/${inst.slug}`,
    }));

    // Generate branch pages for each institute
    const branchPages: MetadataRoute.Sitemap = institutes.flatMap((inst) =>
      inst.branches.map((branch) => ({
        url: `${baseUrl}/josaa/institutes/${inst.slug}/${branch.short_code || branch.id}`,
      })),
    );

    return [...staticPages, ...institutePages, ...branchPages];
  } catch (error) {
    console.error("Failed to generate dynamic sitemap pages:", error);
    return staticPages;
  }
}
