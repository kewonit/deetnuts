import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { CollegeDirectory } from "./CollegeDirectory";
import { CutoffExplorer } from "./CutoffExplorer";
import CutoffChart from "./CutoffChart";
import {
  bodyLabel,
  examLabel,
  getCutoffCollege,
  getCutoffColleges,
  getCutoffHubModel,
  getCutoffPageModel,
} from "@/lib/jee-cutoffs/repository";
import type { CutoffCollegeCatalogEntry, JeeExamId } from "@/lib/jee-cutoffs/types";
import { getCutoffSources, getJeeSeoRoutes } from "@/lib/jee-cutoffs/seo";

const baseUrl = "https://deetnuts.com";

function JsonLd({ value }: { value: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(value).replace(/</g, "\\u003c") }} />;
}

function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <nav className="cutoff-breadcrumbs" aria-label="Breadcrumb">{items.map((item, index) => <span key={item.label}>{index ? <span aria-hidden="true">›</span> : null}{item.href ? <Link href={item.href}>{item.label}</Link> : item.label}</span>)}</nav>;
}

function CollegeFacts({ college, coverage, coverageLabel = "Rounds" }: { college: CutoffCollegeCatalogEntry; coverage: string; coverageLabel?: string }) {
  return <dl className="cutoff-facts"><div className="cutoff-fact"><dt>Institute</dt><dd>{college.type}</dd></div><div className="cutoff-fact"><dt>Location</dt><dd>{[college.city, college.state].filter(Boolean).join(", ")}</dd></div><div className="cutoff-fact"><dt>Established</dt><dd>{college.established || "—"}</dd></div><div className="cutoff-fact"><dt>Exam</dt><dd>{examLabel(college.examId)}</dd></div><div className="cutoff-fact cutoff-fact-wide"><dt>{coverageLabel}</dt><dd>{coverage}</dd></div></dl>;
}

function cutoffPath(exam: JeeExamId, slug: string, year?: number) {
  return `/${exam}/colleges/${slug}${year ? `/cutoffs/${year}` : ""}`;
}

function orderedBodyLabels(bodies: CutoffCollegeCatalogEntry["pages"][number]["bodies"]) {
  return [...bodies].sort((left, right) => Number(right === "josaa") - Number(left === "josaa")).map(bodyLabel);
}

export function DirectoryPage({ exam, colleges }: { exam: JeeExamId; colleges: CutoffCollegeCatalogEntry[] }) {
  const label = examLabel(exam);
  return <main className="cutoff-main">
    <Breadcrumbs items={[{ label: "JEE cutoffs", href: "/jee-cutoffs" }, { label: `${label} colleges` }]} />
    <header className="cutoff-hero"><span className="cutoff-kicker">{label}</span><h1>College cutoffs</h1><p className="cutoff-lead">Choose a college to compare opening and closing ranks across years, rounds, programs and seat pools.</p><div className="cutoff-hero-meta"><span>{colleges.length} colleges</span><span>JoSAA{exam === "jee-main" ? " & CSAB" : ""}</span></div></header>
    <section className="cutoff-section" aria-labelledby="college-list-title"><div className="cutoff-section-heading"><div><h2 id="college-list-title">Colleges</h2><p>Search by college, city, state or institute type.</p></div></div><CollegeDirectory exam={exam} colleges={colleges} /></section>
  </main>;
}

export async function resolveCollege(exam: JeeExamId, slug: string, year?: number) {
  const college = await getCutoffCollege(slug);
  if (!college) notFound();
  if (year && !college.pages.some((page) => page.year === year)) notFound();
  if (college.examId !== exam) {
    permanentRedirect(cutoffPath(college.examId, college.id, year));
  }
  return college;
}

export async function hubMetadata(exam: JeeExamId, slug: string): Promise<Metadata> {
  const college = await getCutoffCollege(slug);
  if (!college || college.examId !== exam) return {};
  const label = examLabel(exam);
  const title = `${college.seoName} ${label} Cutoff Trends and Previous Years`;
  const description = `Compare source-backed ${college.seoName} ${label} opening and closing rank trends, then open complete year-wise cutoff tables.`;
  const canonical = cutoffPath(exam, slug);
  return { title, description, alternates: { canonical }, openGraph: { title, description, url: canonical, type: "website" } };
}

export async function yearMetadata(exam: JeeExamId, slug: string, year: number): Promise<Metadata> {
  const college = await getCutoffCollege(slug);
  const page = college?.pages.find((entry) => entry.year === year);
  if (!college || college.examId !== exam || !page) return {};
  const bodies = orderedBodyLabels(page.bodies);
  const title = `${college.seoName} Cutoff ${year}: ${examLabel(exam)} ${bodies.join(" & ")} Ranks`;
  const roundCoverage = [...page.bodies].sort((left, right) => Number(right === "josaa") - Number(left === "josaa")).map((body) => `${bodyLabel(body)} through Round ${Math.max(...(page.roundsByBody[body] ?? []))}`).join("; ");
  const description = `${college.seoName} ${year} opening and closing ranks for ${page.rowCount.toLocaleString("en-IN")} published program and seat-pool records. ${roundCoverage}.`;
  const canonical = cutoffPath(exam, slug, year);
  return { title, description, alternates: { canonical }, openGraph: { title, description, url: canonical, type: "website" } };
}

export async function CollegeHubPage({ exam, slug }: { exam: JeeExamId; slug: string }) {
  const college = await resolveCollege(exam, slug);
  const model = await getCutoffHubModel(exam, slug);
  if (!model) notFound();
  const label = examLabel(exam);
  const years = [...college.pages].sort((a, b) => b.year - a.year);
  const canonical = `${baseUrl}${cutoffPath(exam, slug)}`;
  const predictorQuery = new URLSearchParams({
    exam,
    counselling: model.selection.body,
    quota: model.selection.quota.toLowerCase(),
    category: model.selection.seatType === "OPEN" ? "gen" : model.selection.seatType.toLowerCase(),
    gender: model.selection.gender === "Gender-Neutral" ? "neutral" : "female",
  }).toString();
  const jsonLd = [{ "@context": "https://schema.org", "@type": "WebPage", name: `${college.name} ${label} cutoff trends`, url: canonical }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "JEE cutoffs", item: `${baseUrl}/jee-cutoffs` }, { "@type": "ListItem", position: 2, name: `${label} colleges`, item: `${baseUrl}/${exam}/colleges` }, { "@type": "ListItem", position: 3, name: college.name, item: canonical }] }];
  return <main className="cutoff-main"><JsonLd value={jsonLd} /><Breadcrumbs items={[{ label: "JEE cutoffs", href: "/jee-cutoffs" }, { label: `${label} colleges`, href: `/${exam}/colleges` }, { label: college.seoName }]} />
    <header className="cutoff-hero"><span className="cutoff-kicker">{label}</span><h1>{college.seoName} cutoff history</h1><p className="cutoff-lead">See how {model.offering.name} ranks changed from {years.at(-1)?.year} to {years[0]?.year}. The chart keeps counselling, quota, category and gender the same for a fair comparison.</p><div className="cutoff-actions"><Link className="cutoff-button cutoff-button-primary" href={cutoffPath(exam, slug, model.latestPage.year)}>{model.latestPage.year} cutoff</Link><Link className="cutoff-button" href={`/college-predictor?${predictorQuery}`}>Try the predictor</Link></div></header>
    <CollegeFacts college={college} coverage={`${years.at(-1)?.year}–${years[0]?.year} · ${years.length} years`} coverageLabel="Years" />
    <section className="cutoff-section"><div className="cutoff-section-heading"><div><h2>{model.offering.name}</h2><p>{bodyLabel(model.selection.body)} · {model.selection.quota} quota · {model.selection.seatType} · {model.selection.gender}</p></div></div><div className="cutoff-chart-card cutoff-trend-card"><CutoffChart points={model.trend} label={`${college.name} comparable cutoff trend`} /></div></section>
    <section className="cutoff-section"><div className="cutoff-section-heading"><div><h2>Cutoffs by year</h2><p>Open a year for every program and round.</p></div></div><div className="cutoff-years">{years.map((page) => <Link className="cutoff-year-link" href={cutoffPath(exam, slug, page.year)} key={page.year}>{page.year}</Link>)}</div></section>
  </main>;
}

export async function CollegeYearPage({ exam, slug, year }: { exam: JeeExamId; slug: string; year: number }) {
  const college = await resolveCollege(exam, slug, year);
  const model = await getCutoffPageModel(exam, slug, year);
  if (!model) notFound();
  const label = examLabel(exam);
  const bodies = orderedBodyLabels(model.page.bodies);
  const coverage = [...model.page.bodies].sort((left, right) => Number(right === "josaa") - Number(left === "josaa")).map((body) => `${bodyLabel(body)} Round ${Math.max(...(model.page.roundsByBody[body] ?? []))}`).join(" · ");
  const wantedSources = new Set(model.sources.map((source) => source.sourceId));
  const sources = (await getCutoffSources())
    .filter((source) => wantedSources.has(source.sourceId))
    .sort((left, right) => left.title.localeCompare(right.title, "en", { numeric: true }));
  const canonical = `${baseUrl}${cutoffPath(exam, slug, year)}`;
  const seoRoutes = await getJeeSeoRoutes();
  const programRoutes = seoRoutes.filter((route) => route.routeType === "program" && route.examId === exam && route.collegeId === slug && route.year === year);
  const profileRoutes = seoRoutes.filter((route) => route.routeType === "profile" && route.examId === exam && route.collegeId === slug && route.year === year).map((route) => ({ path: route.path, offeringId: route.offeringId!, body: route.body!, quota: route.quota!, seatType: route.seatType!, gender: route.gender! }));
  const programRouteByOffering = new Map(programRoutes.map((route) => [route.offeringId, route]));
  const jsonLd = [{ "@context": "https://schema.org", "@type": "WebPage", name: `${college.name} cutoff ${year}`, url: canonical, dateModified: model.page.lastChangedAt }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "JEE cutoffs", item: `${baseUrl}/jee-cutoffs` }, { "@type": "ListItem", position: 2, name: `${label} colleges`, item: `${baseUrl}/${exam}/colleges` }, { "@type": "ListItem", position: 3, name: college.name, item: `${baseUrl}${cutoffPath(exam, slug)}` }, { "@type": "ListItem", position: 4, name: String(year), item: canonical }] }];
  return <main className="cutoff-main"><JsonLd value={jsonLd} /><Breadcrumbs items={[{ label: "JEE cutoffs", href: "/jee-cutoffs" }, { label: `${label} colleges`, href: `/${exam}/colleges` }, { label: college.seoName, href: cutoffPath(exam, slug) }, { label: String(year) }]} />
    <header className="cutoff-hero"><span className="cutoff-kicker">{label} · {bodies.join(" & ")}</span><h1>{college.seoName} cutoff {year}</h1><p className="cutoff-lead">Opening and closing ranks for every available program and seat pool. Use the filters to match your counselling round, quota, category and gender.</p><div className="cutoff-hero-meta"><span>{model.page.rowCount.toLocaleString("en-IN")} rank records</span><span>{coverage}</span></div></header>
    <CollegeFacts college={college} coverage={coverage} />
    <section className="cutoff-year-nav" aria-labelledby="cutoff-years-title"><h2 id="cutoff-years-title">Other years</h2><div className="cutoff-years">{[...college.pages].sort((a, b) => b.year - a.year).map((page) => <Link className="cutoff-year-link" aria-current={page.year === year ? "page" : undefined} href={cutoffPath(exam, slug, page.year)} key={page.year}>{page.year}</Link>)}</div></section>
    <section className="cutoff-section" aria-labelledby="program-directory-title"><div className="cutoff-section-heading"><div><h2 id="program-directory-title">Programs &amp; degrees</h2><p>Choose a degree and duration to see every available seat pool.</p></div><span className="cutoff-result-count">{programRoutes.length.toLocaleString("en-IN")} programs</span></div><div className="cutoff-program-list">{model.programs.map((program) => { const route = programRouteByOffering.get(program.id); return route ? <Link href={route.path} key={program.id}><strong>{program.name}</strong><span>{program.degree} · {program.durationYears} years</span></Link> : null; })}</div></section>
    <CutoffExplorer release={model.catalog.releaseVersion} exam={exam} college={slug} year={year} profileRoutes={profileRoutes} initialSelection={model.defaultSelection} initialFilters={model.filterOptions} initialRows={model.tableRows} initialTotal={model.tableTotal} initialChart={model.chart} />
    <div className="cutoff-copy-grid"><section className="cutoff-info-card"><h2>Reading the ranks</h2><p><strong>Opening rank</strong> is where admission started for the selected seat pool. <strong>Closing rank</strong> is where it ended. Lower ranks are more competitive.</p><p>Quota, category and gender use separate rank lists. “Not specified in source” is shown as-is.</p></section><section className="cutoff-info-card"><h2>JoSAA and CSAB</h2><p>JoSAA and CSAB are separate counselling processes, so their rounds are never mixed. CSAB appears only where that college and year have special-round data.</p><p>Past cutoffs are a reference, not an admission guarantee.</p></section></div>
    <section className="cutoff-source-card"><div><h2>Source records</h2><p>Publisher records used for this college and year.</p></div><ul className="cutoff-source-list">{sources.map((source) => <li key={source.sourceId}><strong>{source.title}</strong><span>{source.officialDomain}</span></li>)}</ul><p className="cutoff-disclaimer" data-nosnippet>DEETNUTS is independent of JoSAA, CSAB, NTA and the colleges listed. Public cutoff pages are open to everyone. Always confirm admission decisions on the applicable official portal; see <Link href="/compliance/data-sources-and-licensing">sources &amp; methodology</Link>.</p></section>
  </main>;
}

export async function getDirectory(exam: JeeExamId) {
  return getCutoffColleges(exam);
}
