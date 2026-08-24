import { MetadataRoute } from "next";
import { getJeeSeoRoutes } from "@/lib/jee-cutoffs/seo";
import { generateAllUrls } from "@/lib/sitemap-generator";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [routes, corePages] = await Promise.all([getJeeSeoRoutes(), generateAllUrls()]);
  const urls = new Map(corePages.map((page) => [page.url, page]));
  for (const route of routes
    .filter((route) => route.indexable && ["entry", "directory", "hub"].includes(route.routeType))
  ) {
    urls.set(`${PRODUCTION_SITE_URL}${route.path}`, {
      url: `${PRODUCTION_SITE_URL}${route.path}`,
      lastModified: route.lastChangedAt,
    });
  }
  return [...urls.values()];
}
