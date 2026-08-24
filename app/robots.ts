import { MetadataRoute } from "next";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/jee-cutoffs", "/jee-main/", "/jee-advanced/", "/"],
      disallow: [
        "/api/",
        "/auth/",
        "/login/",
        "/signup/",
        "/account/",
        "/profile/",
        "/error/",
        "/private/",
      ],
    },
    sitemap: `${PRODUCTION_SITE_URL}/sitemap-index.xml`,
    host: PRODUCTION_SITE_URL,
  };
}
