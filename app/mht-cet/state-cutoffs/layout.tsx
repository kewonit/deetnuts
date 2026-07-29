import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MHT-CET 2026 State Cutoffs | 2024–2025 Data",
  description:
    "Plan MHT-CET 2026 admissions with historical 2024–2025 state cutoffs. Filter Maharashtra engineering colleges by profile, rank or percentile, course, seat pool, and university.",
  keywords: [
    "MHT-CET",
    "MHT CET",
    "MHT-CET 2026 admissions",
    "state cutoffs",
    "2024–2025",
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
    "mht cet 2024 2025",
    "mht cet cap round",
    "mht cet home university",
    "mht cet other university",
    "mht cet open category",
    "mht cet obc sc st",
    "mht cet cutoff marks",
    "mht cet cutoff percentile",
  ],
  openGraph: {
    title:
      "MHT-CET 2026 State Cutoffs | 2024–2025 Data",
    description:
      "Plan MHT-CET 2026 admissions with historical 2024–2025 state cutoffs filtered by candidate profile, rank or percentile, course, seat pool, and university.",
    url: "https://deetnuts.com/mht-cet/state-cutoffs",
    siteName: "deetnuts.com",
    type: "website",
    images: [
      {
        url: "https://res.cloudinary.com/dfyrk32ua/image/upload/v1722186653/deetnuts/preview_o5ykn7.png",
        width: 512,
        height: 512,
        alt: "MHT-CET historical state cutoffs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "MHT-CET 2026 State Cutoffs | 2024–2025 Data",
    description:
      "Plan MHT-CET 2026 admissions with historical 2024–2025 Maharashtra state cutoffs.",
    images: [
      "https://res.cloudinary.com/dfyrk32ua/image/upload/v1722186653/deetnuts/preview_o5ykn7.png",
    ],
    creator: "@kewonit",
  },
  alternates: {
    canonical: "https://deetnuts.com/mht-cet/state-cutoffs",
  },
  metadataBase: new URL("https://deetnuts.com/"),
};

export default function StateCutoffsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
