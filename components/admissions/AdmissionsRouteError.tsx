"use client";

import Link from "next/link";

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
    <main className="cutoff-main">
      <header className="cutoff-hero">
        <span className="cutoff-kicker">Official data</span>
        <h1>Official data is temporarily unavailable</h1>
        <p className="cutoff-lead">
          The page exists, but its source could not be loaded. We have not replaced the missing
          records with empty or estimated values.
        </p>
        <div className="cutoff-actions">
          <button type="button" className="cutoff-button cutoff-button-primary" onClick={reset}>
            Try again
          </button>
          <Link className="cutoff-button" href={backPath}>
            {backLabel}
          </Link>
        </div>
      </header>
    </main>
  );
}
