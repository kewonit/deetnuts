// components/CollegeJsonLd.tsx
// Enhanced structured data for MHT-CET college pages
import { College } from "@/lib/college-data";
import { serializeJsonLd } from "@/lib/json-ld";
import { createCollegeSlug } from "@/lib/slugify";

interface CollegeJsonLdProps {
  college: College;
  slug?: string;
}

export default function CollegeJsonLd({ college, slug }: CollegeJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deetnuts.com";
  const collegeSlug =
    slug || createCollegeSlug(college.college_name, college.college_id);
  const collegeUrl = `${baseUrl}/mht-cet/colleges/${collegeSlug}`;

  // College/University structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    "@id": collegeUrl,
    name: college.college_name,
    url: collegeUrl,
    address: {
      "@type": "PostalAddress",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    },
    description: `${college.college_name} - Use available 2024 MHT-CET cutoffs and seat data to plan 2026 admissions.`,
    ...(college.home_university && {
      parentOrganization: {
        "@type": "EducationalOrganization",
        name: college.home_university,
      },
    }),
  };

  // Breadcrumb structured data
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "MHT-CET",
        item: `${baseUrl}/mht-cet`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Colleges",
        item: `${baseUrl}/mht-cet/colleges`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: college.college_name,
        item: collegeUrl,
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
