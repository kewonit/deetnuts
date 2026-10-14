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
    <main className="mht-main">
      <div className="mht-page mht-page-wide mht-message">
        <h1 className="mht-h1">Couldn’t load this page</h1>
        <p>The official data didn’t load.</p>
        <div className="mht-cta">
          <button type="button" className="mht-btn mht-btn-primary" onClick={reset}>
            Try again
          </button>
          <Link className="mht-btn" href={backPath}>
            {backLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
