import Link from "next/link";
import { CookieSettingsButton } from "@/components/analytics/CookieConsent";
import { ThemeSettingsButton } from "@/components/theme/ThemeSettings";
import "./mht-footer.css";

const linkGroups = [
  {
    label: "MHT-CET",
    links: [
      { label: "State cutoffs", href: "/mht-cet/state-cutoffs" },
      { label: "All India cutoffs", href: "/mht-cet/all-india-cutoffs" },
      { label: "Maharashtra colleges", href: "/mht-cet/colleges" },
      { label: "MHT-CET overview", href: "/mht-cet" },
    ],
  },
  {
    label: "More cutoffs",
    links: [
      { label: "JEE cutoffs", href: "/jee-cutoffs" },
      { label: "JEE Main colleges", href: "/jee-main/colleges" },
      { label: "JEE Advanced colleges", href: "/jee-advanced/colleges" },
      { label: "College predictor", href: "/college-predictor" },
    ],
  },
  {
    label: "Data",
    links: [
      { label: "Data sources", href: "/datasource" },
      { label: "Methodology", href: "/compliance/data-sources-and-licensing" },
      { label: "Automated access", href: "/compliance/automated-access" },
      { label: "Open-source notices", href: "/compliance/open-source-notices" },
    ],
  },
];

const legalLinks = [
  { label: "Privacy", href: "/compliance/privacy-policy" },
  { label: "Terms", href: "/compliance/terms-and-conditions" },
  { label: "Cookies", href: "/compliance/cookie-policy" },
];

export function MhtFooter() {
  const sourceCommit = process.env.NEXT_PUBLIC_SOURCE_COMMIT;

  return (
    <footer className="mht-footer mht-page">
      <nav className="mht-foot-cols" aria-label="Footer">
        {linkGroups.map((group) => (
          <div key={group.label}>
            <h2>{group.label}</h2>
            {group.links.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
        <div>
          <h2>Legal</h2>
          {legalLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
          <ThemeSettingsButton />
          <CookieSettingsButton />
        </div>
      </nav>

      <p className="mht-foot-notice" data-nosnippet>
        DEETNUTS is an independent project, not affiliated with or endorsed by the State CET Cell,
        Maharashtra, or any listed institution. Cutoffs are compiled from official CAP allotment lists
        and may contain errors. Confirm admission decisions on the CET Cell website.
      </p>

      <div className="mht-foot-base">
        <span>© {new Date().getFullYear()} DEETNUTS</span>
        <span>
          <a href="https://github.com/kewonit/deetnuts">GitHub</a>
          <Link href="/creators">Creators</Link>
          {sourceCommit ? (
            <a href={`https://github.com/kewonit/deetnuts/tree/${sourceCommit}`}>
              Source for this version
            </a>
          ) : null}
        </span>
      </div>
    </footer>
  );
}
