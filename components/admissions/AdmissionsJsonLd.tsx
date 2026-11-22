import { serializeJsonLd } from "@/lib/json-ld";
import { getCanonicalUrl } from "@/lib/admissions/canonical";

interface AdmissionsJsonLdProps {
  kind: "college";
  name: string;
  alternateName?: string | string[] | null;
  canonicalPath: string;
  parentName?: string;
  parentPath?: string;
  location?: { city?: string | null; region?: string | null };
  website?: string | null;
  degreeType?: string;
  durationYears?: number;
  // The breadcrumb levels above the college, e.g. MHT-CET → Colleges.
  crumbs: Array<{ name: string; path: string }>;
}

export default function AdmissionsJsonLd(props: AdmissionsJsonLdProps) {
  const canonicalUrl = getCanonicalUrl(props.canonicalPath);
  const alternateName = Array.isArray(props.alternateName)
    ? props.alternateName.length > 0
      ? props.alternateName
      : undefined
    : props.alternateName || undefined;
  const entity = {
          "@context": "https://schema.org",
          "@type": "CollegeOrUniversity",
          "@id": canonicalUrl,
          name: props.name,
          alternateName,
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
      ...props.crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: getCanonicalUrl(crumb.path),
      })),
      {
        "@type": "ListItem",
        position: props.crumbs.length + 1,
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
