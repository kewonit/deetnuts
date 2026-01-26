import { MetadataRoute } from "next";

const baseUrl = "https://deetnuts.com";

export default function sitemap(): MetadataRoute.Sitemap {
  // Current date for lastModified
  const currentDate = new Date();

  // Core static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/creators`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/datasource`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/compliance/terms-and-conditions`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // MHT-CET section pages
  const mhtCetPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/mht-cet`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/mht-cet/colleges`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/mht-cet/all-india-cutoffs`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mht-cet/state-cutoffs`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // NIRF section pages
  const nirfPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/nirf`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Predictions section
  const predictionsPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/predictions`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
  ];

  // Engineering section
  const engineeringPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/engineering/colleges`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  return [
    ...staticPages,
    ...mhtCetPages,
    ...nirfPages,
    ...predictionsPages,
    ...engineeringPages,
  ];
}
