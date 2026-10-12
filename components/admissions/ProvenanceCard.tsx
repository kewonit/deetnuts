import type { DataProvenance } from "@/lib/admissions/types";

export default function ProvenanceCard({
  provenance,
  coverageNotes = [],
}: {
  provenance: DataProvenance;
  coverageNotes?: string[];
}) {
  return (
    <section
      id="source"
      className="mht-section mht-college-section"
      aria-labelledby="source-title"
    >
      <div className="mht-section-head">
        <h2 id="source-title">Source</h2>
      </div>
      <div className={coverageNotes.length > 0 ? "mht-card mht-source" : "mht-card mht-source mht-source-single"}>
        <div>
          <h3>{provenance.sourceName}</h3>
          <p className="mht-source-big">
            {provenance.sourceDocument ?? "Imported CAP allotment list"}
          </p>
          {provenance.sourcePage ? <p>Page {provenance.sourcePage}</p> : null}
          {/* The note explains missing row-level metadata, so it only matters without a document. */}
          {!provenance.sourceDocument && provenance.note ? <p>{provenance.note}</p> : null}
          {provenance.sourceUrl ? (
            <a
              href={provenance.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mht-btn mht-btn-sm"
            >
              Open official source index
            </a>
          ) : null}
        </div>
        {coverageNotes.length > 0 ? (
          <div>
            <h3>Coverage</h3>
            <ul>
              {coverageNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
