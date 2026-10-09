"use client";

import { usePathname } from "next/navigation";

export default function RouteAwareHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/exam-countdown" || pathname.startsWith("/exam-countdown/")) return null;
  return children;
}
