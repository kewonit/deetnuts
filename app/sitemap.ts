import { MetadataRoute } from "next";
import { getJeeSeoRoutes } from "@/lib/jee-cutoffs/seo";
import { generateAllUrls } from "@/lib/sitemap-generator";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [routes, corePages] = await Promise.all([getJeeSeoRoutes(), generateAllUrls()]);
  const urls = new Map(corePages.map((page) => [page.url, page]));
  for (const route of routes
    .filter((route) => route.indexable && ["entry", "directory", "hub"].includes(route.routeType))
  ) {
    urls.set(`https://deetnuts.com${route.path}`, {
      url: `https://deetnuts.com${route.path}`,
      lastModified: route.lastChangedAt,
    });
  }
  return [...urls.values()];
}
