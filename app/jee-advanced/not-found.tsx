import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mht-main">
      <div className="mht-page mht-page-wide mht-message">
        <h1 className="mht-h1">Page not found</h1>
        <div className="mht-cta">
          <Link className="mht-btn mht-btn-primary" href="/jee-advanced/colleges">
            JEE Advanced colleges
          </Link>
          <Link className="mht-btn" href="/jee-cutoffs">
            JEE cutoffs
          </Link>
        </div>
      </div>
    </main>
  );
}
