import Link from "next/link";
import { SearchX } from "lucide-react";

export default function CollegeNotFound() {
  return (
    <main data-admissions-full-page="true" className="admissions-surface min-h-screen bg-[#f6f7fb] px-4 py-16">
      <section className="admissions-panel mx-auto max-w-xl p-6 sm:p-8">
        <SearchX aria-hidden="true" className="h-10 w-10 text-slate-600" />
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">College not found</h1>
        <p className="mt-3 leading-7 text-slate-600">
          This identifier does not match a verified MHT-CET college record.
        </p>
        <Link
          href="/mht-cet/colleges"
          className="mt-7 inline-flex min-h-11 items-center border border-slate-950 bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
        >
          Browse colleges
        </Link>
      </section>
    </main>
  );
}
