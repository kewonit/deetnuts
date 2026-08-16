import Link from "next/link";
import { COMPLIANCE, COMPLIANCE_LINKS } from "@/lib/compliance";

export function PolicyPage({ title, summary, children }: { title: string; summary: string; children: React.ReactNode }) {
  return (
    <main className="policy-page">
      <div className="policy-page-inner">
        <nav aria-label="Breadcrumb" className="policy-breadcrumb"><Link href="/">DEETNUTS</Link><span aria-hidden="true"> / </span><Link href="/compliance">Legal &amp; compliance</Link></nav>
        <header className="policy-header">
          <p className="policy-kicker">Legal &amp; compliance</p>
          <h1>{title}</h1>
          <p className="policy-summary">{summary}</p>
          <dl className="policy-meta">
            <div><dt>Effective</dt><dd>{COMPLIANCE.effectiveDate}</dd></div>
            <div><dt>Version</dt><dd>{COMPLIANCE.policyVersion}</dd></div>
            <div><dt>Contact</dt><dd><a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a></dd></div>
          </dl>
        </header>
        <nav className="policy-switcher" aria-label="Legal documents">
          {COMPLIANCE_LINKS.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
        </nav>
        <article className="policy-content">{children}</article>
      </div>
    </main>
  );
}
