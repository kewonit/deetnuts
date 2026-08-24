// components/SiteJsonLd.tsx
// Site-wide structured data for Organization and WebSite schema
import { serializeJsonLd } from "@/lib/json-ld";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

export default function SiteJsonLd() {
  const baseUrl = PRODUCTION_SITE_URL;

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
    sameAs: ["https://x.com/kewonit", "https://discord.gg/xbtqGcQ6SF"],
    description:
      "Mildly important Maharashtra college data simplified. Comprehensive MHT-CET cutoffs, seat matrices, and admission data.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: `${baseUrl}/creators`,
    },
  };

  // WebSite schema
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "DEETNUTS",
    description: "Mildly important data related to colleges simplified",
    inLanguage: "en-IN",
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteData) }}
      />
    </>
  );
}
