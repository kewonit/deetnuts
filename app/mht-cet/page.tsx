import { Metadata } from "next";
import Link from "next/link";
import FAQJsonLd, { MHTCET_FAQS } from "@/components/FAQJsonLd";
import { getCollegesData } from "@/lib/college-data";
import { getMhtCetCollegePeaks } from "@/lib/admissions/mht-cet-peers";
import { formatPercentile } from "@/lib/admissions/mht-cet-college-summary";
import { DEFAULT_ROUND, DEFAULT_YEAR } from "@/lib/mht-cet/state-cutoffs/config";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";
import "@/components/admissions/mht-directory.css";

export const metadata: Metadata = {
  title: "MHT-CET 2026 Cutoffs and Admission Planning",
  description:
    "Search MHT-CET 2026 CAP Round I state cutoffs derived from official allotment PDFs, plus historical cutoffs, college details, and seat matrices.",
  keywords: [
    "MHT-CET",
    "MHT-CET 2026 admissions",
    "MHT-CET 2026 cutoffs",
    "MHT-CET 2025 cutoffs",
    "MHT-CET 2024 cutoffs",
    "Maharashtra CET",
    "engineering cutoffs",
    "Maharashtra colleges",
    "seat matrix",
    "CAP rounds",
  ],
  openGraph: {
    title: "MHT-CET 2026 Cutoffs and Admission Planning",
    description:
      "Search 2026 CAP Round I state cutoffs derived from official MHT-CET allotment PDFs, with historical data for Maharashtra engineering admissions.",
    url: `${PRODUCTION_SITE_URL}/mht-cet`,
    type: "website",
  },
  alternates: {
    canonical: `${PRODUCTION_SITE_URL}/mht-cet`,
  },
};

// Both data sources are cached; rendering per request keeps the build off PocketBase.
export const dynamic = "force-dynamic";

const TOP_COUNT = 10;

export default async function Home() {
  const [colleges, peaks] = await Promise.all([
    getCollegesData().catch(() => []),
    getMhtCetCollegePeaks(),
  ]);
  const top = [...peaks]
    .sort((a, b) => b.percentile - a.percentile || a.name.localeCompare(b.name, "en-IN"))
    .slice(0, TOP_COUNT);
  const tiles = [
    { href: "/mht-cet/state-cutoffs", title: "State cutoffs", fact: `${DEFAULT_YEAR} · Round ${DEFAULT_ROUND}` },
    { href: "/mht-cet/all-india-cutoffs", title: "All India cutoffs", fact: "2024 · Round 1" },
    {
      href: "/mht-cet/colleges",
      title: "Colleges",
      fact: colleges.length > 0 ? colleges.length.toLocaleString("en-IN") : "Maharashtra",
    },
  ];

  return (
    <main className="mht-main">
      <FAQJsonLd faqs={MHTCET_FAQS} />
      <div className="mht-page mht-page-wide">
        <header className="mht-hub-head">
          <h1 className="mht-h1">MHT-CET cutoffs</h1>
          <form action="/mht-cet/colleges" role="search" className="mht-search mht-search-lg">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="7" cy="7" r="4.75" />
              <path d="m10.5 10.5 3 3" />
            </svg>
            <input
              type="search"
              name="q"
              placeholder="Find a college"
              aria-label="Find a college"
              autoComplete="off"
              enterKeyHint="search"
            />
          </form>
        </header>

        <nav className="mht-tiles" aria-label="MHT-CET">
          {tiles.map((tile) => (
            <Link key={tile.href} className="mht-tile" href={tile.href}>
              <span className="mht-tile-title">{tile.title}</span>
              <span className="mht-tile-fact">{tile.fact}</span>
            </Link>
          ))}
        </nav>

        {top.length > 0 ? (
          <section className="mht-section" aria-labelledby="mht-top-title">
            <div className="mht-section-head">
              <h2 id="mht-top-title">Top colleges</h2>
              <Link className="mht-arrow-link" href="/mht-cet/colleges">
                All colleges
              </Link>
            </div>
            <ol className="mht-card mht-rank-list">
              {top.map((college, index) => (
                <li key={college.collegeId}>
                  <Link href={college.path}>
                    <span className="mht-rank-n">{index + 1}</span>
                    <span>
                      <strong>{college.name}</strong>
                      <small>{college.program}</small>
                    </span>
                    <span className="mht-rank-v">{formatPercentile(college.percentile)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </main>
  );
}
