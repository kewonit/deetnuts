import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/Navbar";
import DiscordHeader from "@/components/DiscordHeader";
import Footer from "@/components/footer";
import { GoogleAnalytics } from "@next/third-parties/google";
import GrainEffect from "@/components/graineffect";
import { Suspense } from "react";
import Loading from "./loading";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import MotionWrapper from "@/components/MotionWrapper";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import SiteJsonLd from "@/components/SiteJsonLd";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "DEETNUTS - College Data Simplified",
    template: "%s | DEETNUTS",
  },
  description:
    "Mildly important data related to colleges simplified. Explore JoSAA cutoffs for IITs, NITs, IIITs, MHT-CET cutoffs, NIRF rankings, and admission trends.",
  metadataBase: new URL("https://deetnuts.com"),
  keywords: [
    "JoSAA",
    "JEE Advanced",
    "JEE Main",
    "MHT-CET",
    "IIT cutoffs",
    "NIT cutoffs",
    "IIIT cutoffs",
    "engineering admission",
    "college cutoffs",
    "NIRF rankings",
    "seat matrix",
  ],
  authors: [{ name: "DEETNUTS" }],
  creator: "DEETNUTS",
  publisher: "DEETNUTS",
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
  openGraph: {
    title: "DEETNUTS - College Data Simplified",
    description:
      "Explore JoSAA cutoffs for IITs, NITs, IIITs, MHT-CET cutoffs, NIRF rankings, and admission trends.",
    url: "https://deetnuts.com",
    siteName: "DEETNUTS",
    images: [
      {
        url: "https://res.cloudinary.com/dfyrk32ua/image/upload/v1722186653/deetnuts/preview_o5ykn7.png",
        width: 1200,
        height: 630,
        alt: "DEETNUTS - Mildly important college data simplified",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DEETNUTS - College Data Simplified",
    description:
      "Explore JoSAA cutoffs for IITs, NITs, IIITs, MHT-CET cutoffs, NIRF rankings, and admission trends.",
    images: [
      "https://res.cloudinary.com/dfyrk32ua/image/upload/v1722186653/deetnuts/preview_o5ykn7.png",
    ],
    creator: "@deetnuts",
  },
  alternates: {
    canonical: "https://deetnuts.com",
  },
  icons: {
    icon: "/favicon.ico",
  },
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#E4DFF2]">
      <head>
        <SiteJsonLd />
      </head>
      <body
        className={`${inter.className} relative min-h-screen overflow-x-hidden`}
      >
        <NuqsAdapter>
          <Navbar>
            <DiscordHeader />
          </Navbar>
          <Suspense fallback={<Loading />}>
            <MotionWrapper>
              <NextTopLoader
                color="#C7A1FE"
                initialPosition={0.08}
                crawlSpeed={200}
                height={5}
                crawl={true}
                showSpinner={false}
                easing="ease"
                speed={200}
                shadow="0 0 20px #C7A1FE,0 0 15px #C7A1FE"
              />
              {children}
            </MotionWrapper>
          </Suspense>
          <Toaster />
          <SonnerToaster position="top-right" richColors closeButton />
          <GrainEffect />
          <GoogleAnalytics gaId="G-PF9S037SJQ" />
          <Footer />
          <div className="fixed bottom-0 left-0 right-0 z-50"></div>
        </NuqsAdapter>
      </body>
    </html>
  );
}
