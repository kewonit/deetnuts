import Link from "next/link";

export function PolicyPage({ title, summary, children }: { title: string; summary: string; children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-4xl px-5 py-12 text-slate-950"><nav aria-label="Breadcrumb" className="text-sm text-slate-600"><Link className="underline" href="/">DEETNUTS</Link><span aria-hidden="true"> / </span>Compliance</nav><header className="mt-8 border-b border-slate-300 pb-8"><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1><p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">{summary}</p><p className="mt-4 text-xs text-slate-500">Last updated 15 August 2026</p></header><div className="policy-content space-y-9 py-9 [&_a]:underline [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_li]:leading-7 [&_p]:leading-7 [&_p]:text-slate-700 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">{children}</div></main>;
}
