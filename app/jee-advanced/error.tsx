"use client";

import AdmissionsRouteError from "@/components/admissions/AdmissionsRouteError";

// Keeps the site shell and navbar when a JEE page's data fails to load.
export default function JeeCutoffsError({ reset }: { reset: () => void }) {
  return <AdmissionsRouteError reset={reset} backPath="/jee-cutoffs" backLabel="JEE cutoffs" />;
}
