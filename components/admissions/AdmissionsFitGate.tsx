"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import type { AdmissionsFitPanelProps } from "@/components/admissions/AdmissionsFitPanel";
import FitSection from "@/components/admissions/FitSection";

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
          <FitSection>
            <div className="mht-card mht-card-body" aria-live="polite">
              <p className="mht-note">Loading your private profile form…</p>
            </div>
          </FitSection>
        }
      >
        <LazyAdmissionsFitPanel {...props} />
      </Suspense>
    );
  }

  return (
    <FitSection>
      <div className="mht-card mht-fit-start">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded="false"
          className="mht-btn mht-btn-primary"
        >
          Start eligibility check
        </button>
        <p className="mht-note">Saved only in this browser, or in a link you choose to share.</p>
      </div>
    </FitSection>
  );
}
