import { MetadataRoute } from "next";
import { getAllInstitutes } from "@/lib/josaa-client";

// Force dynamic rendering for sitemap generation
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://deetnuts.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/josaa`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/josaa/institutes`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/josaa/all-colleges`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/josaa/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/josaa/compare`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/josaa/trends`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Dynamic institute and branch pages
  try {
    const institutes = await getAllInstitutes();

    const institutePages: MetadataRoute.Sitemap = institutes.map((inst) => ({
      url: `${baseUrl}/josaa/institutes/${inst.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Generate branch pages for each institute
    const branchPages: MetadataRoute.Sitemap = institutes.flatMap((inst) =>
      inst.branches.map((branch) => ({
        url: `${baseUrl}/josaa/institutes/${inst.slug}/${branch.short_code || branch.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    );

    return [...staticPages, ...institutePages, ...branchPages];
  } catch (error) {
    console.error("Failed to generate dynamic sitemap pages:", error);
    return staticPages;
  }
}
