import {
  IBM_Plex_Sans,
  Instrument_Sans,
  Instrument_Serif,
} from "next/font/google";
import { Toaster } from "sonner";
import { COLLEGE_PREDICTOR_LCP_PRELOAD } from "@/ejam-ui/lib/static-image";
import { cn } from "@/ejam-ui/lib/utils";
import "./route.css";

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

export default function CollegePredictorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="stylesheet" href="/ejam-ui.css" />
      <link
        rel="preload"
        as="image"
        href={COLLEGE_PREDICTOR_LCP_PRELOAD}
        type="image/webp"
        fetchPriority="high"
      />
      <div
        className={cn(
          "deetnuts-ejam-shell dark min-h-screen bg-background text-foreground antialiased",
          ibmPlex.variable,
          instrumentSerif.variable,
          instrumentSans.variable,
          "font-sans",
        )}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{ style: { fontFamily: "var(--font-sans)" } }}
        />
      </div>
    </>
  );
}
