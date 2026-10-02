"use client";

import { lazy, Suspense, useEffect, useState } from "react";
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
          <section
            id="fit"
            className="mht-profile-card mht-college-section overflow-hidden rounded-xl border border-zinc-200 p-5"
            aria-live="polite"
          >
            <p className="text-sm text-zinc-500">Loading your private profile form…</p>
          </section>
        }
      >
        <LazyAdmissionsFitPanel {...props} />
      </Suspense>
    );
  }

  return (
    <section
      id="fit"
      className="mht-profile-card mht-college-section overflow-hidden rounded-xl border border-zinc-200"
      aria-labelledby="fit-gate-title"
    >
      <div className="space-y-4 p-5">
        <h2
          id="fit-gate-title"
          className="text-xl text-zinc-800 [font-family:var(--font-serif-display)] italic"
        >
          Compare your exact seat pool
        </h2>
        <p className="text-sm text-zinc-500">
          Compare exact official cutoff pools with factual cleared or missed margins. The saved copy
          stays in this browser or an explicitly shared link.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded="false"
          className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
        >
          Open private profile
        </button>
      </div>
    </section>
  );
}
