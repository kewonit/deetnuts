"use client";

import AdmissionsRouteError from "@/components/admissions/AdmissionsRouteError";

// Keeps the MHT-CET shell and navbar when a page's data fails to load.
export default function MhtCetError({ reset }: { reset: () => void }) {
  return <AdmissionsRouteError reset={reset} backPath="/mht-cet" backLabel="MHT-CET" />;
}
