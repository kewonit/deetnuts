import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/compliance/PolicyPage";
import { COMPLIANCE, COMPLIANCE_LINKS } from "@/lib/compliance";

export const metadata: Metadata = {
  title: "Legal and Compliance",
  description: "DEETNUTS terms, privacy notice, cookie controls, public-data methodology, automated-access rules and open-source notices.",
  alternates: { canonical: "/compliance" },
};

const descriptions: Record<string, string> = {
  "/compliance/terms-and-conditions": "The agreement governing public pages, accounts, comparison tools, acceptable use, contributions and disputes.",
  "/compliance/privacy-policy": "The complete processing inventory, provider list, retention approach, security measures and privacy-request process.",
  "/compliance/cookie-policy": "Every first-party cookie and browser-storage purpose, optional analytics behavior and consent control.",
  "/compliance/data-sources-and-licensing": "Source lineage, public access, validation, release controls and the correction process for JEE cutoff facts.",
  "/compliance/automated-access": "Clear rules for people, search engines and respectful scrapers retrieving public HTML.",
};

export default function ComplianceIndex() {
  return (
    <PolicyPage title="Legal and compliance" summary="Plain, specific documents for how DEETNUTS operates, handles information, presents public college data and supports automated access.">
      <section><h2>Core documents</h2><ul>{COMPLIANCE_LINKS.map((link) => <li key={link.href}><strong><Link href={link.href}>{link.label}</Link></strong><br />{descriptions[link.href]}</li>)}</ul></section>
      <section><h2>Software notices</h2><p>DEETNUTS and incorporated eJAM software credits are listed in the <Link href="/compliance/open-source-notices">open-source notices</Link>.</p></section>
      <section><h2>Contact</h2><p>Legal, privacy, security, data-correction and grievance messages may be sent to <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a>. Include the relevant URL and enough detail to investigate, but never send a password, one-time code, full card number or admission-portal credential.</p></section>
    </PolicyPage>
  );
}
