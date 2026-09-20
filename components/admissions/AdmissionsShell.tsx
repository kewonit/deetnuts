import Link from "next/link";
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
    <div className={full ? "cutoff-main" : "px-4 pb-8 pt-5 sm:px-5"}>
      <nav className="cutoff-breadcrumbs" aria-label="Breadcrumb">
        <span>
          <Link href={backPath}>{backLabel}</Link>
        </span>
        <span>
          <span aria-hidden="true">›</span>
          {title}
        </span>
      </nav>
      <header className="cutoff-hero">
        <span className="cutoff-kicker">
          {systemLabel}
          {status === "partial" ? " · Partial source coverage" : ""}
        </span>
        <h1 id="admissions-title">{title}</h1>
        {subtitle ? <p className="cutoff-lead">{subtitle}</p> : null}
        <div className="cutoff-hero-meta">
          {badges}
          <Link href={canonicalPath}>Open canonical page</Link>
        </div>
        <div className="cutoff-actions">
          {full ? (
            <>
              <Link className="cutoff-button" href={backPath}>
                Search colleges
              </Link>
              <a className="cutoff-button" href="#fit">
                Candidate profile
              </a>
            </>
          ) : (
            <Link className="cutoff-button" href={canonicalPath}>
              Full page
            </Link>
          )}
          <ShareAdmissionsPage compact={!full} />
        </div>
      </header>
      {facts}
      <div className={`mt-6 ${full && aside ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px]" : ""}`}>
        <div className="min-w-0 space-y-4">{children}</div>
        {full && aside ? (
          <aside className="hidden xl:block">
            <div className="sticky top-24">{aside}</div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export function AdmissionsSectionNav({
  items,
}: {
  items: Array<{ href: string; label: string }>;
}) {
  return (
    <nav aria-label="On this page" className="cutoff-info-card">
      <h2>On this page</h2>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <a className="cutoff-inline-link" href={item.href} key={item.href}>
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function AdmissionsFacts({
  facts,
}: {
  facts: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <dl className="cutoff-facts">
      {facts.map((fact) => (
        <div className="cutoff-fact" key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
