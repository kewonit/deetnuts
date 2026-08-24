import { MetadataRoute } from "next";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

const seoLastUpdated = new Date("2026-08-23T00:00:00.000Z");

export type SitemapUrl = MetadataRoute.Sitemap[number];

export async function generateAllUrls(): Promise<SitemapUrl[]> {
  return [
    {
      url: PRODUCTION_SITE_URL,
      lastModified: seoLastUpdated,
    },
    {
      url: `${PRODUCTION_SITE_URL}/creators`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${PRODUCTION_SITE_URL}/datasource`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${PRODUCTION_SITE_URL}/jee-cutoffs`,
    },
    {
      url: `${PRODUCTION_SITE_URL}/compliance`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${PRODUCTION_SITE_URL}/compliance/terms-and-conditions`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${PRODUCTION_SITE_URL}/compliance/privacy-policy`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${PRODUCTION_SITE_URL}/compliance/cookie-policy`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${PRODUCTION_SITE_URL}/compliance/data-sources-and-licensing`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${PRODUCTION_SITE_URL}/compliance/automated-access`,
      lastModified: seoLastUpdated,
    },
    {
      url: `${PRODUCTION_SITE_URL}/compliance/open-source-notices`,
      lastModified: seoLastUpdated,
    },
  ];
}

export async function generateSitemap(): Promise<MetadataRoute.Sitemap> {
  return generateAllUrls();
}
