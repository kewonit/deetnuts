import { Metadata } from "next";

/**
 * Shared metadata generators following Vercel best practices
 * Benefits: DRY, consistent SEO, easy maintenance
 */

const SITE_NAME = "DEETNUTS";
const SITE_URL = "https://deetnuts.com";
const DEFAULT_DESCRIPTION =
  "mildly important data related to colleges simplified";

interface PageMetadataOptions {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  keywords?: string[];
}

/**
 * Generate comprehensive metadata for a page
 * Follows Vercel best practices for SEO
 */
export function generatePageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image = "/og-image.png",
  type = "website",
  noindex = false,
  keywords = [],
}: PageMetadataOptions): Metadata {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;
  const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: "@deetnuts",
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * Generate metadata for JOSAA institute pages
 */
export function generateInstituteMetadata(
  instituteName: string,
  instituteShortName: string,
  slug: string,
): Metadata {
  return generatePageMetadata({
    title: `${instituteShortName} Cutoffs - JoSAA`,
    description: `View JoSAA cutoffs, branch comparisons, and historical trends for ${instituteName}. Find opening and closing ranks for all categories.`,
    path: `/josaa/institutes/${slug}`,
    keywords: [
      instituteShortName,
      "JoSAA cutoffs",
      "JEE Advanced",
      "JEE Main",
      "cutoff ranks",
      "admission",
      "engineering colleges",
    ],
  });
}

/**
 * Generate metadata for MHT-CET college pages
 */
export function generateCollegeMetadata(
  collegeName: string,
  slug: string,
): Metadata {
  return generatePageMetadata({
    title: `${collegeName} - MHT-CET Cutoffs`,
    description: `View MHT-CET cutoffs, seat matrix, and admission data for ${collegeName}. Find branch-wise cutoff ranks and trends.`,
    path: `/mht-cet/colleges/${slug}`,
    keywords: [
      "MHT-CET",
      collegeName,
      "cutoffs",
      "Maharashtra",
      "engineering admission",
      "seat matrix",
    ],
  });
}

/**
 * Generate structured data (JSON-LD) for educational organizations
 * Best practice: Helps search engines understand page content
 */
export function generateOrganizationJsonLd(
  name: string,
  url: string,
  address?: {
    city: string;
    state: string;
    country: string;
  },
) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name,
    url,
    address: address
      ? {
          "@type": "PostalAddress",
          addressLocality: address.city,
          addressRegion: address.state,
          addressCountry: address.country,
        }
      : undefined,
  };
}
