import { MetadataRoute } from "next";

const baseUrl = "https://deetnuts.com";
const seoLastUpdated = new Date("2026-07-29T00:00:00.000Z");

export type SitemapUrl = MetadataRoute.Sitemap[number];

export async function generateAllUrls(): Promise<SitemapUrl[]> {
  return [
    {
      url: baseUrl,
      lastModified: seoLastUpdated,
    },
    {
      url: `${baseUrl}/creators`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${baseUrl}/datasource`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${baseUrl}/compliance/terms-and-conditions`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${baseUrl}/compliance/privacy-policy`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${baseUrl}/compliance/cookie-policy`,
      lastModified: seoLastUpdated,
    },
  ];
}

export async function generateSitemap(): Promise<MetadataRoute.Sitemap> {
  return generateAllUrls();
}
