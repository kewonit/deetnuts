import Link from "next/link";
import { CookieSettingsButton } from "@/components/analytics/CookieConsent";

const cutoffLinks = [
  { label: "JEE Main colleges", href: "/jee-main/colleges" },
  { label: "JEE Advanced colleges", href: "/jee-advanced/colleges" },
  { label: "College predictor", href: "/college-predictor" },
  { label: "Data & licensing", href: "/compliance/data-sources-and-licensing" },
  { label: "Automated access", href: "/compliance/automated-access" },
];

const legalLinks = [
  { label: "Terms", href: "/compliance/terms-and-conditions" },
  { label: "Privacy", href: "/compliance/privacy-policy" },
  { label: "Cookies", href: "/compliance/cookie-policy" },
  { label: "Notices", href: "/compliance/open-source-notices" },
];

export function JeeCutoffFooter() {
  return (
    <footer className="jee-cutoff-footer dark">
      <div className="jee-cutoff-footer-inner">
        <div className="jee-cutoff-footer-top">
          <Link className="jee-cutoff-footer-brand" href="/">DEETNUTS</Link>
          <nav aria-label="JEE cutoff links">
            {cutoffLinks.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
          </nav>
        </div>
        <div className="jee-cutoff-footer-bottom" data-nosnippet>
          <p>DEETNUTS is an independent educational-data project and is not affiliated with or endorsed by JoSAA, CSAB, NTA, IITs, NITs, IIITs, or any listed institution. Cutoff figures are independently compiled from published counselling records and may contain transcription or processing errors. Verify all admission decisions on the applicable official portal. Third-party names, marks, and source data remain subject to their owners’ terms; DEETNUTS does not grant reuse rights in them.</p>
          <div>{legalLinks.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}<CookieSettingsButton /></div>
        </div>
      </div>
    </footer>
  );
}
