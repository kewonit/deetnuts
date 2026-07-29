// components/josaa/InstituteJsonLd.tsx
// Structured data for JOSAA institutes for better SEO
import { serializeJsonLd } from "@/lib/json-ld";

interface InstituteJsonLdProps {
  institute: {
    id: string;
    name: string;
    short_name?: string;
    institute_type?: string;
    city?: string;
    state?: string;
    website?: string;
    established_year?: number;
    nirf_rank?: number;
  };
  slug: string;
  branchCount?: number;
}

export default function InstituteJsonLd({
  institute,
  slug,
  branchCount,
}: InstituteJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deetnuts.com";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    "@id": `${baseUrl}/josaa/institutes/${slug}`,
    name: institute.name,
    alternateName: institute.short_name,
    url: `${baseUrl}/josaa/institutes/${slug}`,
    ...(institute.website && { sameAs: [institute.website] }),
    ...(institute.city &&
      institute.state && {
        address: {
          "@type": "PostalAddress",
          addressLocality: institute.city,
          addressRegion: institute.state,
          addressCountry: "IN",
        },
      }),
    ...(institute.established_year && {
      foundingDate: institute.established_year.toString(),
    }),
    ...(institute.nirf_rank &&
      institute.nirf_rank > 0 && {
        award: `NIRF Rank #${institute.nirf_rank}`,
      }),
    ...(branchCount && {
      numberOfStudents: undefined, // We don't have this data
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Engineering Programs",
        numberOfItems: branchCount,
      },
    }),
    description: `${institute.name} (${institute.short_name}) is a ${
      institute.institute_type
    } offering ${
      branchCount || "multiple"
    } engineering programs. View JoSAA cutoffs, admission trends, and branch-wise closing ranks.`,
  };

  // BreadcrumbList for better navigation
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "JoSAA",
        item: `${baseUrl}/josaa`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Institutes",
        item: `${baseUrl}/josaa/institutes`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: institute.short_name || institute.name,
        item: `${baseUrl}/josaa/institutes/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbData) }}
      />
    </>
  );
}

// For the All Colleges directory page
export function DirectoryJsonLd({
  totalInstitutes,
  totalBranches,
}: {
  totalInstitutes: number;
  totalBranches: number;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deetnuts.com";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "JoSAA Engineering Colleges Directory",
    description: `Complete directory of ${totalInstitutes} JoSAA colleges including IITs, NITs, IIITs with ${totalBranches}+ engineering programs.`,
    url: `${baseUrl}/josaa/all-colleges`,
    numberOfItems: totalInstitutes,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Indian Institutes of Technology (IITs)",
        url: `${baseUrl}/josaa/all-colleges#iit`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "National Institutes of Technology (NITs)",
        url: `${baseUrl}/josaa/all-colleges#nit`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Indian Institutes of Information Technology (IIITs)",
        url: `${baseUrl}/josaa/all-colleges#iiit`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Government Funded Technical Institutes (GFTIs)",
        url: `${baseUrl}/josaa/all-colleges#gfti`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
    />
  );
}

// For branch/program pages
export function BranchJsonLd({
  institute,
  branch,
  instituteSlug,
}: {
  institute: { name: string; short_name?: string };
  branch: {
    name: string;
    short_code?: string;
    degree_type?: string;
    duration_years?: number;
  };
  instituteSlug: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deetnuts.com";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: branch.name,
    provider: {
      "@type": "CollegeOrUniversity",
      name: institute.name,
      url: `${baseUrl}/josaa/institutes/${instituteSlug}`,
    },
    ...(branch.degree_type && {
      educationalCredentialAwarded: branch.degree_type,
    }),
    ...(branch.duration_years && {
      timeRequired: `P${branch.duration_years}Y`,
    }),
    url: `${baseUrl}/josaa/institutes/${instituteSlug}/${branch.short_code}`,
    description: `${branch.name} at ${institute.name}. View JoSAA cutoff ranks, historical trends, and admission data.`,
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "JoSAA",
        item: `${baseUrl}/josaa`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Institutes",
        item: `${baseUrl}/josaa/institutes`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: institute.short_name || institute.name,
        item: `${baseUrl}/josaa/institutes/${instituteSlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: branch.name,
        item: `${baseUrl}/josaa/institutes/${instituteSlug}/${branch.short_code}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbData) }}
      />
    </>
  );
}
