"use client";

import AdmissionsRouteError from "@/components/admissions/AdmissionsRouteError";

export default function MhtCetDetailError({ reset }: { reset: () => void }) {
  return (
    <AdmissionsRouteError
      reset={reset}
      backPath="/mht-cet/colleges"
      backLabel="Browse MHT-CET colleges"
    />
  );
}
