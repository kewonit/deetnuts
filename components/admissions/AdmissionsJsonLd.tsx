import { serializeJsonLd } from "@/lib/json-ld";
import { getCanonicalUrl } from "@/lib/admissions/canonical";

interface AdmissionsJsonLdProps {
  kind: "college";
  name: string;
  alternateName?: string | null;
  canonicalPath: string;
  parentName?: string;
  parentPath?: string;
  location?: { city?: string | null; region?: string | null };
  website?: string | null;
  degreeType?: string;
  durationYears?: number;
  system: "MHT-CET";
}

export default function AdmissionsJsonLd(props: AdmissionsJsonLdProps) {
  const canonicalUrl = getCanonicalUrl(props.canonicalPath);
  const directoryPath = "/mht-cet/colleges";
  const entity = {
          "@context": "https://schema.org",
          "@type": "CollegeOrUniversity",
          "@id": canonicalUrl,
          name: props.name,
          alternateName: props.alternateName || undefined,
          url: canonicalUrl,
          sameAs: props.website ? [props.website] : undefined,
          address:
            props.location?.city || props.location?.region
              ? {
                  "@type": "PostalAddress",
                  addressLocality: props.location.city || undefined,
                  addressRegion: props.location.region || undefined,
                  addressCountry: "IN",
                }
              : undefined,
        };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: props.system,
        item: getCanonicalUrl("/mht-cet"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Colleges",
        item: getCanonicalUrl(directoryPath),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: props.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(entity) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbs) }}
      />
    </>
  );
}
