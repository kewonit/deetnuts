import { Metadata } from "next";
import FAQJsonLd, { PREDICTIONS_FAQS } from "@/components/FAQJsonLd";

export const metadata: Metadata = {
  title: "JEE Main 2026 Cutoff Predictions | AI-Powered College Predictor",
  description:
    "Get accurate AI-powered predictions for JEE Main 2026 cutoffs for IITs, NITs, IIITs, and GFTIs. Compare predicted ranks with 2025 data and find your ideal engineering college with our comprehensive prediction tool.",
  keywords: [
    "JEE Main 2026",
    "JEE Main predictions",
    "JEE cutoff predictor",
    "IIT cutoff 2026",
    "NIT cutoff predictions",
    "IIIT cutoff 2026",
    "GFTI cutoff predictions",
    "engineering college predictor",
    "JEE rank predictor",
    "JEE Main 2026 cutoff",
    "college admission predictor",
    "JEE Main AI predictor",
    "engineering admission 2026",
    "JoSAA predictions",
    "college cutoff trends",
    "JEE Main rank analysis",
    "engineering college rankings",
    "IIT admission predictor",
    "NIT admission predictor",
    "JEE counseling 2026",
  ],
  authors: [{ name: "DEETNUTS" }],
  openGraph: {
    title: "JEE Main 2026 Cutoff Predictions | AI-Powered College Predictor",
    description:
      "Predict your chances of admission to IITs, NITs, IIITs with AI-powered JEE Main 2026 cutoff predictions. Compare with 2025 data and make informed decisions.",
    url: "https://deetnuts.com/predictions",
    siteName: "DEETNUTS",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://res.cloudinary.com/dfyrk32ua/image/upload/v1722072593/deetnuts/2_m51gsx.png",
        width: 1200,
        height: 630,
        alt: "JEE Main 2026 Predictions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JEE Main 2026 Cutoff Predictions",
    description:
      "AI-powered predictions for JEE Main 2026 cutoffs. Find your ideal engineering college.",
    images: [
      "https://res.cloudinary.com/dfyrk32ua/image/upload/v1722072593/deetnuts/2_m51gsx.png",
    ],
    creator: "@kewonit",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://deetnuts.com/predictions",
  },
};

export default function PredictionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FAQJsonLd faqs={PREDICTIONS_FAQS} />
      {children}
    </>
  );
}
