"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/footer";
import { ProductFooter } from "@/components/ejam-chrome/product-footer";

const FOOTERLESS_ROUTES = new Set([
  "/college-predictor",
  "/mht-cet/state-cutoffs",
]);

const JEE_CUTOFF_ROUTES = ["/jee-cutoffs", "/jee-main", "/jee-advanced", "/josaa"];

function isMhtDocumentRoute(pathname: string) {
  if (pathname === "/mht-cet" || pathname === "/mht-cet/") return true;
  return /^\/mht-cet\/colleges\/[^/]+\/?$/.test(pathname);
}

export default function RouteAwareFooter() {
  const pathname = usePathname();

  if (pathname === "/exam-countdown" || pathname.startsWith("/exam-countdown/")) return null;

  if (JEE_CUTOFF_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return <ProductFooter />;
  }

  if (isMhtDocumentRoute(pathname)) {
    return <ProductFooter />;
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
