import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { ShareAdmissionsPage } from "@/components/admissions/AdmissionsActions";
import AdmissionsJsonLd from "@/components/admissions/AdmissionsJsonLd";
import CollegeIdentityMedia from "@/components/admissions/CollegeIdentityMedia";
import { IntentPrefetchLink } from "@/components/admissions/IntentPrefetchLink";
import {
  JeeCollegeDirectory,
  type JeeDirectoryCollege,
} from "./JeeCollegeDirectory";
import { JeeYearExplorer } from "./JeeYearExplorer";
import CutoffChart from "./CutoffChart";
import {
  Crumbs,
  FactChips,
  JsonLd,
  SourceCard,
  plural,
  predictorHref,
} from "./JeeParts";
import { getJeeCollegeMedia } from "@/lib/admissions/college-media";
import { collegeShareImage } from "@/lib/admissions/metadata";
import {
  bodyLabel,
  formatRounds,
  genderLabel,
  quotaLabel,
  roundRuns,
} from "@/lib/jee-cutoffs/labels";
import {
  examLabel,
  getCutoffCollege,
  getCutoffCollegeRows,
  getCutoffColleges,
  getCutoffHubModel,
} from "@/lib/jee-cutoffs/repository";
import {
  getCutoffPeers,
  summarizeCutoffYear,
  type JeeYearHeadline,
} from "@/lib/jee-cutoffs/summary";
import {
  getCutoffCollegePeaks,
  getCutoffYearData,
  type JeeYearData,
} from "@/lib/jee-cutoffs/year-data";
import type {
  CounsellingBody,
  CutoffCollegeCatalogEntry,
  CutoffPageCatalogEntry,
  JeeExamId,
} from "@/lib/jee-cutoffs/types";
import { getCutoffSources } from "@/lib/jee-cutoffs/seo";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";
import "@/components/admissions/mht-explorer.css";
import "@/components/admissions/mht-directory.css";
import "@/components/admissions/mht-college.css";
import "./jee.css";

const baseUrl = PRODUCTION_SITE_URL;
const SCORE_ANCHOR = "score";
// The root layout appends " | DEETNUTS".
const TITLE_LIMIT = 60 - " | DEETNUTS".length;

function cutoffPath(exam: JeeExamId, slug: string, year?: number) {
  return `/${exam}/colleges/${slug}${year ? `/cutoffs/${year}` : ""}`;
}

function orderedBodies(bodies: CounsellingBody[]) {
  return [...bodies].sort(
    (left, right) => Number(right === "josaa") - Number(left === "josaa"),
  );
}

// "JoSAA 1–6 · CSAB 1–3": the rounds each counselling body published that year.
function roundsLabel(page: CutoffPageCatalogEntry) {
  return orderedBodies(page.bodies)
    .map((body) => `${bodyLabel(body)} ${roundRuns(page.roundsByBody[body] ?? [])}`)
    .join(" · ");
}

// "JoSAA 2025 Rounds 1–6 · CSAB 2025 Rounds 1–3"
function sourceSummary(page: CutoffPageCatalogEntry) {
  return orderedBodies(page.bodies)
    .map(
      (body) =>
        `${bodyLabel(body)} ${page.year} ${formatRounds(page.roundsByBody[body] ?? [])}`,
    )
    .join(" · ");
}

function collegeCrumbs(exam: JeeExamId) {
  return [
    { label: "JEE", href: "/jee-cutoffs" },
    { label: `${examLabel(exam)} colleges`, href: `/${exam}/colleges` },
  ];
}

function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  };
}

function shareMetadata(
  college: CutoffCollegeCatalogEntry,
  title: string,
  description: string,
  canonical: string,
): Metadata {
  const image = collegeShareImage(
    getJeeCollegeMedia(college.id)?.campus,
    college.name,
  );
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "DEETNUTS",
      locale: "en_IN",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

async function yearSources(rows: Array<{ source_id: string }>) {
  const wanted = new Set(rows.map((row) => row.source_id));
  return (await getCutoffSources())
    .filter((source) => wanted.has(source.sourceId))
    .sort((left, right) =>
      left.title.localeCompare(right.title, "en", { numeric: true }),
    );
}

export async function DirectoryPage({
  exam,
  colleges,
}: {
  exam: JeeExamId;
  colleges: CutoffCollegeCatalogEntry[];
}) {
  const peaks = await getCutoffCollegePeaks(exam);
  const rows: JeeDirectoryCollege[] = colleges.map((college) => {
    const peak = peaks.get(college.id);
    const logo = getJeeCollegeMedia(college.id)?.logo;
    return {
      id: college.id,
      name: college.seoName,
      fullName: college.name,
      path: cutoffPath(exam, college.id),
      type: college.type,
      place: [college.city, college.state].filter(Boolean).join(", "),
      state: college.state,
      years: college.pages.length,
      aliases: college.aliases,
      top: peak ? { rank: peak.closingRank, program: peak.program } : null,
      logo: logo ? { src: logo.src, background: logo.backgroundColor } : null,
    };
  });
  return (
    <main className="mht-main">
      <div className="mht-page mht-page-wide">
        <Crumbs
          items={[
            { label: "JEE", href: "/jee-cutoffs" },
            { label: `${examLabel(exam)} colleges` },
          ]}
        />
        <JeeCollegeDirectory
          title={`${examLabel(exam)} college cutoffs`}
          colleges={rows}
        />
      </div>
    </main>
  );
}

export async function resolveCollege(
  exam: JeeExamId,
  slug: string,
  year?: number,
) {
  const college = await getCutoffCollege(slug);
  if (!college) notFound();
  if (year && !college.pages.some((page) => page.year === year)) notFound();
  if (college.examId !== exam) {
    permanentRedirect(cutoffPath(college.examId, college.id, year));
  }
  return college;
}

async function yearHeadline(college: CutoffCollegeCatalogEntry, year: number) {
  const yearRows = (await getCutoffCollegeRows(college)).filter(
    (row) => row.year === year,
  );
  return { yearRows, headline: summarizeCutoffYear(yearRows) };
}

function hubTitle(college: CutoffCollegeCatalogEntry, label: string) {
  const candidates = [
    `${college.seoName} cutoff: ${label} closing ranks`,
    `${college.seoName} ${label} cutoff`,
  ];
  return (
    candidates.find((title) => title.length <= TITLE_LIMIT) ??
    `${college.seoName} cutoff`
  );
}

export async function hubMetadata(
  exam: JeeExamId,
  slug: string,
): Promise<Metadata> {
  const college = await getCutoffCollege(slug);
  if (!college || college.examId !== exam) return {};
  const label = examLabel(exam);
  const latest = college.pages[0];
  const firstYear = Math.min(...college.pages.map((page) => page.year));
  const { headline } = await yearHeadline(college, latest.year);
  const { lowest, selection } = headline;
  // Search snippets lead with the figure students are looking for.
  const lead = lowest
    ? `${college.seoName} ${label} cutoff ${latest.year}: ${lowest.source_program_name} closed at rank ${lowest.closing_rank.toLocaleString("en-IN")} in ${bodyLabel(selection.body)} Round ${selection.round} (${quotaLabel(selection.quota)}, OPEN, gender-neutral).`
    : `${college.seoName} ${label} cutoffs for ${latest.year}.`;
  const description = `${lead} Opening and closing ranks for every program, category, quota and round since ${firstYear}.`;
  return shareMetadata(
    college,
    hubTitle(college, label),
    description,
    cutoffPath(exam, slug),
  );
}

export async function yearMetadata(
  exam: JeeExamId,
  slug: string,
  year: number,
): Promise<Metadata> {
  const college = await getCutoffCollege(slug);
  const page = college?.pages.find((entry) => entry.year === year);
  if (!college || college.examId !== exam || !page) return {};
  const bodies = orderedBodies(page.bodies).map(bodyLabel);
  const title = `${college.seoName} Cutoff ${year}: ${examLabel(exam)} ${bodies.join(" & ")} Ranks`;
  const roundCoverage = orderedBodies(page.bodies)
    .map(
      (body) =>
        `${bodyLabel(body)} through Round ${Math.max(...(page.roundsByBody[body] ?? []))}`,
    )
    .join("; ");
  const description = `${college.seoName} ${year} opening and closing ranks for ${page.rowCount.toLocaleString("en-IN")} published program and seat-pool records. ${roundCoverage}.`;
  return shareMetadata(college, title, description, cutoffPath(exam, slug, year));
}

// Banner with the crest half over it, identity and the four headline figures, as on
// MHT-CET college pages.
function CollegeHero({
  college,
  title,
  crumbs,
  stats,
}: {
  college: CutoffCollegeCatalogEntry;
  title: string;
  crumbs: Array<{ label: string; href?: string }>;
  stats: ReactNode;
}) {
  return (
    <>
      <div className="mht-page">
        <Crumbs items={crumbs} />
      </div>
      <div className="mht-college-mark mht-page">
        <CollegeIdentityMedia
          key={college.id}
          media={getJeeCollegeMedia(college.id)}
          initial={college.type}
        />
        <div className="mht-hero-actions">
          <a className="mht-btn mht-btn-primary" href={`#${SCORE_ANCHOR}`}>
            Compare my rank
          </a>
          <ShareAdmissionsPage className="mht-btn" />
        </div>
        <header className="mht-college-identity">
          <h1>{title}</h1>
          <FactChips college={college} />
        </header>
        {stats}
      </div>
    </>
  );
}

function HeadlineStats({
  headline,
  data,
  page,
  yearPath,
}: {
  headline: JeeYearHeadline;
  data: JeeYearData;
  page: CutoffPageCatalogEntry;
  yearPath: string;
}) {
  const { lowest, highest } = headline;
  const bodies = orderedBodies(page.bodies);
  // One body: "2025 Rounds 1–6". Both: "2025 JoSAA 1–6 · CSAB 1–3".
  const rounds =
    bodies.length > 1
      ? roundsLabel(page)
      : formatRounds(page.roundsByBody[bodies[0]] ?? []);
  const programHref = (offeringId: string) => {
    const slug = data.programs.find((program) => program.id === offeringId)?.slug;
    return slug ? `${yearPath}/programs/${slug}` : yearPath;
  };
  return (
    <dl className="mht-stats">
      {lowest ? (
        <div>
          <dt>Lowest closing rank</dt>
          <dd>
            <strong>{lowest.closing_rank.toLocaleString("en-IN")}</strong>
            <Link href={programHref(lowest.offering_id)}>
              {lowest.source_program_name}
            </Link>
          </dd>
        </div>
      ) : null}
      {highest && highest !== lowest ? (
        <div>
          <dt>Highest closing rank</dt>
          <dd>
            <strong>{highest.closing_rank.toLocaleString("en-IN")}</strong>
            <Link href={programHref(highest.offering_id)}>
              {highest.source_program_name}
            </Link>
          </dd>
        </div>
      ) : null}
      <div>
        <dt>Programs</dt>
        <dd>
          <strong>{data.programs.length}</strong>
          <span>{plural(data.pools.length, "seat pool")}</span>
        </dd>
      </div>
      <div>
        <dt>Counselling</dt>
        <dd>
          <strong>{bodies.map(bodyLabel).join(" · ")}</strong>
          <span>
            {page.year} {rounds}
          </span>
        </dd>
      </div>
    </dl>
  );
}

function YearLinks({
  exam,
  slug,
  years,
  current,
}: {
  exam: JeeExamId;
  slug: string;
  years: number[];
  current?: number;
}) {
  return (
    <nav className="jee-years" aria-label="Years">
      {years.map((value) => (
        <Link
          key={value}
          className="mht-chip"
          href={cutoffPath(exam, slug, value)}
          aria-current={value === current ? "page" : undefined}
        >
          {value}
        </Link>
      ))}
    </nav>
  );
}

function CutoffsSection({
  exam,
  slug,
  year,
  years,
  data,
  headline,
}: {
  exam: JeeExamId;
  slug: string;
  year: number;
  years: number[];
  data: JeeYearData;
  headline: JeeYearHeadline;
}) {
  return (
    <section
      id="cutoffs"
      className="mht-section mht-cutoffs mht-college-section"
      aria-labelledby="jee-cutoffs-title"
    >
      <div className="mht-page mht-page-wide">
        <div className="mht-section-head">
          <h2 id="jee-cutoffs-title">Cutoffs</h2>
        </div>
        <div className="mht-card mht-explorer-card">
          <JeeYearExplorer
            exam={exam}
            year={year}
            years={years}
            collegePath={cutoffPath(exam, slug)}
            data={data}
            initial={headline.selection}
            anchorId={SCORE_ANCHOR}
          />
          <div className="mht-card-foot">
            <Link
              className="mht-arrow-link"
              href={predictorHref(exam, headline.selection)}
            >
              Predict my college
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export async function CollegeHubPage({
  exam,
  slug,
}: {
  exam: JeeExamId;
  slug: string;
}) {
  const college = await resolveCollege(exam, slug);
  const latest = college.pages[0];
  const [model, data, { yearRows, headline }, peers] = await Promise.all([
    getCutoffHubModel(exam, slug),
    getCutoffYearData(exam, slug, latest.year),
    yearHeadline(college, latest.year),
    getCutoffPeers(exam, slug),
  ]);
  if (!model || !data) notFound();
  const label = examLabel(exam);
  const years = college.pages.map((page) => page.year).sort((a, b) => b - a);
  const sources = await yearSources(yearRows);
  const media = getJeeCollegeMedia(college.id);

  return (
    <>
      <AdmissionsJsonLd
        kind="college"
        name={college.name}
        alternateName={[
          ...new Set([college.seoName, ...college.aliases]),
        ].filter((name) => name !== college.name)}
        canonicalPath={cutoffPath(exam, slug)}
        location={{ city: college.city, region: college.state }}
        website={media?.officialWebsite}
        crumbs={[
          { name: "JEE cutoffs", path: "/jee-cutoffs" },
          { name: `${label} colleges`, path: `/${exam}/colleges` },
        ]}
      />
      <main className="mht-main mht-college jee-page">
        <CollegeHero
          college={college}
          title={college.name}
          crumbs={[...collegeCrumbs(exam), { label: college.seoName }]}
          stats={
            <HeadlineStats
              headline={headline}
              data={data}
              page={latest}
              yearPath={cutoffPath(exam, slug, latest.year)}
            />
          }
        />

        <CutoffsSection
          exam={exam}
          slug={slug}
          year={latest.year}
          years={years}
          data={data}
          headline={headline}
        />

        <div className="mht-page">
          <section
            id="trend"
            className="mht-section mht-college-section"
            aria-labelledby="jee-trend-title"
          >
            <div className="mht-section-head">
              <h2 id="jee-trend-title">Closing rank by year</h2>
            </div>
            <p className="mht-college-meta">
              <span className="mht-chip">{model.offering.name}</span>
              <span className="mht-chip">{bodyLabel(model.selection.body)}</span>
              <span className="mht-chip">{quotaLabel(model.selection.quota)}</span>
              <span className="mht-chip">{model.selection.seatType}</span>
              <span className="mht-chip">{genderLabel(model.selection.gender)}</span>
            </p>
            <div className="mht-card jee-chart-card">
              <CutoffChart
                points={model.trend}
                label={`${college.name} closing rank trend`}
              />
            </div>
            <YearLinks exam={exam} slug={slug} years={years} />
          </section>

          {peers.length > 0 ? (
            <section
              id="similar"
              className="mht-section mht-college-section"
              aria-labelledby="jee-similar-title"
            >
              <div className="mht-section-head">
                <h2 id="jee-similar-title">Similar colleges</h2>
              </div>
              <div className="mht-card">
                <ul className="mht-peers">
                  {peers.map((peer) => (
                    <li key={peer.id}>
                      <IntentPrefetchLink href={peer.path}>
                        <span>
                          <strong>{peer.name}</strong>
                          <small>{peer.program}</small>
                        </span>
                        <span className="mht-chip">
                          {peer.closingRank.toLocaleString("en-IN")}
                        </span>
                      </IntentPrefetchLink>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          <SourceCard summary={sourceSummary(latest)} sources={sources} />
        </div>
      </main>
    </>
  );
}

export async function CollegeYearPage({
  exam,
  slug,
  year,
}: {
  exam: JeeExamId;
  slug: string;
  year: number;
}) {
  const college = await resolveCollege(exam, slug, year);
  const page = college.pages.find((entry) => entry.year === year)!;
  const [data, { yearRows, headline }] = await Promise.all([
    getCutoffYearData(exam, slug, year),
    yearHeadline(college, year),
  ]);
  if (!data) notFound();
  const label = examLabel(exam);
  const yearPath = cutoffPath(exam, slug, year);
  const sources = await yearSources(yearRows);
  const years = college.pages.map((entry) => entry.year).sort((a, b) => b - a);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${college.name} cutoff ${year}`,
      url: `${baseUrl}${yearPath}`,
      dateModified: page.lastChangedAt,
    },
    breadcrumbJsonLd([
      { name: "JEE cutoffs", path: "/jee-cutoffs" },
      { name: `${label} colleges`, path: `/${exam}/colleges` },
      { name: college.name, path: cutoffPath(exam, slug) },
      { name: String(year), path: yearPath },
    ]),
  ];

  return (
    <main className="mht-main mht-college jee-page">
      <JsonLd value={jsonLd} />
      <CollegeHero
        college={college}
        title={`${college.seoName} cutoff ${year}`}
        crumbs={[
          ...collegeCrumbs(exam),
          { label: college.seoName, href: cutoffPath(exam, slug) },
          { label: String(year) },
        ]}
        stats={
          <HeadlineStats
            headline={headline}
            data={data}
            page={page}
            yearPath={yearPath}
          />
        }
      />

      <CutoffsSection
        exam={exam}
        slug={slug}
        year={year}
        years={years}
        data={data}
        headline={headline}
      />

      <div className="mht-page">
        <YearLinks exam={exam} slug={slug} years={years} current={year} />
        <section className="mht-section" aria-labelledby="jee-programs-title">
          <div className="mht-section-head">
            <h2 id="jee-programs-title">
              Programs <span className="mht-count">{data.programs.length}</span>
            </h2>
          </div>
          <ul className="mht-card jee-program-list">
            {data.programs.map((program) => (
              <li key={program.id}>
                {program.slug ? (
                  <Link href={`${yearPath}/programs/${program.slug}`}>
                    <strong>{program.name}</strong>
                    <small>
                      {program.degree} · {program.years} years
                    </small>
                  </Link>
                ) : (
                  <span>
                    <strong>{program.name}</strong>
                    <small>
                      {program.degree} · {program.years} years
                    </small>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
        <SourceCard summary={sourceSummary(page)} sources={sources} />
      </div>
    </main>
  );
}

export async function getDirectory(exam: JeeExamId) {
  return getCutoffColleges(exam);
}
