import { Metadata } from "next";
import Link from "next/link";
import FAQJsonLd, { MHTCET_FAQS } from "@/components/FAQJsonLd";
import { EjamPageLayout } from "@/components/ejam-chrome/ejam-page-layout";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

const LINKS = [
  {
    title: "State cutoffs",
    href: "/mht-cet/state-cutoffs",
    kicker: "CAP rounds",
    description: "Search Maharashtra state counselling cutoffs by rank, category, and university.",
  },
  {
    title: "All India cutoffs",
    href: "/mht-cet/all-india-cutoffs",
    kicker: "AI quota",
    description: "Browse All India quota closing ranks and percentiles by round.",
  },
  {
    title: "College list",
    href: "/mht-cet/colleges",
    kicker: "Directory",
    description: "Open a college for programs, cutoff observations, and the 2024 seat matrix.",
  },
  {
    title: "College predictor",
    href: "/college-predictor",
    kicker: "Tool",
    description: "Estimate admission chances from your rank in the eJam predictor.",
  },
];

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

export default function Home() {
  return (
    <EjamPageLayout chrome="document">
      <main className="cutoff-main">
        <FAQJsonLd faqs={MHTCET_FAQS} />
        <header className="cutoff-hero">
          <span className="cutoff-kicker">Maharashtra</span>
          <h1>MHT-CET cutoffs</h1>
          <p className="cutoff-lead">
            Source-backed CAP cutoffs, college pages, and a predictor — in the same eJam workspace language as JEE.
          </p>
        </header>
        <section className="cutoff-section" aria-labelledby="mht-tools-title">
          <div className="cutoff-section-heading">
            <div>
              <h2 id="mht-tools-title">Choose a tool</h2>
              <p>State counselling, All India quota, college pages, or the rank predictor.</p>
            </div>
          </div>
          <div className="cutoff-directory">
            {LINKS.map((link) => (
              <Link className="cutoff-college-card" href={link.href} key={link.href}>
                <div>
                  <span className="cutoff-kicker">{link.kicker}</span>
                  <h3>{link.title}</h3>
                  <p>{link.description}</p>
                </div>
                <span className="cutoff-card-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </EjamPageLayout>
  );
}
