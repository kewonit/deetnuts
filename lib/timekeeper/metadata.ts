import type { Metadata } from "next";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

export function timekeeperMetadata(
  path: string,
  title: string,
  description: string,
  keywords?: string[],
): Metadata {
  const url = `${PRODUCTION_SITE_URL}${path}`;
  return {
    title: { absolute: `${title} | TimeKeeper on Deetnuts` },
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
      images: [],
    },
    twitter: { card: "summary", title, description, images: [] },
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
    isPartOf: { "@type": "WebSite", "@id": `${PRODUCTION_SITE_URL}/#website` },
  };
}
