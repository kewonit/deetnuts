"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/footer";
import { JeeCutoffFooter } from "@/components/jee-cutoffs/JeeCutoffFooter";

const FOOTERLESS_ROUTES = new Set([
  "/college-predictor",
  "/mht-cet/state-cutoffs",
]);

const JEE_CUTOFF_ROUTES = ["/jee-cutoffs", "/jee-main", "/jee-advanced", "/josaa"];

export default function RouteAwareFooter() {
  const pathname = usePathname();

  if (JEE_CUTOFF_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return <JeeCutoffFooter />;
  }

  if (FOOTERLESS_ROUTES.has(pathname)) {
    return null;
  }

  return (
    <div className="site-default-chrome">
      <Footer />
    </div>
  );
}
