import Link from "next/link";
import { ArrowLeft, ExternalLink, Search, ShieldCheck, UserRound } from "lucide-react";
import { ShareAdmissionsPage } from "@/components/admissions/AdmissionsActions";
import type { AdmissionsDataStatus } from "@/lib/admissions/types";

interface AdmissionsShellProps {
  variant?: "full" | "sheet";
  systemLabel: string;
  title: string;
  subtitle?: string | null;
  canonicalPath: string;
  backPath: string;
  backLabel: string;
  status: AdmissionsDataStatus;
  badges?: React.ReactNode;
  facts?: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
}

export default function AdmissionsShell({
  variant = "full",
  systemLabel,
  title,
  subtitle,
  canonicalPath,
  backPath,
  backLabel,
  status,
  badges,
  facts,
  children,
  aside,
}: AdmissionsShellProps) {
  const full = variant === "full";

  return (
    <div
      {...(full ? { "data-admissions-full-page": "true" } : {})}
      className={`admissions-surface min-h-screen bg-[#f6f7fb] ${full ? "pb-16" : "pb-8"}`}
    >
      {full && (
        <a
          href="#admissions-main"
          className="fixed left-3 top-3 z-[100] -translate-y-20 bg-slate-950 px-4 py-3 text-sm font-semibold text-white focus:translate-y-0"
        >
          Skip to admission details
        </a>
      )}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-3 sm:gap-3 sm:px-6">
          <Link
            href={backPath}
            className="inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold text-slate-700 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">{backLabel}</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <Link
            href="/"
            className="hidden min-h-11 items-center text-sm font-black tracking-tight text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 sm:inline-flex"
          >
            DEETNUTS
          </Link>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 sm:inline">
            {systemLabel}
          </span>
          <div className={`ml-auto flex items-center gap-2 ${full ? "" : "pr-12"}`}>
            {full && (
              <>
                <Link
                  href={backPath}
                  aria-label={`Search ${backLabel.toLowerCase()}`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:border-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
                >
                  <Search aria-hidden="true" className="h-4 w-4" />
                  <span className="hidden xl:inline">Search</span>
                </Link>
                <a
                  href="#fit"
                  aria-label="Open candidate profile"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:border-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
                >
                  <UserRound aria-hidden="true" className="h-4 w-4" />
                  <span className="hidden xl:inline">Profile</span>
                </a>
              </>
            )}
            {!full && (
              <a
                href={canonicalPath}
                aria-label="Open full page"
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:border-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
              >
                <span className="hidden sm:inline">Full page</span>
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </a>
            )}
            <ShareAdmissionsPage compact={!full} />
          </div>
        </div>
      </header>

      <main
        id={full ? "admissions-main" : undefined}
        className={`mx-auto w-full ${full ? "max-w-[1440px] px-4 pt-6 sm:px-6 sm:pt-8" : "px-4 pt-5 sm:px-6"}`}
      >
        <section className="admissions-panel p-5 sm:p-7" aria-labelledby="admissions-title">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="bg-violet-100 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-violet-800">
                  {systemLabel}
                </span>
                {badges}
                {status === "partial" && (
                  <span className="bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                    Partial source coverage
                  </span>
                )}
              </div>
              <h1
                id="admissions-title"
                className={`${full ? "text-3xl sm:text-4xl lg:text-5xl" : "text-2xl sm:text-3xl"} font-bold tracking-[-0.035em] text-slate-950`}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex max-w-md items-start gap-2 border border-emerald-200 bg-emerald-50 p-3 text-sm leading-5 text-emerald-950">
              <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              <p>Historical comparisons only. Results describe past official cutoffs, not future admission.</p>
            </div>
          </div>
          {facts && <div className="mt-6 border-t border-slate-200 pt-5">{facts}</div>}
        </section>

        <div className={`mt-6 ${full && aside ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px]" : ""}`}>
          <div className="min-w-0 space-y-6">{children}</div>
          {full && aside && (
            <aside className="hidden xl:block">
              <div className="sticky top-24">{aside}</div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

export function AdmissionsSectionNav({
  items,
}: {
  items: Array<{ href: string; label: string }>;
}) {
  return (
    <nav className="admissions-panel p-3" aria-label="On this page">
      <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        On this page
      </p>
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="block min-h-11 border-l-2 border-transparent px-3 py-3 text-sm font-semibold text-slate-600 hover:border-violet-600 hover:bg-violet-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-700"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AdmissionsFacts({
  facts,
}: {
  facts: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {facts.map((fact) => (
        <div key={fact.label} className="min-w-0">
          <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            {fact.label}
          </dt>
          <dd className="mt-1 break-words text-sm font-semibold text-slate-900 sm:text-base">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
