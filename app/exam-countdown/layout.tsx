import type { Metadata } from "next";
import TimekeeperShell from "@/components/timekeeper/TimekeeperShell";
import "@/components/timekeeper/timekeeper.css";

export const metadata: Metadata = {
  applicationName: "TimeKeeper on Deetnuts",
  manifest: "/exam-countdown/manifest.webmanifest",
  icons: {
    icon: "/exam-countdown/favicon.svg",
    apple: "/exam-countdown/icon-192.png",
  },
};

// Hourly regeneration keeps prerendered day counts, next sessions and exam
// cycles current without a deploy.
export const revalidate = 3600;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <TimekeeperShell renderedAt={Date.now()}>{children}</TimekeeperShell>;
}
