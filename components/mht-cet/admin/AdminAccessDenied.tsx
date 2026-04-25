import Link from "next/link";
import { ArrowLeft, LogIn, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MhtCetAdminError } from "@/lib/mht-cet/admin/auth";

type AdminAccessDeniedProps = {
  error: MhtCetAdminError;
};

export function AdminAccessDenied({ error }: AdminAccessDeniedProps) {
  const isUnauthorized = error.status === 401;

  return (
    <main className="mx-auto grid min-h-screen max-w-3xl place-items-center px-5 py-24">
      <section className="grid w-full gap-5 rounded-base border-2 border-black bg-white p-6 shadow-base md:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-base border-2 border-black bg-main p-3 shadow-base">
            <ShieldAlert className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="grid gap-2">
            <p className="font-heading text-sm uppercase tracking-normal">
              MHT-CET Admin {error.status}
            </p>
            <h1 className="font-heading text-3xl md:text-4xl">
              Admin access required
            </h1>
            <p className="font-base text-base leading-7 text-black/75">
              {isUnauthorized
                ? "Sign in with an account that has MHT-CET admin access."
                : "Your signed-in account does not have MHT-CET admin access."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {isUnauthorized ? (
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
                Sign in
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="neutral">
            <Link href="/mht-cet/mock-tests">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Mock tests
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
