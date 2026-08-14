import { FileCheck2, ExternalLink } from "lucide-react";
import type { DataProvenance } from "@/lib/admissions/types";

export default function ProvenanceCard({ provenance }: { provenance: DataProvenance }) {
  return (
    <section id="source" className="admissions-panel p-5 sm:p-6" aria-labelledby="source-title">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-100 text-emerald-800">
          <FileCheck2 aria-hidden="true" className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-800">Source and freshness</p>
          <h2 id="source-title" className="mt-1 text-xl font-bold text-slate-950">
            {provenance.sourceName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {provenance.year} · Round {provenance.round}
            {provenance.sourceDocument ? ` · ${provenance.sourceDocument}` : ""}
            {provenance.sourcePage ? ` · page ${provenance.sourcePage}` : ""}
          </p>
          {provenance.note && (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{provenance.note}</p>
          )}
          {provenance.sourceUrl && (
            <a
              href={provenance.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-violet-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
            >
              Open official source index
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
