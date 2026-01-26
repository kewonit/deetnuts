import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MHT-CET State Cutoffs 2024 | College Predictor & Category Codes",
  description:
    "See official MHT-CET 2024 state cutoffs for all Maharashtra engineering colleges. Filter by percentile, category, course, seat type, and university region. Plan your CAP round choices with the most accurate, up-to-date data.",
  keywords: [
    "MHT-CET",
    "MHT CET",
    "state cutoffs",
    "2024",
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
    "mht cet 2024",
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
      "MHT-CET State Cutoffs 2024 | 2025 | College Predictor & Category Codes",
    description:
      "See official MHT-CET 2024 state cutoffs for all Maharashtra engineering colleges. Filter by percentile, category, course, seat type, and university region. Plan your CAP round choices with the most accurate, up-to-date data.",
    url: "https://deetnuts.com/mht-cet/state-cutoffs",
    siteName: "deetnuts.com",
    type: "website",
    images: [
      {
        url: "https://res.cloudinary.com/dfyrk32ua/image/upload/v1722186653/deetnuts/preview_o5ykn7.png",
        width: 512,
        height: 512,
        alt: "MHT-CET State Cutoffs 2024 Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "MHT-CET State Cutoffs 2024 | 2025 | College Predictor & Category Codes",
    description:
      "See official MHT-CET 2024 | 2025 state cutoffs for all Maharashtra engineering colleges. Filter by percentile, category, course, seat type, and university region. Plan your CAP round choices with the most accurate, up-to-date data.",
    images: [
      "https://res.cloudinary.com/dfyrk32ua/image/upload/v1722186653/deetnuts/preview_o5ykn7.png",
    ],
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
