// components/CollegeJsonLd.tsx
import { College } from '@/lib/college-data'; // Assuming you have a College type defined

interface CollegeJsonLdProps {
  college: College;
}

export default function CollegeJsonLd({ college }: CollegeJsonLdProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: college.college_name,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/mht-cet/colleges/${college.id}`, // Assuming college.id is the slug
    // You can add more details here if they are available in your college object
    // "address": {
    //   "@type": "PostalAddress",
    //   "streetAddress": "123 College Ave",
    //   "addressLocality": "City",
    //   "addressRegion": "State",
    //   "postalCode": "12345",
    //   "addressCountry": "IN"
    // },
    // "telephone": "+91-123-456-7890"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
