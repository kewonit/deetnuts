import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://deetnuts.com";

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
    sitemap: `${baseUrl}/sitemap-index.xml`,
    host: baseUrl,
  };
}
