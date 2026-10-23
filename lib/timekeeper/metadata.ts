import type { Metadata } from "next";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";
import { EXAM_COUNTDOWN_PATH, SCHEDULE_VERIFIED } from "./exams";

export function timekeeperMetadata(
  path: string,
  title: string,
  description: string,
  keywords?: string[],
  // Pages with their own opengraph-image must not override it with none.
  shareImage = false,
): Metadata {
  const url = `${PRODUCTION_SITE_URL}${path}`;
  const images = shareImage ? {} : { images: [] };
  return {
    // A short brand keeps the exam name, year and "days left" inside the
    // width search results show before truncating.
    title: { absolute: `${title} | TimeKeeper` },
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "TimeKeeper on Deetnuts",
      type: "website",
      locale: "en_IN",
      ...images,
    },
    twitter: {
      card: shareImage ? "summary_large_image" : "summary",
      title,
      description,
      ...images,
    },
  };
}

export function pageSchema(path: string, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${PRODUCTION_SITE_URL}${path}#page`,
    url: `${PRODUCTION_SITE_URL}${path}`,
    name,
    description,
    dateModified: SCHEDULE_VERIFIED,
    isPartOf: { "@type": "WebSite", "@id": `${PRODUCTION_SITE_URL}/#website` },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: "TimeKeeper", path: EXAM_COUNTDOWN_PATH },
      ...trail,
    ].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${PRODUCTION_SITE_URL}${item.path}`,
    })),
  };
}
