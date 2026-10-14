import Link from "next/link";
import { CookieSettingsButton } from "@/components/analytics/CookieConsent";
import { ThemeSwitch } from "@/components/theme/ThemeSettings";
import { BrandIcon, type BrandIconName } from "@/components/brand-icons";
import {
  DEETNUTS_WORDMARK_PATH,
  DEETNUTS_WORDMARK_VIEWBOX,
} from "@/components/deetnuts-wordmark";
import { getCanonicalMhtCetCollegePath } from "@/lib/admissions/proxy-canonical";
import { getMhtCetCollegeMedia } from "@/lib/admissions/college-media";
import { getJeeCutoffCatalog } from "@/lib/jee-cutoffs/repository";
import {
  DEFAULT_ROUND,
  DEFAULT_YEAR,
  YEAR_OPTIONS,
} from "@/lib/mht-cet/state-cutoffs/config";
import "./mht-footer.css";

const REPO = "https://github.com/kewonit/deetnuts";

type FooterLink = { label: string; href: string; external?: boolean };

type PopularCollege = {
  key: string;
  name: string;
  place: string;
  path: string;
  title?: string;
};

interface FooterSection {
  colleges: PopularCollege[];
  allColleges: string;
  status: Array<{ label: string; value: React.ReactNode }>;
  disclaimer: string;
}

function SourceLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener">
      {children}
    </a>
  );
}

// The names students search for, roughly in cutoff order. Every page in the section
// links them, so the college pages that draw search traffic stay one hop away.
const MHT_COLLEGES = [
  { code: 3012, name: "VJTI", place: "Mumbai" },
  { code: 16006, name: "COEP", place: "Pune" },
  { code: 3036, name: "ICT", place: "Mumbai" },
  { code: 3215, name: "SPIT", place: "Mumbai" },
  { code: 6271, name: "PICT", place: "Pune" },
  { code: 3199, name: "DJ Sanghvi", place: "Mumbai" },
  { code: 6007, name: "Walchand", place: "Sangli" },
  { code: 3014, name: "SPCE", place: "Mumbai" },
  { code: 6273, name: "VIT", place: "Pune" },
  { code: 3182, name: "TSEC", place: "Mumbai" },
  { code: 6175, name: "PCCOE", place: "Pune" },
  { code: 3185, name: "VESIT", place: "Mumbai" },
  { code: 6276, name: "Cummins", place: "Pune" },
  { code: 6267, name: "KIT", place: "Kolhapur" },
  { code: 6005, name: "GCOE", place: "Karad" },
  { code: 2008, name: "GCOE", place: "Sambhajinagar" },
  { code: 2020, name: "SGGSIET", place: "Nanded" },
  { code: 4167, name: "YCCE", place: "Nagpur" },
];

const JEE_COLLEGES = [
  { id: "iit-bombay", name: "IIT", place: "Bombay" },
  { id: "iit-delhi", name: "IIT", place: "Delhi" },
  { id: "iit-madras", name: "IIT", place: "Madras" },
  { id: "iit-kanpur", name: "IIT", place: "Kanpur" },
  { id: "iit-kharagpur", name: "IIT", place: "Kharagpur" },
  { id: "iit-roorkee", name: "IIT", place: "Roorkee" },
  { id: "iit-guwahati", name: "IIT", place: "Guwahati" },
  { id: "iit-hyderabad", name: "IIT", place: "Hyderabad" },
  { id: "iit-varanasi", name: "IIT", place: "BHU" },
  { id: "nit-trichy", name: "NIT", place: "Trichy" },
  { id: "nit-surathkal", name: "NIT", place: "Surathkal" },
  { id: "nit-warangal", name: "NIT", place: "Warangal" },
  { id: "nit-calicut", name: "NIT", place: "Calicut" },
  { id: "nit-rourkela", name: "NIT", place: "Rourkela" },
  { id: "nit-allahabad", name: "MNNIT", place: "Allahabad" },
  { id: "nit-jaipur", name: "MNIT", place: "Jaipur" },
  { id: "iiit-allahabad", name: "IIIT", place: "Allahabad" },
  { id: "iiit-gwalior", name: "IIITM", place: "Gwalior" },
];

const mhtYears = YEAR_OPTIONS.map((option) => option.value);

const MHT_SECTION: FooterSection = {
  colleges: MHT_COLLEGES.flatMap(({ code, name, place }) => {
    const path = getCanonicalMhtCetCollegePath(code);
    if (!path) return [];
    return [
      {
        key: String(code),
        name,
        place,
        path,
        title: getMhtCetCollegeMedia(code)?.collegeName,
      },
    ];
  }),
  allColleges: "/mht-cet/colleges",
  status: [
    { label: "Latest", value: `${DEFAULT_YEAR} · CAP Round ${DEFAULT_ROUND}` },
    {
      label: "Coverage",
      value: `${Math.min(...mhtYears)}–${Math.max(...mhtYears)} CAP rounds`,
    },
    {
      label: "Source",
      value: (
        <SourceLink href="https://cetcell.mahacet.org/">
          State CET Cell, Maharashtra
        </SourceLink>
      ),
    },
  ],
  disclaimer:
    "DEETNUTS is independent and not affiliated with the State CET Cell, Maharashtra, or any listed institution. Cutoffs are compiled from official CAP allotment lists and may contain errors. Confirm with the CET Cell before you decide.",
};

async function getJeeSection(): Promise<FooterSection> {
  const catalog = await getJeeCutoffCatalog();
  const byId = new Map(
    catalog.colleges.map((college) => [college.id, college]),
  );
  const pages = catalog.colleges.flatMap((college) => college.pages);
  const years = pages.map((page) => page.year);
  const latest = Math.max(...years);
  const josaaRound = Math.max(
    ...pages
      .filter((page) => page.year === latest)
      .flatMap((page) => page.roundsByBody.josaa ?? []),
  );
  return {
    colleges: JEE_COLLEGES.flatMap(({ id, name, place }) => {
      const college = byId.get(id);
      if (!college) return [];
      return [
        {
          key: id,
          name,
          place,
          path: `/${college.examId}/colleges/${id}`,
          title: college.name,
        },
      ];
    }),
    allColleges: "/jee-cutoffs",
    status: [
      { label: "Latest", value: `${latest} · JoSAA Round ${josaaRound}` },
      {
        label: "Coverage",
        value: `${Math.min(...years)}–${latest} JoSAA rounds`,
      },
      {
        label: "Source",
        value: (
          <>
            <SourceLink href="https://josaa.nic.in/">JoSAA</SourceLink>,{" "}
            <SourceLink href="https://csab.nic.in/">CSAB</SourceLink>
          </>
        ),
      },
    ],
    disclaimer:
      "DEETNUTS is independent and not affiliated with JoSAA, CSAB, NTA or any listed institution. Cutoffs are compiled from official counselling records and may contain errors. Confirm on the official portal before you decide.",
  };
}

const linkGroups: Array<{ label: string; links: FooterLink[] }> = [
  {
    label: "MHT-CET",
    links: [
      { label: "MHT-CET cutoffs", href: "/mht-cet" },
      { label: "State cutoffs", href: "/mht-cet/state-cutoffs" },
      { label: "All India cutoffs", href: "/mht-cet/all-india-cutoffs" },
      { label: "Colleges", href: "/mht-cet/colleges" },
    ],
  },
  {
    label: "JEE",
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
      { label: "Sources", href: "/datasource" },
      { label: "Methodology", href: "/compliance/data-sources-and-licensing" },
      { label: "Automated access", href: "/compliance/automated-access" },
      { label: "Report an error", href: `${REPO}/issues/new`, external: true },
    ],
  },
  {
    label: "Project",
    links: [
      { label: "Exam countdown", href: "/exam-countdown" },
      { label: "Creators", href: "/creators" },
      { label: "Source code", href: REPO, external: true },
      { label: "Open-source notices", href: "/compliance/open-source-notices" },
    ],
  },
];

// Matches the Organization sameAs list in SiteJsonLd.
const socialLinks: Array<{ label: string; href: string; icon: BrandIconName }> =
  [
    { label: "GitHub", href: REPO, icon: "github" },
    {
      label: "Discord",
      href: "https://discord.gg/xbtqGcQ6SF",
      icon: "discord",
    },
    { label: "X", href: "https://x.com/kewonit", icon: "x" },
  ];

const legalLinks: FooterLink[] = [
  { label: "Privacy", href: "/compliance/privacy-policy" },
  { label: "Terms", href: "/compliance/terms-and-conditions" },
  { label: "Cookies", href: "/compliance/cookie-policy" },
];

function FooterAnchor({ link }: { link: FooterLink }) {
  return link.external ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer">
      {link.label}
      <span className="mht-foot-ext" aria-hidden="true">
        ↗
      </span>
    </a>
  ) : (
    <Link href={link.href}>{link.label}</Link>
  );
}

export async function MhtFooter({
  variant = "mht",
}: {
  variant?: "mht" | "jee";
}) {
  const sourceCommit = process.env.NEXT_PUBLIC_SOURCE_COMMIT;
  const section = variant === "jee" ? await getJeeSection() : MHT_SECTION;

  return (
    <footer className="mht-footer">
      <div className="mht-page mht-page-wide">
        <nav
          className="mht-foot-colleges"
          aria-labelledby="mht-foot-colleges-title"
        >
          <div className="mht-foot-colleges-head">
            <h2 id="mht-foot-colleges-title">Popular colleges</h2>
            <Link className="mht-arrow-link" href={section.allColleges}>
              All colleges
            </Link>
          </div>
          <ul>
            {section.colleges.map((college) => (
              <li key={college.key}>
                <Link href={college.path} title={college.title}>
                  {college.name} <span>{college.place}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mht-foot-top">
          <div className="mht-foot-brand">
            <Link href="/" className="mht-foot-name">
              DEETNUTS
            </Link>
            <dl className="mht-foot-status">
              {section.status.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
            <ul className="mht-foot-social">
              {socialLinks.map((link) => (
                <li key={link.icon}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    title={link.label}
                  >
                    <BrandIcon name={link.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav className="mht-foot-cols" aria-label="Footer">
            {linkGroups.map((group) => (
              <div key={group.label}>
                <h2>{group.label}</h2>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <FooterAnchor link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mht-foot-note">
          <p data-nosnippet>{section.disclaimer}</p>
        </div>

        <div className="mht-foot-meta">
          <p>
            © {new Date().getFullYear()} DEETNUTS ·{" "}
            <a href={`${REPO}/blob/main/LICENSE`}>MIT License</a>
            {sourceCommit ? (
              <>
                {" · "}
                <a
                  className="mht-code"
                  href={`${REPO}/tree/${sourceCommit}`}
                  title="Source for this version"
                >
                  {sourceCommit.slice(0, 7)}
                </a>
              </>
            ) : null}
          </p>
          <div className="mht-foot-end">
            <ul className="mht-foot-legal">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <FooterAnchor link={link} />
                </li>
              ))}
            </ul>
            <div className="mht-foot-controls">
              <CookieSettingsButton className="mht-foot-pill" />
              <ThemeSwitch className="mht-foot-theme" />
            </div>
          </div>
        </div>

        <svg
          className="mht-foot-mark"
          viewBox={DEETNUTS_WORDMARK_VIEWBOX}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient
              id="mht-foot-mark-fade"
              x1="539"
              y1="150"
              x2="539"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0"
                style={{ stopColor: "var(--mht-ink)", stopOpacity: 0 }}
              />
              <stop
                offset="0.75"
                style={{ stopColor: "var(--mht-ink)", stopOpacity: 0.11 }}
              />
              <stop
                offset="1"
                style={{ stopColor: "var(--mht-ink)", stopOpacity: 0.16 }}
              />
            </linearGradient>
          </defs>
          <path d={DEETNUTS_WORDMARK_PATH} fill="url(#mht-foot-mark-fade)" />
        </svg>
      </div>
    </footer>
  );
}
