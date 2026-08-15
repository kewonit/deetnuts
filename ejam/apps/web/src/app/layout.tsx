// .dark is pinned; ejam ships dark-only and resolves shadcn tokens
// against the dark palette declared in globals.css

import type { Metadata } from "next";
import {
  IBM_Plex_Sans,
  Instrument_Sans,
  Instrument_Serif,
} from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AgentationDev } from "@/components/agentation-dev";
import { cn } from "@/lib/utils";

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  display: "swap",
  variable: "--font-serif-display",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: "ejam",
  description: "Open-source tools for students around Indian exams",
  icons: {
    icon: [
      { url: "/identity/favicon.ico", sizes: "any" },
      { url: "/identity/icon.svg", type: "image/svg+xml" },
      { url: "/identity/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/identity/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "dark antialiased",
        ibmPlex.variable,
        instrumentSerif.variable,
        instrumentSans.variable,
        "font-sans",
      )}
    >
      <body suppressHydrationWarning>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <AgentationDev />
      </body>
    </html>
  );
}
