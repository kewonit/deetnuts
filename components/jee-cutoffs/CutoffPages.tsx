import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ShareAdmissionsPage } from "@/components/admissions/AdmissionsActions";
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
import {
  bodyLabel,
  buildDefaultSelection,
  examLabel,
  getCutoffCollege,
  getCutoffCollegeRows,
  getCutoffColleges,
  getCutoffHubModel,
} from "@/lib/jee-cutoffs/repository";
import {
  getCutoffCollegePeaks,
  getCutoffYearData,
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
import "./jee.css";

const baseUrl = PRODUCTION_SITE_URL;
const PAPER_TWO = /arch|plan/i;

function cutoffPath(exam: JeeExamId, slug: string, year?: number) {
  return `/${exam}/colleges/${slug}${year ? `/cutoffs/${year}` : ""}`;
}

function orderedBodies(bodies: CounsellingBody[]) {
  return [...bodies].sort(
    (left, right) => Number(right === "josaa") - Number(left === "josaa"),
  );
}

function orderedBodyLabels(
  bodies: CutoffCollegeCatalogEntry["pages"][number]["bodies"],
) {
  return orderedBodies(bodies).map(bodyLabel);
}

// "JoSAA 6 · CSAB 3": the last published round of each counselling body.
function roundsLabel(page: CutoffPageCatalogEntry) {
  return orderedBodies(page.bodies)
    .map(
      (body) =>
        `${bodyLabel(body)} ${Math.max(...(page.roundsByBody[body] ?? []))}`,
    )
    .join(" · ");
}

function collegeCrumbs(exam: JeeExamId) {
  return [
    { label: "JEE", href: "/jee-cutoffs" },
    { label: `${examLabel(exam)} colleges`, href: `/${exam}/colleges` },
  ];
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

export async function hubMetadata(
  exam: JeeExamId,
  slug: string,
): Promise<Metadata> {
  const college = await getCutoffCollege(slug);
  if (!college || college.examId !== exam) return {};
  const label = examLabel(exam);
  const title = `${college.seoName} ${label} Cutoff Trends and Previous Years`;
  const description = `Compare source-backed ${college.seoName} ${label} opening and closing rank trends, then open complete year-wise cutoff tables.`;
  const canonical = cutoffPath(exam, slug);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

export async function yearMetadata(
  exam: JeeExamId,
  slug: string,
  year: number,
): Promise<Metadata> {
  const college = await getCutoffCollege(slug);
  const page = college?.pages.find((entry) => entry.year === year);
  if (!college || college.examId !== exam || !page) return {};
  const bodies = orderedBodyLabels(page.bodies);
  const title = `${college.seoName} Cutoff ${year}: ${examLabel(exam)} ${bodies.join(" & ")} Ranks`;
  const roundCoverage = orderedBodies(page.bodies)
    .map(
      (body) =>
        `${bodyLabel(body)} through Round ${Math.max(...(page.roundsByBody[body] ?? []))}`,
    )
    .join("; ");
  const description = `${college.seoName} ${year} opening and closing ranks for ${page.rowCount.toLocaleString("en-IN")} published program and seat-pool records. ${roundCoverage}.`;
  const canonical = cutoffPath(exam, slug, year);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

export async function CollegeHubPage({
  exam,
  slug,
}: {
  exam: JeeExamId;
  slug: string;
}) {
  const college = await resolveCollege(exam, slug);
  const model = await getCutoffHubModel(exam, slug);
  if (!model) notFound();
  const label = examLabel(exam);
  const years = [...college.pages].sort((a, b) => b.year - a.year);
  const latest = model.latestPage;
  const latestData = await getCutoffYearData(exam, slug, latest.year);
  const lastClosing = [...model.trend]
    .reverse()
    .find((point) => point.closingRank !== null);
  const bodies = orderedBodies([
    ...new Set(college.pages.flatMap((page) => page.bodies)),
  ]);
  const canonical = `${baseUrl}${cutoffPath(exam, slug)}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${college.name} ${label} cutoff trends`,
      url: canonical,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "JEE cutoffs",
          item: `${baseUrl}/jee-cutoffs`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: `${label} colleges`,
          item: `${baseUrl}/${exam}/colleges`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: college.name,
          item: canonical,
        },
      ],
    },
  ];

  return (
    <main className="mht-main jee-page">
      <JsonLd value={jsonLd} />
      <div className="mht-page">
        <Crumbs items={[...collegeCrumbs(exam), { label: college.seoName }]} />
        <header className="jee-head">
          <h1 className="mht-h1">{college.seoName} cutoff history</h1>
          <FactChips college={college} />
          <div className="jee-actions">
            <Link
              className="mht-btn mht-btn-primary"
              href={cutoffPath(exam, slug, latest.year)}
            >
              {latest.year} cutoffs
            </Link>
            <Link
              className="mht-btn"
              href={predictorHref(exam, model.selection)}
            >
              Predict my college
            </Link>
          </div>
        </header>
        <dl className="mht-stats">
          <div>
            <dt>Latest closing rank</dt>
            <dd>
              <strong>
                {lastClosing?.closingRank?.toLocaleString("en-IN") ?? "—"}
              </strong>
              <span>
                {model.offering.name} · {lastClosing?.label ?? latest.year}
              </span>
            </dd>
          </div>
          <div>
            <dt>Years</dt>
            <dd>
              <strong>
                {years.at(-1)?.year}–{years[0]?.year}
              </strong>
              <span>{plural(years.length, "year")}</span>
            </dd>
          </div>
          <div>
            <dt>Programs</dt>
            <dd>
              <strong>{latestData?.programs.length ?? "—"}</strong>
              <span>{latest.year}</span>
            </dd>
          </div>
          <div>
            <dt>Counselling</dt>
            <dd>
              <strong>{bodies.map(bodyLabel).join(" · ")}</strong>
              <span>Rounds {roundsLabel(latest)}</span>
            </dd>
          </div>
        </dl>
      </div>

      <section className="mht-section" aria-labelledby="jee-trend-title">
        <div className="mht-page">
          <div className="mht-section-head">
            <h2 id="jee-trend-title">Closing rank by year</h2>
          </div>
          <p className="mht-college-meta">
            <span className="mht-chip">{model.offering.name}</span>
            <span className="mht-chip">{bodyLabel(model.selection.body)}</span>
            <span className="mht-chip">{model.selection.quota}</span>
            <span className="mht-chip">{model.selection.seatType}</span>
            <span className="mht-chip">
              {model.selection.gender === "Gender-Neutral"
                ? "Gender-neutral"
                : "Female-only"}
            </span>
          </p>
          <div className="mht-card jee-chart-card">
            <CutoffChart
              points={model.trend}
              label={`${college.name} closing rank trend`}
            />
          </div>
        </div>
      </section>

      <section className="mht-section" aria-labelledby="jee-years-title">
        <div className="mht-page">
          <div className="mht-section-head">
            <h2 id="jee-years-title">Cutoffs by year</h2>
          </div>
          <div className="mht-card">
            <ul className="mht-peers">
              {years.map((page) => (
                <li key={page.year}>
                  <Link href={cutoffPath(exam, slug, page.year)}>
                    <span>
                      <strong>{page.year}</strong>
                      <small>Rounds {roundsLabel(page)}</small>
                    </span>
                    <span className="mht-chip">
                      {plural(page.rowCount, "record")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
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
  const data = await getCutoffYearData(exam, slug, year);
  if (!data) notFound();
  const label = examLabel(exam);
  const yearRows = (await getCutoffCollegeRows(college)).filter(
    (row) => row.year === year,
  );
  const selection = buildDefaultSelection(yearRows);
  const yearPath = cutoffPath(exam, slug, year);

  // The headline pool across programs: the same default seat the college page charts.
  const headline = yearRows.filter(
    (row) =>
      row.body === selection.body &&
      row.round === selection.round &&
      row.quota === selection.quota &&
      row.seat_type === selection.seatType &&
      row.gender === selection.gender,
  );
  const engineering = headline.filter((row) => !PAPER_TWO.test(row.degree));
  const ranked = (engineering.length ? engineering : headline).sort(
    (a, b) => a.closing_rank - b.closing_rank,
  );
  const lowest = ranked[0];
  const highest = ranked.at(-1);
  const programHref = (offeringId: string) => {
    const slugFor = data.programs.find(
      (program) => program.id === offeringId,
    )?.slug;
    return slugFor ? `${yearPath}/programs/${slugFor}` : undefined;
  };

  const wantedSources = new Set(yearRows.map((row) => row.source_id));
  const sources = (await getCutoffSources())
    .filter((source) => wantedSources.has(source.sourceId))
    .sort((left, right) =>
      left.title.localeCompare(right.title, "en", { numeric: true }),
    );
  const canonical = `${baseUrl}${yearPath}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${college.name} cutoff ${year}`,
      url: canonical,
      dateModified: page.lastChangedAt,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "JEE cutoffs",
          item: `${baseUrl}/jee-cutoffs`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: `${label} colleges`,
          item: `${baseUrl}/${exam}/colleges`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: college.name,
          item: `${baseUrl}${cutoffPath(exam, slug)}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: String(year),
          item: canonical,
        },
      ],
    },
  ];
  const years = [...college.pages]
    .map((entry) => entry.year)
    .sort((a, b) => b - a);

  return (
    <main className="mht-main jee-page">
      <JsonLd value={jsonLd} />
      <div className="mht-page">
        <Crumbs
          items={[
            ...collegeCrumbs(exam),
            { label: college.seoName, href: cutoffPath(exam, slug) },
            { label: String(year) },
          ]}
        />
        <header className="jee-head">
          <h1 className="mht-h1">
            {college.seoName} cutoff {year}
          </h1>
          <FactChips college={college} />
          <div className="jee-actions">
            <Link
              className="mht-btn mht-btn-primary"
              href={predictorHref(exam, selection)}
            >
              Predict my college
            </Link>
            <ShareAdmissionsPage className="mht-btn" />
          </div>
        </header>
        {lowest && highest ? (
          <dl className="mht-stats">
            <div>
              <dt>Lowest closing rank</dt>
              <dd>
                <strong>{lowest.closing_rank.toLocaleString("en-IN")}</strong>
                <Link href={programHref(lowest.offering_id) ?? yearPath}>
                  {lowest.source_program_name}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Highest closing rank</dt>
              <dd>
                <strong>{highest.closing_rank.toLocaleString("en-IN")}</strong>
                <Link href={programHref(highest.offering_id) ?? yearPath}>
                  {highest.source_program_name}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Programs</dt>
              <dd>
                <strong>{data.programs.length}</strong>
                <span>{plural(data.pools.length, "seat pool")}</span>
              </dd>
            </div>
            <div>
              <dt>Rounds</dt>
              <dd>
                <strong>{roundsLabel(page)}</strong>
                <span>{plural(page.rowCount, "record")}</span>
              </dd>
            </div>
          </dl>
        ) : null}
      </div>

      <section
        id="cutoffs"
        className="mht-section mht-cutoffs"
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
              initial={selection}
            />
          </div>
          <nav className="jee-years" aria-label="Years">
            {years.map((value) => (
              <Link
                key={value}
                className="mht-chip"
                href={cutoffPath(exam, slug, value)}
                aria-current={value === year ? "page" : undefined}
              >
                {value}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="mht-page">
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
        <SourceCard
          summary={orderedBodies(page.bodies)
            .map(
              (body) =>
                `${bodyLabel(body)} ${year} Rounds 1–${Math.max(...(page.roundsByBody[body] ?? []))}`,
            )
            .join(" · ")}
          sources={sources}
        />
      </div>
    </main>
  );
}

export async function getDirectory(exam: JeeExamId) {
  return getCutoffColleges(exam);
}
