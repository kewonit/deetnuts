import type { Metadata } from "next";
import "./globals.css";

import SiteJsonLd from "@/components/SiteJsonLd";
import StandardSiteShell from "@/components/StandardSiteShell";

export const metadata: Metadata = {
  applicationName: "DEETNUTS",
  title: {
    default: "DEETNUTS - College Data Simplified",
    template: "%s | DEETNUTS",
  },
  description:
    "Mildly important Maharashtra college data simplified. Explore MHT-CET cutoffs, seat matrices, colleges, and admission trends.",
  metadataBase: new URL("https://deetnuts.com"),
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
      "Explore MHT-CET cutoffs, seat matrices, Maharashtra colleges, and admission trends.",
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
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DEETNUTS - College Data Simplified",
    description:
      "Explore MHT-CET cutoffs, seat matrices, Maharashtra colleges, and admission trends.",
    images: [
      "https://res.cloudinary.com/dfyrk32ua/image/upload/v1722186653/deetnuts/preview_o5ykn7.png",
    ],
    creator: "@kewonit",
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
      <body className="relative min-h-screen overflow-x-hidden font-sans">
        <StandardSiteShell>{children}</StandardSiteShell>
      </body>
    </html>
  );
}
