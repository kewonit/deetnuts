import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import CutoffChart from "./CutoffChart";
import { Crumbs, JsonLd, SourceCard, plural } from "./JeeParts";
import {
  bodyLabel,
  examLabel,
  genderLabel,
} from "@/lib/jee-cutoffs/repository";
import {
  getJeeSeoRoutes,
  getProfilePageModel,
  getProgramPageModel,
  profileDifference,
  profileLabel,
  seatPoolShortLabel,
} from "@/lib/jee-cutoffs/seo";
import { SeatPoolTable } from "./SeatPoolTable";
import type {
  CutoffSourceRegistryEntry,
  JeeExamId,
  JeeSeoRoute,
} from "@/lib/jee-cutoffs/types";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";
import "@/components/admissions/mht-explorer.css";
import "./jee.css";

const baseUrl = PRODUCTION_SITE_URL;

async function redirectExactWrongExam(
  pathname: string,
  exam: JeeExamId,
): Promise<never> {
  const suffix = pathname.slice(`/${exam}`.length);
  const candidate = (await getJeeSeoRoutes()).find(
    (route) =>
      route.path.endsWith(suffix) && route.examId && route.examId !== exam,
  );
  if (candidate) permanentRedirect(candidate.path);
  notFound();
}

function pageJsonLd(
  name: string,
  canonical: string,
  crumbs: Array<{ name: string; item: string }>,
) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name,
      url: canonical,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        ...crumb,
      })),
    },
  ];
}

const categoryOrder = [
  "OPEN",
  "OPEN (PwD)",
  "EWS",
  "EWS (PwD)",
  "OBC-NCL",
  "OBC-NCL (PwD)",
  "SC",
  "SC (PwD)",
  "ST",
  "ST (PwD)",
];
const quotaOrder = ["AI", "OS", "HS"];
const genderOrder = ["Gender-Neutral", "Female-only"];
const bodyOrder = ["josaa", "csab"];
const diffFieldRank = { seatType: 0, gender: 1, quota: 2, body: 3 } as const;

function orderIndex(value: string | null, order: readonly string[]) {
  const index = order.indexOf(value ?? "");
  return index === -1 ? order.length : index;
}

function sourceSummary(sources: CutoffSourceRegistryEntry[]) {
  const byBody = new Map<string, { year: number; rounds: number[] }>();
  for (const source of sources) {
    const entry = byBody.get(source.body) ?? { year: source.year, rounds: [] };
    entry.rounds.push(source.round);
    byBody.set(source.body, entry);
  }
  return [...byBody.entries()]
    .sort(
      ([left], [right]) =>
        orderIndex(left, bodyOrder) - orderIndex(right, bodyOrder),
    )
    .map(
      ([body, entry]) =>
        `${bodyLabel(body as "josaa" | "csab")} ${entry.year} Rounds 1–${Math.max(...entry.rounds)}`,
    )
    .join(" · ");
}

function OfferingChips({
  exam,
  degree,
  years,
  extra = [],
}: {
  exam: JeeExamId;
  degree: string;
  years: number;
  extra?: string[];
}) {
  return (
    <p className="mht-college-meta">
      {[examLabel(exam), degree, `${years} years`, ...extra].map((fact) => (
        <span key={fact} className="mht-chip">
          {fact}
        </span>
      ))}
    </p>
  );
}

function SiblingPools({
  current,
  siblings,
}: {
  current: JeeSeoRoute;
  siblings: JeeSeoRoute[];
}) {
  if (!siblings.length) return null;
  const items = [...siblings].sort((left, right) => {
    const leftDiff = profileDifference(current, left);
    const rightDiff = profileDifference(current, right);
    const leftKey = leftDiff.fields
      .map((field) => diffFieldRank[field])
      .sort((a, b) => a - b)
      .join(",");
    const rightKey = rightDiff.fields
      .map((field) => diffFieldRank[field])
      .sort((a, b) => a - b)
      .join(",");
    return (
      leftDiff.fields.length - rightDiff.fields.length ||
      leftKey.localeCompare(rightKey) ||
      orderIndex(left.seatType, categoryOrder) -
        orderIndex(right.seatType, categoryOrder) ||
      orderIndex(left.gender ? genderLabel(left.gender) : null, genderOrder) -
        orderIndex(
          right.gender ? genderLabel(right.gender) : null,
          genderOrder,
        ) ||
      orderIndex(left.quota, quotaOrder) -
        orderIndex(right.quota, quotaOrder) ||
      orderIndex(left.body, bodyOrder) - orderIndex(right.body, bodyOrder) ||
      left.path.localeCompare(right.path)
    );
  });
  const cell = (value: string, changed: boolean) => (
    <td data-changed={changed ? "" : undefined}>{value}</td>
  );
  return (
    <section className="mht-section" aria-labelledby="other-seat-pools-title">
      <div className="mht-section-head">
        <h2 id="other-seat-pools-title">
          Other seat pools <span className="mht-count">{siblings.length}</span>
        </h2>
      </div>
      <div className="mht-card jee-table-scroll">
        <table className="mht-table jee-siblings">
          <caption className="mht-sr">
            Other seat pools for this program; values that differ from this page
            are bold
          </caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Counselling</th>
              <th scope="col">Quota</th>
              <th scope="col">Gender</th>
              <th scope="col" className="mht-num">
                Rounds
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((sibling) => {
              const changed = new Set(
                profileDifference(current, sibling).fields,
              );
              return (
                <tr key={sibling.path}>
                  <th
                    scope="row"
                    data-changed={changed.has("seatType") ? "" : undefined}
                  >
                    <Link
                      href={sibling.path}
                      aria-label={profileLabel(sibling)}
                    >
                      {sibling.seatType ?? "—"}
                    </Link>
                  </th>
                  {cell(
                    sibling.body ? bodyLabel(sibling.body) : "—",
                    changed.has("body"),
                  )}
                  {cell(sibling.quota ?? "—", changed.has("quota"))}
                  {cell(
                    sibling.gender ? genderLabel(sibling.gender) : "—",
                    changed.has("gender"),
                  )}
                  <td className="mht-num">{sibling.roundCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
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
  return {
    title,
    description,
    alternates: { canonical: model.route.path },
    openGraph: { title, description, url: model.route.path, type: "website" },
  };
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
    robots: model.route.indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: { title, description, url: model.route.path, type: "website" },
  };
}

export async function ProgramPage({
  exam,
  college,
  year,
  programSlug,
}: {
  exam: JeeExamId;
  college: string;
  year: number;
  programSlug: string;
}) {
  const pathname = `/${exam}/colleges/${college}/cutoffs/${year}/programs/${programSlug}`;
  const model = await getProgramPageModel(exam, college, year, programSlug);
  if (!model) return redirectExactWrongExam(pathname, exam);
  const collegePath = `/${exam}/colleges/${college}`;
  const yearPath = `${collegePath}/cutoffs/${year}`;
  const canonical = `${baseUrl}${model.route.path}`;
  const includeBody =
    new Set(model.profiles.map((profile) => profile.route.body)).size > 1;
  const headline = model.defaultProfile;
  const bodies = [
    ...new Set(
      model.profiles.map((profile) => profile.route.body).filter(Boolean),
    ),
  ].sort(
    (left, right) => orderIndex(left, bodyOrder) - orderIndex(right, bodyOrder),
  );
  const jsonLd = pageJsonLd(
    `${model.college.name} ${model.offering.name} cutoff ${year}`,
    canonical,
    [
      { name: "JEE cutoffs", item: `${baseUrl}/jee-cutoffs` },
      {
        name: `${examLabel(exam)} colleges`,
        item: `${baseUrl}/${exam}/colleges`,
      },
      { name: model.college.name, item: `${baseUrl}${collegePath}` },
      { name: String(year), item: `${baseUrl}${yearPath}` },
      { name: model.offering.name, item: canonical },
    ],
  );
  return (
    <main className="mht-main jee-page">
      <JsonLd value={jsonLd} />
      <div className="mht-page">
        <Crumbs
          items={[
            { label: "JEE", href: "/jee-cutoffs" },
            { label: model.college.seoName, href: collegePath },
            { label: String(year), href: yearPath },
            { label: model.offering.name },
          ]}
        />
        <header className="jee-head">
          <h1 className="mht-h1">
            {model.college.seoName} {model.offering.name} cutoff {year}
          </h1>
          <OfferingChips
            exam={exam}
            degree={model.offering.degree}
            years={model.offering.durationYears}
          />
          <div className="jee-actions">
            <Link className="mht-btn mht-btn-primary" href={yearPath}>
              All {year} programs
            </Link>
          </div>
        </header>
        <dl className="mht-stats">
          <div>
            <dt>Closing rank</dt>
            <dd>
              <strong>{headline.closingRank.toLocaleString("en-IN")}</strong>
              <Link href={headline.route.path}>
                {seatPoolShortLabel(headline.route, includeBody)}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Opening rank</dt>
            <dd>
              <strong>{headline.openingRank.toLocaleString("en-IN")}</strong>
              <span>Round {headline.latestRound}</span>
            </dd>
          </div>
          <div>
            <dt>Seat pools</dt>
            <dd>
              <strong>{model.profiles.length}</strong>
              <span>{plural(model.route.rowCount, "record")}</span>
            </dd>
          </div>
          <div>
            <dt>Counselling</dt>
            <dd>
              <strong>
                {bodies.map((body) => bodyLabel(body!)).join(" · ")}
              </strong>
              <span>{year}</span>
            </dd>
          </div>
        </dl>
      </div>

      <section className="mht-section" aria-labelledby="jee-round-title">
        <div className="mht-page">
          <div className="mht-section-head">
            <h2 id="jee-round-title">Ranks by round</h2>
            <Link className="mht-arrow-link" href={headline.route.path}>
              {seatPoolShortLabel(headline.route, includeBody)}
            </Link>
          </div>
          <div className="mht-card jee-chart-card">
            <CutoffChart
              points={model.chart}
              label={`${model.offering.name} round cutoff trend`}
            />
          </div>
        </div>
      </section>

      <section className="mht-section" aria-labelledby="profile-list-title">
        <div className="mht-page mht-page-wide">
          <div className="mht-section-head">
            <h2 id="profile-list-title">
              Seat pools{" "}
              <span className="mht-count">{model.profiles.length}</span>
            </h2>
          </div>
          <SeatPoolTable
            offeringName={model.offering.name}
            release={model.release}
            profiles={model.profiles.flatMap((profile) => {
              const route = profile.route;
              if (
                !route.body ||
                !route.quota ||
                !route.seatType ||
                !route.gender
              )
                return [];
              return [
                {
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
                },
              ];
            })}
          />
          {model.adjacentYears.length ? (
            <nav className="jee-years" aria-label="Other years">
              {model.adjacentYears.map((route) => (
                <Link className="mht-chip" href={route.path} key={route.path}>
                  {route.year}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </section>

      <div className="mht-page">
        <SourceCard
          summary={sourceSummary(model.sources)}
          sources={model.sources}
        />
      </div>
    </main>
  );
}

export async function ProfilePage({ routePath }: { routePath: string }) {
  const model = await getProfilePageModel(routePath);
  const exam = routePath.split("/")[1] as JeeExamId;
  if (!model) return redirectExactWrongExam(routePath, exam);
  const route = model.route;
  const yearPath = `/${route.examId}/colleges/${route.collegeId}/cutoffs/${route.year}`;
  const canonical = `${baseUrl}${route.path}`;
  const label = profileLabel(route);
  const first = model.rows[0];
  const last = model.rows.at(-1)!;
  const moved = last.closing_rank - first.closing_rank;
  const jsonLd = pageJsonLd(
    `${model.college.name} ${model.offering.name} ${label} cutoff`,
    canonical,
    [
      { name: "JEE cutoffs", item: `${baseUrl}/jee-cutoffs` },
      {
        name: model.college.name,
        item: `${baseUrl}/${route.examId}/colleges/${route.collegeId}`,
      },
      { name: String(route.year), item: `${baseUrl}${yearPath}` },
      { name: model.offering.name, item: `${baseUrl}${model.programPath}` },
      { name: label, item: canonical },
    ],
  );
  return (
    <main className="mht-main jee-page">
      <JsonLd value={jsonLd} />
      <div className="mht-page">
        <Crumbs
          items={[
            { label: "JEE", href: "/jee-cutoffs" },
            {
              label: model.college.seoName,
              href: `/${route.examId}/colleges/${route.collegeId}`,
            },
            { label: String(route.year), href: yearPath },
            { label: model.offering.name, href: model.programPath },
            { label: route.seatType ?? "Seat pool" },
          ]}
        />
        <header className="jee-head">
          <h1 className="mht-h1">
            {model.college.seoName} {model.offering.name} cutoff {route.year}
          </h1>
          <p className="mht-college-meta">
            {[
              bodyLabel(route.body!),
              `${route.quota} quota`,
              route.seatType!,
              genderLabel(route.gender!),
              model.offering.degree,
            ].map((fact) => (
              <span key={fact} className="mht-chip">
                {fact}
              </span>
            ))}
          </p>
          <div className="jee-actions">
            <Link className="mht-btn mht-btn-primary" href={model.programPath}>
              All seat pools
            </Link>
          </div>
        </header>
        <dl className="mht-stats">
          <div>
            <dt>Closing rank</dt>
            <dd>
              <strong>{last.closing_rank.toLocaleString("en-IN")}</strong>
              <span>Round {last.round}</span>
            </dd>
          </div>
          <div>
            <dt>Opening rank</dt>
            <dd>
              <strong>{last.opening_rank.toLocaleString("en-IN")}</strong>
              <span>Round {last.round}</span>
            </dd>
          </div>
          <div>
            <dt>Rounds</dt>
            <dd>
              <strong>{model.rows.length}</strong>
              <span>
                {route.indexable ? "Published" : "One published round"}
              </span>
            </dd>
          </div>
          <div>
            <dt>Closing rank moved</dt>
            <dd>
              <strong>
                {model.rows.length > 1
                  ? `${moved >= 0 ? "+" : "−"}${Math.abs(moved).toLocaleString("en-IN")}`
                  : "—"}
              </strong>
              <span>
                {model.rows.length > 1
                  ? `Round ${first.round} to ${last.round}`
                  : "Needs two rounds"}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <section className="mht-section" aria-labelledby="jee-round-title">
        <div className="mht-page">
          <div className="mht-section-head">
            <h2 id="jee-round-title">Ranks by round</h2>
          </div>
          <div className="mht-card jee-chart-card">
            <CutoffChart
              points={model.chart}
              label={`${seatPoolShortLabel(route)} opening and closing ranks`}
            />
          </div>
          <div className="mht-card">
            <table className="mht-table" data-release={model.release}>
              <caption className="mht-sr">
                Published rounds: opening and closing ranks
              </caption>
              <thead>
                <tr>
                  <th scope="col">Published rounds</th>
                  <th scope="col" className="mht-num">
                    Opening
                  </th>
                  <th scope="col" className="mht-num">
                    Closing
                  </th>
                </tr>
              </thead>
              <tbody>
                {model.rows.map((row) => (
                  <tr id={`round-${row.round}`} key={row.round}>
                    <th scope="row" data-field="round">
                      Round {row.round}
                    </th>
                    <td className="mht-num" data-field="opening-rank">
                      {row.opening_rank.toLocaleString("en-IN")}
                    </td>
                    <td className="mht-num" data-field="closing-rank">
                      <strong>
                        {row.closing_rank.toLocaleString("en-IN")}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {model.rows.length === 1 ? (
            <p className="mht-note">
              Only Round {first.round} is published for this seat.
            </p>
          ) : null}
        </div>
      </section>

      <div className="mht-page">
        <SiblingPools current={route} siblings={model.siblingProfiles} />
        <SourceCard
          summary={sourceSummary(model.sources)}
          sources={model.sources}
        />
      </div>
    </main>
  );
}
