"use client";

import { usePathname } from "next/navigation";

export default function RouteAwareHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (/^\/mht-cet\/colleges\/[^/]+\/?$/.test(pathname)) return null;
  return children;
}
