"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { ShieldCheck, UserRound } from "lucide-react";
import type { AdmissionsFitPanelProps } from "@/components/admissions/AdmissionsFitPanel";

const LazyAdmissionsFitPanel = lazy(
  () => import("@/components/admissions/AdmissionsFitPanel"),
);

function shouldOpenFromBrowserState(system: AdmissionsFitPanelProps["system"]) {
  const profileKey = `deetnuts:admissions-profile:v1:${system}`;
  const fragmentParts = window.location.hash.replace(/^#/, "").split("&");
  return (
    fragmentParts.includes("fit") ||
    fragmentParts.some((part) => part.startsWith("profile=v1.")) ||
    window.localStorage.getItem(profileKey) !== null
  );
}

export default function AdmissionsFitGate(props: AdmissionsFitPanelProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const revealFromBrowserState = () => {
      if (shouldOpenFromBrowserState(props.system)) setOpen(true);
    };
    revealFromBrowserState();
    window.addEventListener("hashchange", revealFromBrowserState);
    return () => window.removeEventListener("hashchange", revealFromBrowserState);
  }, [props.system]);

  if (open) {
    return (
      <Suspense
        fallback={
          <section id="fit" className="admissions-panel p-5 sm:p-6" aria-live="polite">
            <p className="text-sm font-semibold text-slate-700">Loading your private profile form…</p>
          </section>
        }
      >
        <LazyAdmissionsFitPanel {...props} />
      </Suspense>
    );
  }

  return (
    <section id="fit" className="admissions-panel p-5 sm:p-6" aria-labelledby="fit-gate-title">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-700">
        Historical fit
      </p>
      <h2 id="fit-gate-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
        Compare your exact seat pool
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        Compare exact official cutoff pools with factual cleared or missed margins.
      </p>
      <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex max-w-xl items-start gap-2 text-sm leading-6 text-slate-600">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          The saved copy stays in this browser or an explicitly shared link. Submitted values are sent only to calculate the comparison.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded="false"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
        >
          <UserRound aria-hidden="true" className="h-4 w-4" />
          Open private profile
        </button>
      </div>
    </section>
  );
}
