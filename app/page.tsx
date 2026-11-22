import { Metadata } from "next";
import { MhtShell } from "@/components/admissions/MhtShell";
import {
  HomeClosing,
  HomeCommunity,
  HomeHero,
  HomeStats,
  HomeTools,
  type FeaturedCollege,
  type PreviewRow,
  type Stat,
} from "@/components/home/HomeSections";
import { getMhtCetCollegeMedia } from "@/lib/admissions/college-media";
import { formatPercentile } from "@/lib/admissions/mht-cet-college-summary";
import {
  getMhtCetDirectory,
  MHT_CET_DIRECTORY_SOURCE,
} from "@/lib/admissions/mht-cet-directory";
import { getMhtCetCollegePeaks } from "@/lib/admissions/mht-cet-peers";
import { getCanonicalMhtCetCollegePath } from "@/lib/admissions/proxy-canonical";
import { getJeeCutoffCatalog } from "@/lib/jee-cutoffs/repository";
import type { JeeCutoffCatalog } from "@/lib/jee-cutoffs/types";
import { ALL_INDIA_ROUNDS_BY_YEAR } from "@/lib/mht-cet/all-india/config";
import {
  DEFAULT_ROUND,
  DEFAULT_YEAR,
  ROUNDS_BY_YEAR,
} from "@/lib/mht-cet/state-cutoffs/config";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";
import "@/components/home/home.css";

export const metadata: Metadata = {
  title: "2026 MHT-CET Cutoffs & Admission Tools",
  description:
    "Plan 2026 Maharashtra engineering admissions with MHT-CET cutoffs, college data, seat matrices, and admission trends.",
  keywords: [
    "engineering admission 2026",
    "MHT-CET cutoffs",
    "Maharashtra engineering colleges",
    "college seat matrix",
    "admission trends",
  ],
  openGraph: {
    title: "2026 Engineering Admission Tools | DEETNUTS",
    description:
      "Plan 2026 Maharashtra engineering admissions with MHT-CET cutoffs, college data, seat matrices, and admission trends.",
    url: PRODUCTION_SITE_URL,
    type: "website",
  },
  alternates: {
    canonical: PRODUCTION_SITE_URL,
  },
};

// Like /mht-cet: the top cutoffs come from PocketBase (cached for an hour),
// which the build cannot reach.
export const dynamic = "force-dynamic";

// The colleges students search for most, with the names they use.
const FEATURED = [
  { code: 3012, name: "VJTI", place: "Mumbai" },
  { code: 16006, name: "COEP", place: "Pune" },
  { code: 3036, name: "ICT", place: "Mumbai" },
  { code: 6271, name: "PICT", place: "Pune" },
  { code: 3215, name: "SPIT", place: "Mumbai" },
];

const PREVIEW_ROWS = 5;

function roundsLabel(year: number, rounds: readonly number[] | undefined) {
  if (!rounds || rounds.length === 0) return `${year} CAP`;
  const first = rounds[0];
  const last = rounds[rounds.length - 1];
  return first === last
    ? `${year} CAP Round ${first}`
    : `${year} CAP Rounds ${first}–${last}`;
}

function countRounds(byYear: Record<number, readonly number[]>) {
  return Object.values(byYear).reduce((sum, rounds) => sum + rounds.length, 0);
}

function firstYear(byYear: Record<number, readonly number[]>) {
  return Math.min(...Object.keys(byYear).map(Number));
}

function featuredColleges(): FeaturedCollege[] {
  return FEATURED.flatMap(({ code, name, place }) => {
    const path = getCanonicalMhtCetCollegePath(code);
    if (!path) return [];
    const media = getMhtCetCollegeMedia(code);
    const focal = media?.campus?.focalPoint;
    return [
      {
        code: String(code),
        name,
        place,
        title: media?.collegeName ?? name,
        path,
        logo: media?.logo
          ? { src: media.logo.src, background: media.logo.backgroundColor }
          : null,
        campus: media?.campus
          ? {
              src: media.campus.src,
              position: focal ? `${focal.x}% ${focal.y}%` : "50% 50%",
            }
          : null,
      },
    ];
  });
}

async function readJeeCatalog(): Promise<JeeCutoffCatalog | null> {
  try {
    return await getJeeCutoffCatalog();
  } catch {
    return null;
  }
}

export default async function Home() {
  const [peaks, catalog] = await Promise.all([
    getMhtCetCollegePeaks(),
    readJeeCatalog(),
  ]);
  const colleges = getMhtCetDirectory();
  const featured = featuredColleges();
  const allIndiaYear = Math.max(
    ...Object.keys(ALL_INDIA_ROUNDS_BY_YEAR).map(Number),
  );

  const rows: PreviewRow[] = [...peaks]
    .sort(
      (a, b) =>
        b.percentile - a.percentile || a.name.localeCompare(b.name, "en-IN"),
    )
    .slice(0, PREVIEW_ROWS)
    .map((college) => ({
      path: college.path,
      name: college.name,
      program: college.program,
      value: formatPercentile(college.percentile),
    }));

  const jeeColleges = catalog?.colleges ?? [];
  const countType = (type: string) =>
    jeeColleges.filter((college) => college.type === type).length;
  const jeeYears = jeeColleges.flatMap((college) =>
    college.pages.map((page) => page.year),
  );
  const jeeSpan =
    jeeYears.length > 0
      ? `${Math.min(...jeeYears)}–${Math.max(...jeeYears)}`
      : null;
  const jeeMain: Stat[] = jeeColleges.length
    ? [
        { label: "NITs", value: String(countType("NIT")) },
        { label: "IIITs", value: String(countType("IIIT")) },
        { label: "GFTIs", value: String(countType("GFTI")) },
      ]
    : [];
  const jeeAdvanced: Stat[] = jeeColleges.length
    ? [
        { label: "IITs", value: String(countType("IIT")) },
        ...(jeeSpan ? [{ label: "JoSAA years", value: jeeSpan }] : []),
      ]
    : [];

  const stats: Stat[] = [
    {
      label: `Maharashtra colleges in CAP ${MHT_CET_DIRECTORY_SOURCE.mhtCetYear}`,
      value: colleges.length.toLocaleString("en-IN"),
    },
    {
      label: `State cutoff rounds since ${firstYear(ROUNDS_BY_YEAR)}`,
      value: String(countRounds(ROUNDS_BY_YEAR)),
    },
    {
      label: `All India cutoff rounds since ${firstYear(ALL_INDIA_ROUNDS_BY_YEAR)}`,
      value: String(countRounds(ALL_INDIA_ROUNDS_BY_YEAR)),
    },
    ...(jeeColleges.length
      ? [
          {
            label: "JoSAA and CSAB colleges",
            value: jeeColleges.length.toLocaleString("en-IN"),
          },
        ]
      : []),
  ];

  return (
    <MhtShell>
      <main className="mht-main home">
        <div className="mht-page mht-page-wide">
          <HomeHero
            rows={rows}
            pool={`${DEFAULT_YEAR} CAP Round ${DEFAULT_ROUND}`}
          />
          <HomeTools
            mhtLinks={[
              {
                href: "/mht-cet/state-cutoffs",
                title: "State cutoffs",
                fact: roundsLabel(DEFAULT_YEAR, ROUNDS_BY_YEAR[DEFAULT_YEAR]),
              },
              {
                href: "/mht-cet/all-india-cutoffs",
                title: "All India cutoffs",
                fact: roundsLabel(
                  allIndiaYear,
                  ALL_INDIA_ROUNDS_BY_YEAR[allIndiaYear],
                ),
              },
              {
                href: "/mht-cet/colleges",
                title: "Colleges",
                fact: `${colleges.length.toLocaleString("en-IN")} colleges in ${MHT_CET_DIRECTORY_SOURCE.mhtCetYear}`,
              },
            ]}
            logos={featured}
            jeeMain={jeeMain}
            jeeAdvanced={jeeAdvanced}
          />
          <HomeCommunity />
          <HomeStats stats={stats} />
          <HomeClosing colleges={featured.slice(0, 4)} />
        </div>
      </main>
    </MhtShell>
  );
}
