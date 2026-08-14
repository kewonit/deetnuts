"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/footer";

const FOOTERLESS_ROUTES = new Set([
  "/college-predictor",
  "/mht-cet/state-cutoffs",
]);

export default function RouteAwareFooter() {
  const pathname = usePathname();

  if (FOOTERLESS_ROUTES.has(pathname)) {
    return null;
  }

  return (
    <div className="site-default-chrome">
      <Footer />
    </div>
  );
}
