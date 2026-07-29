import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://deetnuts.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
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
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/login/",
          "/signup/",
          "/account/",
          "/profile/",
          "/error/",
        ],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/josaa/sitemap.xml`,
      `${baseUrl}/mht-cet/sitemap.xml`,
    ],
    host: baseUrl,
  };
}
