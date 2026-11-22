import type { Metadata } from "next";
import Link from "next/link";
import { MhtShell } from "@/components/admissions/MhtShell";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

// Renders for any route without its own not-found, outside that route's layout.
export default function NotFound() {
  return (
    <MhtShell>
      <main className="mht-main">
        <div className="mht-page mht-page-wide mht-message">
          <h1 className="mht-h1">Page not found</h1>
          <div className="mht-cta">
            <Link className="mht-btn mht-btn-primary" href="/">
              Home
            </Link>
            <Link className="mht-btn" href="/mht-cet">
              MHT-CET
            </Link>
            <Link className="mht-btn" href="/jee-cutoffs">
              JEE
            </Link>
          </div>
        </div>
      </main>
    </MhtShell>
  );
}
