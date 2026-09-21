import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import CutoffChart from "./CutoffChart";
import { bodyLabel, examLabel, genderLabel } from "@/lib/jee-cutoffs/repository";
import {
  getJeeSeoRoutes,
  getProfilePageModel,
  getProgramPageModel,
  profileDifference,
  profileLabel,
  seatPoolShortLabel,
} from "@/lib/jee-cutoffs/seo";
import { SeatPoolTable } from "./SeatPoolTable";
import type { CutoffSourceRegistryEntry, JeeExamId, JeeSeoRoute } from "@/lib/jee-cutoffs/types";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

const baseUrl = PRODUCTION_SITE_URL;

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

const categoryOrder = ["OPEN", "OPEN (PwD)", "EWS", "EWS (PwD)", "OBC-NCL", "OBC-NCL (PwD)", "SC", "SC (PwD)", "ST", "ST (PwD)"];
const quotaOrder = ["AI", "OS", "HS"];
const genderOrder = ["Gender-Neutral", "Female-only"];
const bodyOrder = ["josaa", "csab"];
const diffFieldRank = { seatType: 0, gender: 1, quota: 2, body: 3 } as const;

function orderIndex(value: string | null, order: readonly string[]) {
  const index = order.indexOf(value ?? "");
  return index === -1 ? order.length : index;
}

function roundText(count: number) {
  return count === 1 ? "1 round" : `${count} rounds`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function siblingCell(label: string, value: string, changed: boolean) {
  return `<span data-label="${escapeHtml(label)}" data-changed="${changed ? "true" : "false"}">${escapeHtml(value)}</span>`;
}

function SiblingPools({ current, siblings }: { current: JeeSeoRoute; siblings: JeeSeoRoute[] }) {
  if (!siblings.length) return null;
  const items = [...siblings].sort((left, right) => {
    const leftDiff = profileDifference(current, left);
    const rightDiff = profileDifference(current, right);
    const leftKey = leftDiff.fields.map((field) => diffFieldRank[field]).sort((a, b) => a - b).join(",");
    const rightKey = rightDiff.fields.map((field) => diffFieldRank[field]).sort((a, b) => a - b).join(",");
    return (
      leftDiff.fields.length - rightDiff.fields.length ||
      leftKey.localeCompare(rightKey) ||
      orderIndex(left.seatType, categoryOrder) - orderIndex(right.seatType, categoryOrder) ||
      orderIndex(left.gender ? genderLabel(left.gender) : null, genderOrder) - orderIndex(right.gender ? genderLabel(right.gender) : null, genderOrder) ||
      orderIndex(left.quota, quotaOrder) - orderIndex(right.quota, quotaOrder) ||
      orderIndex(left.body, bodyOrder) - orderIndex(right.body, bodyOrder) ||
      left.path.localeCompare(right.path)
    );
  });
  return (
    <section className="cutoff-section" aria-labelledby="other-seat-pools-title">
      <div className="cutoff-section-heading">
        <div>
          <h2 id="other-seat-pools-title">Other seat pools</h2>
          <p>Bold values differ from this page.</p>
        </div>
        <span className="cutoff-result-count">{siblings.length.toLocaleString("en-IN")} pools</span>
      </div>
      <div className="cutoff-sibling-board">
        <div className="cutoff-sibling-head" aria-hidden="true">
          <span>Counselling</span>
          <span>Quota</span>
          <span>Category</span>
          <span>Gender</span>
          <span>Rounds</span>
        </div>
        <div className="cutoff-sibling-current" aria-current="page" aria-label={`${profileLabel(current)}, this page`}>
          <span data-label="Counselling">{current.body ? bodyLabel(current.body) : "—"}</span>
          <span data-label="Quota">{current.quota}</span>
          <span data-label="Category">{current.seatType}</span>
          <span data-label="Gender">{current.gender ? genderLabel(current.gender) : "—"}</span>
          <span>This page</span>
        </div>
        {items.map((sibling) => {
          const changed = new Set(profileDifference(current, sibling).fields);
          return (
            <a
              href={sibling.path}
              key={sibling.path}
              aria-label={`${profileLabel(sibling)}, ${roundText(sibling.roundCount)}`}
              dangerouslySetInnerHTML={{
                __html: [
                  siblingCell("Counselling", sibling.body ? bodyLabel(sibling.body) : "—", changed.has("body")),
                  siblingCell("Quota", sibling.quota ?? "—", changed.has("quota")),
                  siblingCell("Category", sibling.seatType ?? "—", changed.has("seatType")),
                  siblingCell("Gender", sibling.gender ? genderLabel(sibling.gender) : "—", changed.has("gender")),
                  `<span data-label="Rounds">${sibling.roundCount}</span>`,
                ].join(""),
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

function SourceContext({ sources }: { sources: CutoffSourceRegistryEntry[] }) {
  const ordered = [...sources].sort((left, right) => left.title.localeCompare(right.title, "en", { numeric: true }));
  return <section className="cutoff-source-card"><div><h2>Source records</h2><p>Publisher records used for this exact page.</p></div><ul className="cutoff-source-list">{ordered.map((source) => <li key={source.sourceId}><strong>{source.title}</strong><span>{source.officialDomain}</span></li>)}</ul><p className="cutoff-disclaimer" data-nosnippet>DEETNUTS is independent of the counselling authorities and colleges listed. Public cutoff pages are open to everyone. Verify admission decisions on the applicable official portal; see <Link href="/compliance/data-sources-and-licensing">sources &amp; methodology</Link>.</p></section>;
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
  const includeBody = new Set(model.profiles.map((profile) => profile.route.body)).size > 1;
  const jsonLd = pageJsonLd(`${model.college.name} ${model.offering.name} cutoff ${year}`, canonical, [
    { name: "JEE cutoffs", item: `${baseUrl}/jee-cutoffs` },
    { name: `${examLabel(exam)} colleges`, item: `${baseUrl}/${exam}/colleges` },
    { name: model.college.name, item: `${baseUrl}${collegePath}` },
    { name: String(year), item: `${baseUrl}${yearPath}` },
    { name: model.offering.name, item: canonical },
  ]);
  return <main className="cutoff-main"><JsonLd value={jsonLd} /><Breadcrumbs items={[{ label: "JEE cutoffs", href: "/jee-cutoffs" }, { label: `${examLabel(exam)} colleges`, href: `/${exam}/colleges` }, { label: model.college.seoName, href: collegePath }, { label: String(year), href: yearPath }, { label: model.offering.name }]} />
    <header className="cutoff-hero"><span className="cutoff-kicker">{examLabel(exam)} · {model.offering.degree} · {model.offering.durationYears} years</span><h1>{model.college.seoName} {model.offering.name} cutoff {year}</h1><p className="cutoff-lead">Every published counselling, quota, category and gender profile for this exact offering.</p><div className="cutoff-hero-meta"><span>{model.profiles.length.toLocaleString("en-IN")} profiles</span><span>{model.route.rowCount.toLocaleString("en-IN")} rank records</span><span>Release {model.release}</span></div></header>
    <section className="cutoff-section"><div className="cutoff-section-heading"><div><h2>Comparable round trend</h2><p>{seatPoolShortLabel(model.defaultProfile.route, includeBody)}</p></div><Link className="cutoff-button" href={model.defaultProfile.route.path}>Open this seat pool</Link></div><div className="cutoff-chart-card cutoff-trend-card"><CutoffChart points={model.chart} label={`${model.offering.name} round cutoff trend`} /></div></section>
    <section className="cutoff-section" aria-labelledby="profile-list-title"><div className="cutoff-section-heading"><div><h2 id="profile-list-title">Seat pools</h2><p>Latest closing rank for each quota, category and gender.</p></div></div>
      <SeatPoolTable
        offeringName={model.offering.name}
        release={model.release}
        profiles={model.profiles.flatMap((profile) => {
          const route = profile.route;
          if (!route.body || !route.quota || !route.seatType || !route.gender) return [];
          return [{
            path: route.path,
            body: route.body,
            bodyLabel: bodyLabel(route.body),
            quota: route.quota,
            seatType: route.seatType,
            gender: route.gender,
            genderLabel: genderLabel(route.gender),
            latestRound: profile.latestRound,
            openingRank: profile.openingRank,
            closingRank: profile.closingRank,
            indexable: route.indexable,
          }];
        })}
      />
    </section>
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
  const jsonLd = pageJsonLd(`${model.college.name} ${model.offering.name} ${label} cutoff`, canonical, [
    { name: "JEE cutoffs", item: `${baseUrl}/jee-cutoffs` },
    { name: model.college.name, item: `${baseUrl}/${model.route.examId}/colleges/${model.route.collegeId}` },
    { name: String(model.route.year), item: `${baseUrl}${yearPath}` },
    { name: model.offering.name, item: `${baseUrl}${model.programPath}` },
    { name: label, item: canonical },
  ]);
  return (
    <main className="cutoff-main">
      <JsonLd value={jsonLd} />
      <Breadcrumbs
        items={[
          { label: "JEE cutoffs", href: "/jee-cutoffs" },
          { label: model.college.seoName, href: `/${model.route.examId}/colleges/${model.route.collegeId}` },
          { label: String(model.route.year), href: yearPath },
          { label: model.offering.name, href: model.programPath },
          { label },
        ]}
      />
      <header className="cutoff-hero">
        <span className="cutoff-kicker">
          {examLabel(model.route.examId!)} · {bodyLabel(model.route.body!)}
        </span>
        <h1>
          {model.college.seoName} {model.offering.name} cutoff {model.route.year}
        </h1>
        <p className="cutoff-lead">
          {model.route.quota} quota · {model.route.seatType} · {genderLabel(model.route.gender!)} · {model.offering.degree}, {model.offering.durationYears} years.
        </p>
        <div className="cutoff-hero-meta">
          <span>
            {model.rows.length} published round{model.rows.length === 1 ? "" : "s"}
          </span>
          <span>{model.route.indexable ? "Multi-round profile" : "One published round"}</span>
          <span>Release {model.release}</span>
        </div>
      </header>
      <section className="cutoff-section">
        <div className="cutoff-section-heading">
          <div>
            <h2>Opening and closing ranks</h2>
            <p>Lower is better. Missing counselling rounds are shown as gaps.</p>
          </div>
        </div>
        <div className="cutoff-chart-card cutoff-trend-card">
          <CutoffChart points={model.chart} label={`${seatPoolShortLabel(model.route)} opening and closing ranks`} />
        </div>
      </section>
      <section className="cutoff-table-section">
        <div className="cutoff-section-heading">
          <h2>Published rounds</h2>
        </div>
        <div className="cutoff-table-scroll">
          <table className="cutoff-table" data-release={model.release}>
            <caption>Opening and closing ranks by round</caption>
            <thead>
              <tr>
                <th scope="col">Round</th>
                <th scope="col">Opening rank</th>
                <th scope="col">Closing rank</th>
              </tr>
            </thead>
            <tbody>
              {model.rows.map((row) => (
                <tr id={`round-${row.round}`} key={row.round}>
                  <th scope="row" data-label="Round" data-field="round">
                    {row.round}
                  </th>
                  <td data-label="Opening" data-field="opening-rank">
                    {row.opening_rank.toLocaleString("en-IN")}
                  </td>
                  <td data-label="Closing" data-field="closing-rank">
                    <strong>{row.closing_rank.toLocaleString("en-IN")}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {model.rows.length === 1 ? (
          <p className="cutoff-muted">
            Only Round {first.round} is present for this exact source profile; no trend is inferred.
          </p>
        ) : null}
      </section>
      <SiblingPools current={model.route} siblings={model.siblingProfiles} />
      <SourceContext sources={model.sources} />
    </main>
  );
}
