import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "College not found",
  robots: { index: false, follow: false },
};

export default function CollegeNotFound() {
  return (
    <main className="cutoff-main">
      <header className="cutoff-hero">
        <span className="cutoff-kicker">MHT-CET</span>
        <h1>College not found</h1>
        <p className="cutoff-lead">
          This identifier does not match a verified MHT-CET college record.
        </p>
        <div className="cutoff-actions">
          <Link className="cutoff-button cutoff-button-primary" href="/mht-cet/colleges">
            Browse colleges
          </Link>
        </div>
      </header>
    </main>
  );
}
