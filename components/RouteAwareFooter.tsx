"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/footer";

const FOOTERLESS_ROUTES = new Set(["/college-predictor"]);

// These routes render MhtFooter from MhtShell, in the section's own theme.
const SHELL_ROUTES = ["/mht-cet", "/jee-cutoffs", "/jee-main", "/jee-advanced", "/josaa", "/creators"];

export default function RouteAwareFooter() {
  const pathname = usePathname();

  if (pathname === "/exam-countdown" || pathname.startsWith("/exam-countdown/")) return null;

  if (SHELL_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return null;

  if (FOOTERLESS_ROUTES.has(pathname)) {
    return null;
  }

  return (
    <div className="site-default-chrome">
      <Footer />
    </div>
  );
}
