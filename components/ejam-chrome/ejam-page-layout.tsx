import { Toaster } from "sonner";
import { cn } from "@ejam/ui/lib/utils";
import { EjamThemeBridge } from "./ejam-theme-bridge";
import {
  ibmPlexSans,
  instrumentSans,
  instrumentSerif,
} from "./fonts";
import "./ejam-chrome.css";
import "@/app/jee-cutoffs/cutoffs.css";

export function EjamPageLayout({
  children,
  chrome = "document",
  toaster = false,
  className,
}: {
  children: React.ReactNode;
  chrome?: "document" | "tool";
  toaster?: boolean;
  className?: string;
}) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags -- eJAM's stylesheet is compiled outside Next's Tailwind 3 pipeline. */}
      <link rel="stylesheet" href="/ejam/ui.css" />
      <div
        className={cn(
          "deetnuts-ejam-shell antialiased font-sans",
          chrome === "document" && "jee-cutoff-shell",
          ibmPlexSans.variable,
          instrumentSans.variable,
          instrumentSerif.variable,
          className,
        )}
        data-ejam-chrome={chrome}
        data-ejam-theme-root
        suppressHydrationWarning
      >
        <EjamThemeBridge />
        {children}
        {toaster ? (
          <Toaster
            position="bottom-right"
            toastOptions={{ style: { fontFamily: "var(--font-sans)" } }}
          />
        ) : null}
      </div>
    </>
  );
}
