"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type LoginLinkProps = {
  className?: string;
};

function CurrentPageLoginLink({ className }: LoginLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const redirectTo = `${pathname}${query ? `?${query}` : ""}`;
  const loginParams = new URLSearchParams({ redirect: redirectTo });

  return (
    <Link href={`/login?${loginParams.toString()}`} className={className}>
      Login
    </Link>
  );
}

export function LoginLink({ className }: LoginLinkProps) {
  return (
    <Suspense
      fallback={
        <Link href="/login" className={className}>
          Login
        </Link>
      }
    >
      <CurrentPageLoginLink className={className} />
    </Suspense>
  );
}
