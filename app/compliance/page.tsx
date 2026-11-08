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
  "/compliance/terms-and-conditions": "The terms governing use of the Service, including accounts, acceptable use, disclaimers, limitation of liability and dispute resolution.",
  "/compliance/privacy-policy": "How personal data is collected, used, disclosed, retained and protected, and how to exercise your rights.",
  "/compliance/cookie-policy": "The cookies and browser storage used by the Service, their purposes and durations, and how to manage consent.",
  "/compliance/data-sources-and-licensing": "The sources, validation controls, release process and correction procedure for JEE cutoff data.",
  "/compliance/automated-access": "The conditions on which search engines and other automated clients may retrieve public pages.",
};

export default function ComplianceIndex() {
  return (
    <PolicyPage title="Legal and Compliance">
      <section><h2>Documents</h2><ul>{COMPLIANCE_LINKS.map((link) => <li key={link.href}><strong><Link href={link.href}>{link.label}</Link></strong><br />{descriptions[link.href]}</li>)}</ul></section>
      <section><h2>Software notices</h2><p>Credits for DEETNUTS and incorporated eJAM software are listed in the <Link href="/compliance/open-source-notices">Open-Source Notices</Link>.</p></section>
      <section><h2>Contact</h2><p>Legal, privacy, security, data-correction and grievance messages may be sent to <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a>. Include the relevant URL and sufficient detail to investigate. Do not include passwords, one-time codes, full payment-card numbers or admission-portal credentials.</p></section>
    </PolicyPage>
  );
}
