import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function MhtCetNotFound() {
  return (
    <main className="mht-main">
      <div className="mht-page mht-page-wide mht-message">
        <h1 className="mht-h1">Page not found</h1>
        <div className="mht-cta">
          <Link className="mht-btn mht-btn-primary" href="/mht-cet">
            MHT-CET
          </Link>
          <Link className="mht-btn" href="/mht-cet/colleges">
            Colleges
          </Link>
        </div>
      </div>
    </main>
  );
}
