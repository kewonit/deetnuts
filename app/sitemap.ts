import { MetadataRoute } from "next";
import { getJeeSeoRoutes } from "@/lib/jee-cutoffs/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return (await getJeeSeoRoutes())
    .filter((route) => route.indexable && ["entry", "directory", "hub"].includes(route.routeType))
    .map((route) => ({
      url: `https://deetnuts.com${route.path}`,
      lastModified: route.lastChangedAt,
    }));
}
