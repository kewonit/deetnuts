import Link from "next/link";
import type {
  CutoffCollegeCatalogEntry,
  CutoffSelection,
  CutoffSourceRegistryEntry,
  JeeExamId,
} from "@/lib/jee-cutoffs/types";

export function plural(value: number, noun: string) {
  return `${value.toLocaleString("en-IN")} ${noun}${value === 1 ? "" : "s"}`;
}

export function JsonLd({ value }: { value: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(value).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function Crumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mht-crumbs">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="jee-crumb">
          {index ? <span aria-hidden="true">/</span> : null}
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function FactChips({
  college,
  extra = [],
}: {
  college: CutoffCollegeCatalogEntry;
  extra?: string[];
}) {
  const facts = [
    college.type,
    [college.city, college.state].filter(Boolean).join(", "),
    college.established ? `Est. ${college.established}` : "",
    ...extra,
  ].filter(Boolean);
  return (
    <p className="mht-college-meta">
      {facts.map((fact) => (
        <span key={fact} className="mht-chip">
          {fact}
        </span>
      ))}
    </p>
  );
}

// Opens the predictor on the same counselling, quota, category and gender as the page.
export function predictorHref(
  exam: JeeExamId,
  selection: Pick<CutoffSelection, "body" | "quota" | "seatType" | "gender">,
) {
  return `/college-predictor?${new URLSearchParams({
    exam,
    counselling: selection.body,
    quota: selection.quota.toLowerCase(),
    category:
      selection.seatType === "OPEN" ? "gen" : selection.seatType.toLowerCase(),
    gender: selection.gender === "Gender-Neutral" ? "neutral" : "female",
  })}`;
}

export function SourceCard({
  summary,
  sources,
}: {
  summary: string;
  sources: CutoffSourceRegistryEntry[];
}) {
  const publishers = [...new Set(sources.map((source) => source.publisher))];
  const domains = [...new Set(sources.map((source) => source.officialDomain))];
  return (
    <section
      id="source"
      className="mht-section"
      aria-labelledby="jee-source-title"
    >
      <div className="mht-section-head">
        <h2 id="jee-source-title">Source records</h2>
      </div>
      <div className="mht-card mht-source">
        <div>
          <h3>{publishers.join(", ")}</h3>
          <p className="mht-source-big">{summary}</p>
          <p>{domains.join(", ")}</p>
          <Link
            className="mht-btn mht-btn-sm"
            href="/compliance/data-sources-and-licensing"
          >
            Methodology
          </Link>
        </div>
        <div>
          <h3>{plural(sources.length, "record")}</h3>
          <ul className="jee-source-list">
            {sources.map((source) => (
              <li key={source.sourceId}>
                <a href={source.sourceLocator} target="_blank" rel="noopener">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
