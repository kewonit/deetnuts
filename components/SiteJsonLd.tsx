// components/SiteJsonLd.tsx
// Site-wide structured data for Organization and WebSite schema

export default function SiteJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deetnuts.com";

  // Organization schema
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "DEETNUTS",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/favicon.ico`,
      width: 48,
      height: 48,
    },
    sameAs: [
      // Add social media URLs here when available
      // 'https://twitter.com/deetnuts',
      // 'https://discord.gg/deetnuts',
    ],
    description:
      "Mildly important data related to colleges simplified. Comprehensive JoSAA, MHT-CET cutoffs, seat matrix, and admission data for engineering colleges in India.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: `${baseUrl}/creators`,
    },
  };

  // WebSite schema with SearchAction for sitelinks search box
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "DEETNUTS",
    description: "Mildly important data related to colleges simplified",
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/josaa/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
      />
    </>
  );
}
