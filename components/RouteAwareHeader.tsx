"use client";

import { usePathname } from "next/navigation";

// TimeKeeper draws its own header; every other page gets the site navbar.
export default function RouteAwareHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/exam-countdown" || pathname.startsWith("/exam-countdown/")) return null;
  return children;
}
