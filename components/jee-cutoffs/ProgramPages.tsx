import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import CutoffChart from "./CutoffChart";
import { bodyLabel, examLabel, genderLabel } from "@/lib/jee-cutoffs/repository";
import {
  getJeeSeoRoutes,
  getProfilePageModel,
  getProgramPageModel,
  profileLabel,
} from "@/lib/jee-cutoffs/seo";
import type { CutoffSourceRegistryEntry, JeeExamId, JeeSeoRoute } from "@/lib/jee-cutoffs/types";

const baseUrl = "https://deetnuts.com";

function JsonLd({ value }: { value: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(value).replace(/</g, "\\u003c") }} />;
}

function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <nav className="cutoff-breadcrumbs" aria-label="Breadcrumb">{items.map((item, index) => <span key={`${item.label}-${index}`}>{index ? <span aria-hidden="true">›</span> : null}{item.href ? <Link href={item.href}>{item.label}</Link> : item.label}</span>)}</nav>;
}

async function redirectExactWrongExam(pathname: string, exam: JeeExamId): Promise<never> {
  const suffix = pathname.slice(`/${exam}`.length);
  const candidate = (await getJeeSeoRoutes()).find(
    (route) => route.path.endsWith(suffix) && route.examId && route.examId !== exam,
  );
  if (candidate) permanentRedirect(candidate.path);
  notFound();
}

function pageJsonLd(name: string, canonical: string, crumbs: Array<{ name: string; item: string }>) {
  return [
    { "@context": "https://schema.org", "@type": "WebPage", name, url: canonical },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, ...crumb })) },
  ];
}

function SourceContext({ sources }: { sources: CutoffSourceRegistryEntry[] }) {
  const ordered = [...sources].sort((left, right) => left.title.localeCompare(right.title, "en", { numeric: true }));
  return <section className="cutoff-source-card"><div><h2>Source records</h2><p>Publisher records used for this exact page.</p></div><ul className="cutoff-source-list">{ordered.map((source) => <li key={source.sourceId}><strong>{source.title}</strong><span>{source.officialDomain}</span></li>)}</ul><p className="cutoff-disclaimer" data-nosnippet>DEETNUTS is independent of the counselling authorities and colleges listed. Verify admission decisions on the applicable official portal. Source access does not grant reuse rights; see <Link href="/compliance/data-sources-and-licensing">data &amp; licensing</Link>.</p></section>;
}

export async function programMetadata(
  exam: JeeExamId,
  college: string,
  year: number,
  programSlug: string,
): Promise<Metadata> {
  const model = await getProgramPageModel(exam, college, year, programSlug);
  if (!model) return {};
  const title = `${model.college.seoName} ${model.offering.name} Cutoff ${year}: ${examLabel(exam)} Ranks`;
  const description = `${model.offering.degree}, ${model.offering.durationYears} years: ${model.profiles.length} source-backed quota, category and gender profiles across JoSAA${model.profiles.some((profile) => profile.route.body === "csab") ? " and CSAB" : ""}.`;
  return { title, description, alternates: { canonical: model.route.path }, openGraph: { title, description, url: model.route.path, type: "website" } };
}

export async function profileMetadata(routePath: string): Promise<Metadata> {
  const model = await getProfilePageModel(routePath);
  if (!model) return {};
  const title = `${model.college.seoName} ${model.offering.name} Cutoff ${model.route.year}: ${bodyLabel(model.route.body!)} ${model.route.quota} ${model.route.seatType}`;
  const description = `${model.rows.length} published round${model.rows.length === 1 ? "" : "s"} for ${profileLabel(model.route)}, with exact opening and closing ranks.`;
  return {
    title,
    description,
    alternates: { canonical: model.route.path },
    robots: model.route.indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, url: model.route.path, type: "website" },
  };
}

export async function ProgramPage({ exam, college, year, programSlug }: { exam: JeeExamId; college: string; year: number; programSlug: string }) {
  const pathname = `/${exam}/colleges/${college}/cutoffs/${year}/programs/${programSlug}`;
  const model = await getProgramPageModel(exam, college, year, programSlug);
  if (!model) return redirectExactWrongExam(pathname, exam);
  const collegePath = `/${exam}/colleges/${college}`;
  const yearPath = `${collegePath}/cutoffs/${year}`;
  const canonical = `${baseUrl}${model.route.path}`;
  const jsonLd = pageJsonLd(`${model.college.name} ${model.offering.name} cutoff ${year}`, canonical, [
    { name: "JEE cutoffs", item: `${baseUrl}/jee-cutoffs` },
    { name: `${examLabel(exam)} colleges`, item: `${baseUrl}/${exam}/colleges` },
    { name: model.college.name, item: `${baseUrl}${collegePath}` },
    { name: String(year), item: `${baseUrl}${yearPath}` },
    { name: model.offering.name, item: canonical },
  ]);
  return <main className="cutoff-main"><JsonLd value={jsonLd} /><Breadcrumbs items={[{ label: "JEE cutoffs", href: "/jee-cutoffs" }, { label: `${examLabel(exam)} colleges`, href: `/${exam}/colleges` }, { label: model.college.seoName, href: collegePath }, { label: String(year), href: yearPath }, { label: model.offering.name }]} />
    <header className="cutoff-hero"><span className="cutoff-kicker">{examLabel(exam)} · {model.offering.degree} · {model.offering.durationYears} years</span><h1>{model.college.seoName} {model.offering.name} cutoff {year}</h1><p className="cutoff-lead">Every published counselling, quota, category and gender profile for this exact offering.</p><div className="cutoff-hero-meta"><span>{model.profiles.length.toLocaleString("en-IN")} profiles</span><span>{model.route.rowCount.toLocaleString("en-IN")} rank records</span><span>Release {model.release}</span></div></header>
    <section className="cutoff-section"><div className="cutoff-section-heading"><div><h2>Comparable round trend</h2><p>{profileLabel(model.defaultProfile.route)}</p></div><Link className="cutoff-button" href={model.defaultProfile.route.path}>Open exact profile</Link></div><div className="cutoff-chart-card cutoff-trend-card"><CutoffChart points={model.chart} label={`${model.offering.name} round cutoff trend`} /></div></section>
    <section className="cutoff-section" aria-labelledby="profile-list-title"><div className="cutoff-section-heading"><div><h2 id="profile-list-title">Seat-pool profiles</h2><p>Rounds are kept separate within each exact rank list.</p></div></div><div className="cutoff-table-scroll"><table className="cutoff-table" data-release={model.release}><caption>Available counselling profiles for {model.offering.name}</caption><thead><tr><th scope="col">Profile</th><th scope="col">Rounds</th><th scope="col">Latest round</th><th scope="col">Opening</th><th scope="col">Closing</th></tr></thead><tbody>{model.profiles.map((profile) => <tr key={profile.route.path}><th scope="row" data-label="Profile" data-field="profile"><Link href={profile.route.path}>{profileLabel(profile.route)}</Link>{profile.route.indexable ? null : <small>One published round</small>}</th><td data-label="Rounds" data-field="round-count">{profile.route.roundCount}</td><td data-label="Latest" data-field="latest-round">Round {profile.latestRound}</td><td data-label="Opening" data-field="opening-rank">{profile.openingRank.toLocaleString("en-IN")}</td><td data-label="Closing" data-field="closing-rank"><strong>{profile.closingRank.toLocaleString("en-IN")}</strong></td></tr>)}</tbody></table></div></section>
    {model.adjacentYears.length ? <section className="cutoff-year-nav"><h2>Other years</h2><div className="cutoff-years">{model.adjacentYears.map((route) => <Link className="cutoff-year-link" href={route.path} key={route.path}>{route.year}</Link>)}</div></section> : null}
    <SourceContext sources={model.sources} />
  </main>;
}

export async function ProfilePage({ routePath }: { routePath: string }) {
  const model = await getProfilePageModel(routePath);
  const exam = routePath.split("/")[1] as JeeExamId;
  if (!model) return redirectExactWrongExam(routePath, exam);
  const yearPath = `/${model.route.examId}/colleges/${model.route.collegeId}/cutoffs/${model.route.year}`;
  const canonical = `${baseUrl}${model.route.path}`;
  const label = profileLabel(model.route);
  const first = model.rows[0];
  const last = model.rows.at(-1)!;
  const difference = last.closing_rank - first.closing_rank;
  const jsonLd = pageJsonLd(`${model.college.name} ${model.offering.name} ${label} cutoff`, canonical, [
    { name: "JEE cutoffs", item: `${baseUrl}/jee-cutoffs` },
    { name: model.college.name, item: `${baseUrl}/${model.route.examId}/colleges/${model.route.collegeId}` },
    { name: String(model.route.year), item: `${baseUrl}${yearPath}` },
    { name: model.offering.name, item: `${baseUrl}${model.programPath}` },
    { name: label, item: canonical },
  ]);
  return <main className="cutoff-main"><JsonLd value={jsonLd} /><Breadcrumbs items={[{ label: "JEE cutoffs", href: "/jee-cutoffs" }, { label: model.college.seoName, href: `/${model.route.examId}/colleges/${model.route.collegeId}` }, { label: String(model.route.year), href: yearPath }, { label: model.offering.name, href: model.programPath }, { label }]} />
    <header className="cutoff-hero"><span className="cutoff-kicker">{examLabel(model.route.examId!)} · {bodyLabel(model.route.body!)}</span><h1>{model.college.seoName} {model.offering.name} cutoff {model.route.year}</h1><p className="cutoff-lead">{model.route.quota} quota · {model.route.seatType} · {genderLabel(model.route.gender!)} · {model.offering.degree}, {model.offering.durationYears} years.</p><div className="cutoff-hero-meta"><span>{model.rows.length} published round{model.rows.length === 1 ? "" : "s"}</span><span>{model.route.indexable ? "Multi-round profile" : "One published round"}</span><span>Release {model.release}</span></div></header>
    <section className="cutoff-section"><div className="cutoff-section-heading"><div><h2>Opening and closing ranks</h2><p>Lower is better. Missing counselling rounds are shown as gaps.</p></div></div><div className="cutoff-chart-card cutoff-trend-card"><CutoffChart points={model.chart} label={`${label} opening and closing ranks`} /></div></section>
    <section className="cutoff-table-section"><div className="cutoff-section-heading"><div><h2>Published rounds</h2><p>{label}</p></div></div><div className="cutoff-table-scroll"><table className="cutoff-table" data-release={model.release}><caption>Round-by-round opening and closing ranks for {label}</caption><thead><tr><th scope="col">Round</th><th scope="col">Opening rank</th><th scope="col">Closing rank</th><th scope="col">Source record</th></tr></thead><tbody>{model.rows.map((row) => <tr id={`round-${row.round}`} key={row.round}><th scope="row" data-label="Round" data-field="round">Round {row.round}</th><td data-label="Opening" data-field="opening-rank">{row.opening_rank.toLocaleString("en-IN")}</td><td data-label="Closing" data-field="closing-rank"><strong>{row.closing_rank.toLocaleString("en-IN")}</strong></td><td data-label="Source" data-field="source-id">{row.source_id}</td></tr>)}</tbody></table></div>{model.rows.length > 1 ? <p className="cutoff-muted">Closing rank moved from {first.closing_rank.toLocaleString("en-IN")} in Round {first.round} to {last.closing_rank.toLocaleString("en-IN")} in Round {last.round} ({difference >= 0 ? "+" : ""}{difference.toLocaleString("en-IN")}).</p> : <p className="cutoff-muted">Only Round {first.round} is present for this exact source profile; no trend is inferred.</p>}</section>
    {model.siblingProfiles.length ? <section className="cutoff-section"><div className="cutoff-section-heading"><div><h2>Other profiles</h2><p>Same college, year and exact offering.</p></div></div><div className="cutoff-program-list">{model.siblingProfiles.map((route: JeeSeoRoute) => <Link href={route.path} key={route.path}><strong>{profileLabel(route)}</strong><span>{route.roundCount} round{route.roundCount === 1 ? "" : "s"}</span></Link>)}</div></section> : null}
    <SourceContext sources={model.sources} />
  </main>;
}
