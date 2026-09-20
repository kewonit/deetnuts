import type { DataProvenance } from "@/lib/admissions/types";

export default function ProvenanceCard({ provenance }: { provenance: DataProvenance }) {
  return (
    <section id="source" className="cutoff-source-card" aria-labelledby="source-title">
      <div>
        <h2 id="source-title">{provenance.sourceName}</h2>
        <p>
          {provenance.year} · Round {provenance.round}
          {provenance.sourceDocument ? ` · ${provenance.sourceDocument}` : ""}
          {provenance.sourcePage ? ` · page ${provenance.sourcePage}` : ""}
        </p>
      </div>
      <div>
        {provenance.note ? <p>{provenance.note}</p> : null}
        {provenance.sourceUrl ? (
          <p>
            <a href={provenance.sourceUrl} target="_blank" rel="noopener noreferrer">
              Open official source index
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
