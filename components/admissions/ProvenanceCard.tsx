import type { DataProvenance } from "@/lib/admissions/types";

const serif = "[font-family:var(--font-serif-display)] italic";

export default function ProvenanceCard({ provenance }: { provenance: DataProvenance }) {
  return (
    <section
      id="source"
      className="mht-profile-card mht-college-section overflow-hidden rounded-xl border border-zinc-200"
      aria-labelledby="source-title"
    >
      <div className="space-y-3 p-5">
        <h2 id="source-title" className={`${serif} text-xl text-zinc-800`}>
          {provenance.sourceName}
        </h2>
        <p className="text-sm text-zinc-500">
          {provenance.year} · Round {provenance.round}
          {provenance.sourceDocument ? ` · ${provenance.sourceDocument}` : ""}
          {provenance.sourcePage ? ` · page ${provenance.sourcePage}` : ""}
        </p>
        {provenance.note ? <p className="text-sm text-zinc-600">{provenance.note}</p> : null}
        {provenance.sourceUrl ? (
          <a
            href={provenance.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
          >
            Open official source index
          </a>
        ) : null}
      </div>
    </section>
  );
}
