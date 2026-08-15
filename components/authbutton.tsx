"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { LoginLink } from "@/components/login-link";
import { AccountMenu } from "@/components/account-menu";

const PUBLIC_STATIC_PREFIXES = ["/jee-cutoffs", "/jee-main", "/jee-advanced", "/josaa"];

export default function AuthButton() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (PUBLIC_STATIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return;
    }
    const supabase = createClient();
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user);
    });
    return () => {
      active = false;
    };
  }, [pathname]);

  if (user) {
    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Account";
    return <AccountMenu name={name} avatarUrl={user.user_metadata?.avatar_url || "/avatar.webp"} />;
  }

  return (
    <LoginLink className="py-2 px-3 flex rounded-md no-underline bg-btn-background hover:bg-btn-background-hover" />
  );
}
