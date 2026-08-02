import { Metadata } from "next";
import { serializeJsonLd } from "@/lib/json-ld";

const STATE_CUTOFFS_URL = "https://deetnuts.com/mht-cet/state-cutoffs";
const OFFICIAL_2026_SOURCE_URL =
  "https://fe2026.mahacet.org/StaticPages/frmInstituteWiseAllotmentList?did=2021";

const datasetJsonLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "MHT-CET 2026 CAP Round I State Cutoffs",
  description:
    "A searchable collection of normalized MHT-CET 2026 CAP Round I state cutoff groups derived from the official institute-wise allotment PDFs, with college, course, seat category, closing merit rank, percentile, and admitted-seat counts.",
  url: STATE_CUTOFFS_URL,
  isBasedOn: OFFICIAL_2026_SOURCE_URL,
  dateModified: "2026-08-02",
  temporalCoverage: "2026",
  spatialCoverage: {
    "@type": "Place",
    name: "Maharashtra, India",
  },
  creator: {
    "@type": "Organization",
    name: "DEETNUTS",
    url: "https://deetnuts.com",
  },
  publisher: {
    "@type": "Organization",
    name: "DEETNUTS",
    url: "https://deetnuts.com",
  },
  provider: {
    "@type": "Organization",
    name: "State Common Entrance Test Cell, Maharashtra",
    url: "https://cetcell.mahacet.org/",
  },
  keywords: [
    "MHT-CET 2026",
    "CAP Round I",
    "Maharashtra engineering admissions",
    "college cutoffs",
    "closing merit rank",
    "cutoff percentile",
  ],
  variableMeasured: [
    "College",
    "Course",
    "Seat category",
    "Closing merit rank",
    "Cutoff percentile",
    "Admitted seats",
  ],
};

export const metadata: Metadata = {
  title: "MHT-CET 2026 State Cutoffs | CAP Round I",
  description:
    "Search MHT-CET 2026 CAP Round I state cutoffs derived from official allotment PDFs. Filter by rank, percentile, profile, course, seat pool, and university.",
  keywords: [
    "MHT-CET",
    "MHT CET",
    "MHT-CET 2026 admissions",
    "state cutoffs",
    "2024–2026",
    "engineering colleges",
    "college predictor",
    "percentile",
    "category codes",
    "seat allocation",
    "CAP round",
    "DTE Maharashtra",
    "admission",
    "cutoff list",
    "university region",
    "maharashtra engineering admission",
    "mhtcet cutoffs",
    "mht cet college predictor",
    "mht cet category codes",
    "mht cet seat types",
    "mht cet 2024 2025 2026",
    "mht cet cap round",
    "mht cet home university",
    "mht cet other university",
    "mht cet open category",
    "mht cet obc sc st",
    "mht cet cutoff marks",
    "mht cet cutoff percentile",
  ],
  openGraph: {
    title: "MHT-CET 2026 State Cutoffs | CAP Round I",
    description:
      "Search 2026 CAP Round I state cutoffs derived from official MHT-CET allotment PDFs, with historical 2024–2025 data and candidate-aware filters.",
    url: STATE_CUTOFFS_URL,
    siteName: "DEETNUTS",
    type: "website",
    images: [
      {
        url: "https://res.cloudinary.com/dfyrk32ua/image/upload/v1722186653/deetnuts/preview_o5ykn7.png",
        width: 512,
        height: 512,
        alt: "MHT-CET 2026 CAP Round I state cutoff search",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MHT-CET 2026 State Cutoffs | CAP Round I",
    description:
      "Search 2026 CAP Round I state cutoffs derived from official allotment PDFs, with historical Maharashtra cutoff data.",
    images: [
      "https://res.cloudinary.com/dfyrk32ua/image/upload/v1722186653/deetnuts/preview_o5ykn7.png",
    ],
    creator: "@kewonit",
  },
  alternates: {
    canonical: STATE_CUTOFFS_URL,
  },
  metadataBase: new URL("https://deetnuts.com/"),
};

export default function StateCutoffsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(datasetJsonLd) }}
      />
      {children}
    </>
  );
}
