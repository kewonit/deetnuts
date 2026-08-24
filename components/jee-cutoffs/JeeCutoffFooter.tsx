import Link from "next/link";
import { CookieSettingsButton } from "@/components/analytics/CookieConsent";
import { ThemeSettingsButton } from "@/components/theme/ThemeSettings";

const footerGroups = [
  {
    label: "Cutoffs",
    links: [
      { label: "JEE cutoff overview", href: "/jee-cutoffs" },
      { label: "JEE Main colleges", href: "/jee-main/colleges" },
      { label: "JEE Advanced colleges", href: "/jee-advanced/colleges" },
      { label: "MHT-CET cutoffs", href: "/mht-cet" },
    ],
  },
  {
    label: "Tools",
    links: [
      { label: "College predictor", href: "/college-predictor" },
      { label: "State cutoffs", href: "/mht-cet/state-cutoffs" },
      { label: "All India cutoffs", href: "/mht-cet/all-india-cutoffs" },
      { label: "Maharashtra colleges", href: "/mht-cet/colleges" },
    ],
  },
  {
    label: "Data",
    links: [
      { label: "Data sources", href: "/datasource" },
      { label: "Data methodology", href: "/compliance/data-sources-and-licensing" },
      { label: "Automated access", href: "/compliance/automated-access" },
      { label: "Open-source notices", href: "/compliance/open-source-notices" },
    ],
  },
];

const legalLinks = [
  { label: "Terms", href: "/compliance/terms-and-conditions" },
  { label: "Privacy", href: "/compliance/privacy-policy" },
  { label: "Cookies", href: "/compliance/cookie-policy" },
  { label: "Notices", href: "/compliance/open-source-notices" },
];

export function JeeCutoffFooter() {
  const sourceCommit = process.env.NEXT_PUBLIC_SOURCE_COMMIT;

  return (
    <footer className="jee-cutoff-footer">
      <div className="jee-cutoff-footer-inner">
        <div className="jee-cutoff-footer-grid">
          <div className="jee-cutoff-footer-about">
            <Link className="jee-cutoff-footer-brand" href="/">DEETNUTS</Link>
            <p>Clear, source-backed college admissions data for students.</p>
            <div className="jee-cutoff-footer-project-links">
              <a href="https://github.com/kewonit/deetnuts">GitHub</a>
              <Link href="/creators">Creators</Link>
            </div>
            <small>© {new Date().getFullYear()} DEETNUTS</small>
          </div>
          {footerGroups.map((group) => (
            <nav aria-label={group.label} key={group.label}>
              <p className="jee-cutoff-footer-heading">{group.label}</p>
              {group.links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
            </nav>
          ))}
          <nav aria-label="Project">
            <p className="jee-cutoff-footer-heading">Project</p>
            <Link href="/compliance/privacy-policy">Privacy</Link>
            <Link href="/compliance/terms-and-conditions">Terms</Link>
            <Link href="/compliance/cookie-policy">Cookies</Link>
            <ThemeSettingsButton />
            <CookieSettingsButton />
          </nav>
        </div>
        <div className="jee-cutoff-footer-notices" data-nosnippet>
          <p>DEETNUTS is an independent educational-data project. It is not affiliated with or endorsed by JoSAA, CSAB, NTA, IITs, NITs, IIITs, or any listed institution.</p>
          <p>Cutoff ranks are independently compiled from published counselling records and may contain transcription or processing errors. Always verify admission decisions on the applicable official portal.</p>
          <p>Public cutoff pages are open to everyone. Source lineage, validation and correction procedures are documented in the data methodology.</p>
          <div className="jee-cutoff-footer-legal">{legalLinks.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}{sourceCommit ? <a href={`https://github.com/kewonit/deetnuts/tree/${sourceCommit}`}>Source for this version</a> : null}</div>
        </div>
      </div>
    </footer>
  );
}
