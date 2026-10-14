import { Google_Sans } from "next/font/google";

// Apple devices render SF Pro through the system stack; this covers everyone else.
export const googleSans = Google_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-google-sans",
});

// Popovers, menus and dialogs portal outside .mht, so they bring the tokens and font along.
export const MHT_LAYER = `mht-layer ${googleSans.variable}`;
