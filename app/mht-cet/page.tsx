import { Metadata } from "next";
import Link from "next/link";
import FAQJsonLd, { MHTCET_FAQS } from "@/components/FAQJsonLd";
import { IntentPrefetchLink } from "@/components/admissions/IntentPrefetchLink";
import { getMhtCetDirectory, MHT_CET_DIRECTORY_SOURCE } from "@/lib/admissions/mht-cet-directory";
import { getMhtCetCollegePeaks } from "@/lib/admissions/mht-cet-peers";
import { formatPercentile } from "@/lib/admissions/mht-cet-college-summary";
import { ALL_INDIA_ROUNDS_BY_YEAR } from "@/lib/mht-cet/all-india/config";
import { DEFAULT_YEAR, ROUNDS_BY_YEAR } from "@/lib/mht-cet/state-cutoffs/config";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";
import "@/components/admissions/mht-directory.css";

export const metadata: Metadata = {
  title: "MHT-CET 2026 Cutoffs and Admission Planning",
  description:
    "Search MHT-CET 2026 CAP Round I-IV state cutoffs derived from official allotment PDFs, plus historical cutoffs, college details, and seat matrices.",
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
      "Search 2026 CAP Round I-IV state cutoffs derived from official MHT-CET allotment PDFs, with historical data for Maharashtra engineering admissions.",
    url: `${PRODUCTION_SITE_URL}/mht-cet`,
    type: "website",
  },
  alternates: {
    canonical: `${PRODUCTION_SITE_URL}/mht-cet`,
  },
};

// Top cutoffs come from PocketBase (cached), which the build cannot reach; the
// page is identical for every visitor, so it is cached at the edge instead.
export const dynamic = "force-dynamic";

function roundsLabel(year: number, rounds: readonly number[] | undefined) {
  if (!rounds || rounds.length === 0) return String(year);
  const first = rounds[0];
  const last = rounds[rounds.length - 1];
  return first === last ? `${year} · Round ${first}` : `${year} · Rounds ${first}–${last}`;
}

const TOP_COUNT = 10;

export default async function Home() {
  const colleges = getMhtCetDirectory();
  const peaks = await getMhtCetCollegePeaks();
  const allIndiaYear = Math.max(...Object.keys(ALL_INDIA_ROUNDS_BY_YEAR).map(Number));
  const top = [...peaks]
    .sort((a, b) => b.percentile - a.percentile || a.name.localeCompare(b.name, "en-IN"))
    .slice(0, TOP_COUNT);
  const tiles = [
    {
      href: "/mht-cet/state-cutoffs",
      title: "State cutoffs",
      fact: roundsLabel(DEFAULT_YEAR, ROUNDS_BY_YEAR[DEFAULT_YEAR]),
    },
    {
      href: "/mht-cet/all-india-cutoffs",
      title: "All India cutoffs",
      fact: roundsLabel(allIndiaYear, ALL_INDIA_ROUNDS_BY_YEAR[allIndiaYear]),
    },
    {
      href: "/mht-cet/colleges",
      title: "Colleges",
      fact:
        colleges.length > 0
          ? `${MHT_CET_DIRECTORY_SOURCE.mhtCetYear} · ${colleges.length.toLocaleString("en-IN")}`
          : "Maharashtra",
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
                  <IntentPrefetchLink href={college.path}>
                    <span className="mht-rank-n">{index + 1}</span>
                    <span>
                      <strong>{college.name}</strong>
                      <small>{college.program}</small>
                    </span>
                    <span className="mht-rank-v">{formatPercentile(college.percentile)}</span>
                  </IntentPrefetchLink>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </main>
  );
}
