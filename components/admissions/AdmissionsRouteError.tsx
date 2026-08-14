"use client";

import Link from "next/link";
import { CircleAlert, RefreshCw } from "lucide-react";

export default function AdmissionsRouteError({
  reset,
  backPath,
  backLabel,
}: {
  reset: () => void;
  backPath: string;
  backLabel: string;
}) {
  return (
    <main data-admissions-full-page="true" className="admissions-surface min-h-screen bg-[#f6f7fb] px-4 py-16">
      <section className="admissions-panel mx-auto max-w-xl p-6 sm:p-8">
        <CircleAlert aria-hidden="true" className="h-10 w-10 text-amber-700" />
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
          Official data is temporarily unavailable
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          The page exists, but its source could not be loaded. We have not replaced the missing records with empty or estimated values.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-slate-950 bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Try again
          </button>
          <Link
            href={backPath}
            className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          >
            {backLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
