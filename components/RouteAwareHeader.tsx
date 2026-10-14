"use client";

import { usePathname } from "next/navigation";

// MHT-CET pages render their own navbar from the section layout.
function hasOwnHeader(pathname: string) {
  return (
    pathname === "/exam-countdown" ||
    pathname.startsWith("/exam-countdown/") ||
    pathname === "/mht-cet" ||
    pathname.startsWith("/mht-cet/")
  );
}

export default function RouteAwareHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (hasOwnHeader(pathname)) return null;
  return children;
}
