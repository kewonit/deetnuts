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
          <section id="fit" className="cutoff-info-card" aria-live="polite">
            <p className="cutoff-muted">Loading your private profile form…</p>
          </section>
        }
      >
        <LazyAdmissionsFitPanel {...props} />
      </Suspense>
    );
  }

  return (
    <section id="fit" className="cutoff-info-card" aria-labelledby="fit-gate-title">
      <h2 id="fit-gate-title">Compare your exact seat pool</h2>
      <p>
        Compare exact official cutoff pools with factual cleared or missed margins. The saved copy
        stays in this browser or an explicitly shared link.
      </p>
      <div className="cutoff-actions">
        <button type="button" onClick={() => setOpen(true)} aria-expanded="false" className="cutoff-button cutoff-button-primary">
          Open private profile
        </button>
      </div>
    </section>
  );
}
