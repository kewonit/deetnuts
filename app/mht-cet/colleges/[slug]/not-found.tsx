import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "College not found",
  robots: { index: false, follow: false },
};

export default function CollegeNotFound() {
  return (
    <main className="mht-main">
      <div className="mht-page mht-page-wide mht-message">
        <h1 className="mht-h1">College not found</h1>
        <p>No MHT-CET college has this code.</p>
        <div className="mht-cta">
          <Link className="mht-btn mht-btn-primary" href="/mht-cet/colleges">
            Browse colleges
          </Link>
        </div>
      </div>
    </main>
  );
}
