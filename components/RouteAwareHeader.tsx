"use client";

import { usePathname } from "next/navigation";

function within(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

// TimeKeeper draws its own header; every other page gets the site navbar.
export default function RouteAwareHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (within(pathname, "/exam-countdown")) return null;
  return children;
}

const THEMED_PREFIXES = [
  "/exam-countdown",
  "/mht-cet",
  "/jee-cutoffs",
  "/jee-main",
  "/jee-advanced",
  "/college-predictor",
  "/creators",
];

// The grain belongs to the original site design; pages with their own theme leave it out.
export function RouteAwareGrain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (THEMED_PREFIXES.some((prefix) => within(pathname, prefix))) return null;
  return children;
}
