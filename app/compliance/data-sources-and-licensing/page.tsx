import type { Metadata } from "next";
import { PolicyPage } from "@/components/compliance/PolicyPage";
import { getCutoffSources } from "@/lib/jee-cutoffs/seo";
import { getJeeCutoffCatalog } from "@/lib/jee-cutoffs/repository";
import { COMPLIANCE } from "@/lib/compliance";

export const metadata: Metadata = {
  title: "JEE Data Sources and Methodology",
  description: "The source lineage, validation rules, release method and correction process behind DEETNUTS JEE cutoff pages.",
  alternates: { canonical: "/compliance/data-sources-and-licensing" },
};

export default async function DataSources() {
  const [catalog, sources] = await Promise.all([getJeeCutoffCatalog(), getCutoffSources()]);
  return (
    <PolicyPage
      title="JEE data sources and methodology"
      summary={`${catalog.totals.rows.toLocaleString("en-IN")} exact cutoff rows in release ${catalog.releaseVersion}, ${sources.length} source records, explicit lineage and a public page for every validated college-year combination.`}
    >
      <section id="public-access">
        <h2>Public access</h2>
        <p>DEETNUTS cutoff pages and their published facts are open to everyone. An account, payment or analytics consent is not required to read them. Default tables, headings, source references and year links are rendered as semantic HTML so people, assistive technology, search engines and respectful scrapers can access the same core information.</p>
        <p>DEETNUTS is independent of the counselling bodies and institutions named on the site. A source reference identifies where a record came from; it does not state or imply endorsement.</p>
      </section>

      <section id="published-fields">
        <h2>What is published</h2>
        <p>The JEE serving layer is built from manifest-pinned JoSAA and CSAB opening-and-closing-rank Parquet files. Each row preserves counselling body, year, round, institute, exact source offering, degree, duration, quota, seat type, gender, opening rank, closing rank and a source identifier. Predictor indexes are not used to construct these pages.</p>
        <p>Exact source offerings remain separate from optional canonical programme mappings. An offering without a verified cross-year mapping remains visible in its own year and is excluded from combined historical lines rather than guessed.</p>
      </section>

      <section id="validation">
        <h2>Validation and release controls</h2>
        <ul>
          <li>The current release reconciles {catalog.totals.rows.toLocaleString("en-IN")} rows, {catalog.totals.colleges} colleges and {catalog.totals.pages.toLocaleString("en-IN")} college-year pages.</li>
          <li>Row identity includes body, year, round, institute, source offering, degree, duration, quota, seat type and gender.</li>
          <li>Duplicate full identities, conflicting or non-positive ranks, opening rank above closing rank, unknown taxonomy, missing reviewed labels and missing sources fail the build.</li>
          <li>Missing rounds remain gaps. Different rank lists, genders, quotas, counselling bodies and degree-duration variants are not merged.</li>
          <li>Every serving artifact, source registry, SEO route artifact and catalog reference is checksum-verified before a production build.</li>
          <li>A page’s sitemap date changes only when its content hash changes; a release timestamp is not assigned to unchanged pages.</li>
        </ul>
      </section>

      <section id="source-registry">
        <h2>Source registry</h2>
        <div className="policy-table-wrap" role="region" aria-label="Cutoff source registry" tabIndex={0}>
          <table className="policy-table">
            <caption>Cutoff source records in release {catalog.releaseVersion}</caption>
            <thead><tr><th scope="col">Publisher record</th><th scope="col">Body</th><th scope="col">Year</th><th scope="col">Round</th><th scope="col">Official domain</th></tr></thead>
            <tbody>{sources.map((source) => <tr key={source.sourceId}><th scope="row">{source.title}<small className="mt-1 block font-mono text-[10px] font-normal">{source.sourceId}</small></th><td data-label="Body">{source.body}</td><td data-label="Year">{source.year}</td><td data-label="Round">{source.round}</td><td data-label="Official domain">{source.officialDomain}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section id="irregularities">
        <h2>Source irregularities preserved</h2>
        <ul>
          <li>JoSAA Round 7 is retained where published for 2017–2019.</li>
          <li>A missing JoSAA 2020 Round 3 remains a visible gap.</li>
          <li>Round counts are allowed to differ by year and counselling body.</li>
          <li><code>NA</code> gender is displayed as “not specified in source.”</li>
          <li>CSAB appears only for applicable JEE Main colleges and years.</li>
          <li>Partial current years are described as “available through Round N,” not “final.”</li>
        </ul>
      </section>

      <section id="corrections">
        <h2>Corrections</h2>
        <p>Send the canonical page URL, release version, source ID and supporting official record to <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a>. A verified correction produces a new content hash and changes the modification date only for affected pages. DEETNUTS does not silently estimate a missing rank or overwrite a historical source irregularity.</p>
      </section>
    </PolicyPage>
  );
}
