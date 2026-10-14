"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/footer";
import { ProductFooter } from "@/components/ejam-chrome/product-footer";

const FOOTERLESS_ROUTES = new Set(["/college-predictor"]);

const JEE_CUTOFF_ROUTES = ["/jee-cutoffs", "/jee-main", "/jee-advanced", "/josaa"];

function isMhtCetRoute(pathname: string) {
  return pathname === "/mht-cet" || pathname.startsWith("/mht-cet/");
}

export default function RouteAwareFooter() {
  const pathname = usePathname();

  if (pathname === "/exam-countdown" || pathname.startsWith("/exam-countdown/")) return null;

  if (JEE_CUTOFF_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return <ProductFooter />;
  }

  // MHT-CET pages render MhtFooter from the section layout, in the section's own theme.
  if (isMhtCetRoute(pathname)) return null;

  if (FOOTERLESS_ROUTES.has(pathname)) {
    return null;
  }

  return (
    <div className="site-default-chrome">
      <Footer />
    </div>
  );
}
