"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LoginLink } from "@/components/login-link";
import { AccountMenu } from "@/components/account-menu";

const PUBLIC_STATIC_PREFIXES = ["/jee-cutoffs", "/jee-main", "/jee-advanced", "/josaa"];

interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export default function AuthButton() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    if (PUBLIC_STATIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return;
    }
    const controller = new AbortController();
    void fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((data: { user?: SessionUser | null }) => {
        setUser(data.user || null);
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") setUser(null);
      });
    return () => {
      controller.abort();
    };
  }, [pathname]);

  if (user) {
    return <AccountMenu name={user.name} avatarUrl={user.avatarUrl || "/avatar.webp"} />;
  }

  return (
    <LoginLink className="py-2 px-3 flex rounded-md no-underline bg-btn-background hover:bg-btn-background-hover" />
  );
}
