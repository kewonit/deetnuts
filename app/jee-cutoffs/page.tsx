import type { Metadata } from "next";
import Link from "next/link";
import {
  JeeCollegeSearch,
  type SearchCollege,
} from "@/components/jee-cutoffs/JeeCollegeSearch";
import { getJeeCutoffCatalog } from "@/lib/jee-cutoffs/repository";
import { getCutoffCollegePeaks } from "@/lib/jee-cutoffs/year-data";
import type { CutoffCollegeCatalogEntry } from "@/lib/jee-cutoffs/types";
import "@/components/admissions/mht-directory.css";
import "@/components/jee-cutoffs/jee.css";

export const metadata: Metadata = {
  title: "JEE Main and JEE Advanced College Cutoffs",
  description:
    "Verified JoSAA and CSAB opening and closing rank histories for JEE Main and JEE Advanced colleges.",
  alternates: { canonical: "/jee-cutoffs" },
};

const TOP = 8;

export default async function Page() {
  const [catalog, peaks] = await Promise.all([
    getJeeCutoffCatalog(),
    getCutoffCollegePeaks(),
  ]);
  const path = (college: CutoffCollegeCatalogEntry) =>
    `/${college.examId}/colleges/${college.id}`;
  const main = catalog.colleges.filter(
    (college) => college.examId === "jee-main",
  );
  const advanced = catalog.colleges.filter(
    (college) => college.examId === "jee-advanced",
  );
  const latest = Math.max(
    ...catalog.colleges.flatMap((college) =>
      college.pages.map((page) => page.year),
    ),
  );
  const search: SearchCollege[] = catalog.colleges.map((college) => ({
    id: college.id,
    name: college.seoName,
    fullName: college.name,
    path: path(college),
    type: college.type,
    place: [college.city, college.state].filter(Boolean).join(", "),
    aliases: college.aliases,
  }));
  const ranked = (colleges: CutoffCollegeCatalogEntry[]) =>
    colleges
      .flatMap((college) => {
        const peak = peaks.get(college.id);
        return peak ? [{ college, peak }] : [];
      })
      .sort((a, b) => a.peak.closingRank - b.peak.closingRank)
      .slice(0, TOP);
  const lists = [
    {
      id: "iits",
      title: "IITs",
      href: "/jee-advanced/colleges",
      rows: ranked(advanced),
    },
    {
      id: "nits",
      title: "NITs, IIITs and GFTIs",
      href: "/jee-main/colleges",
      rows: ranked(main),
    },
  ];
  const tiles = [
    {
      href: "/jee-main/colleges",
      title: "JEE Main colleges",
      fact: `${main.length} colleges`,
    },
    {
      href: "/jee-advanced/colleges",
      title: "JEE Advanced colleges",
      fact: `${advanced.length} IITs`,
    },
    {
      href: "/college-predictor",
      title: "College predictor",
      fact: `${latest} JoSAA and CSAB ranks`,
    },
  ];

  return (
    <main className="mht-main">
      <div className="mht-page mht-page-wide">
        <header className="mht-hub-head">
          <h1 className="mht-h1">JEE college cutoffs</h1>
          <JeeCollegeSearch colleges={search} />
        </header>

        <nav className="mht-tiles" aria-label="JEE">
          {tiles.map((tile) => (
            <Link key={tile.href} className="mht-tile" href={tile.href}>
              <span className="mht-tile-title">{tile.title}</span>
              <span className="mht-tile-fact">{tile.fact}</span>
            </Link>
          ))}
        </nav>

        <div className="jee-hub-lists">
          {lists.map((list) => (
            <section
              key={list.id}
              className="mht-section"
              aria-labelledby={`jee-top-${list.id}`}
            >
              <div className="mht-section-head">
                <h2 id={`jee-top-${list.id}`}>{list.title}</h2>
                <Link className="mht-arrow-link" href={list.href}>
                  All
                </Link>
              </div>
              <ol className="mht-card mht-rank-list">
                {list.rows.map(({ college, peak }, index) => (
                  <li key={college.id}>
                    <Link href={path(college)}>
                      <span className="mht-rank-n">{index + 1}</span>
                      <span>
                        <strong>{college.seoName}</strong>
                        <small>{peak.program}</small>
                      </span>
                      <span className="mht-rank-v">
                        {peak.closingRank.toLocaleString("en-IN")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
