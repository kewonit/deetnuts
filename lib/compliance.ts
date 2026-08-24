export const COMPLIANCE = {
  operator: "DEETNUTS",
  privacyEmail: "help@deetnuts.com",
  effectiveDate: "23 August 2026",
  policyVersion: "2026-08-23",
  analyticsConsentCookie: "deetnuts_analytics_consent",
  analyticsConsentMaxAgeSeconds: 60 * 60 * 24 * 180,
} as const;

export const COMPLIANCE_LINKS = [
  { label: "Terms", href: "/compliance/terms-and-conditions" },
  { label: "Privacy", href: "/compliance/privacy-policy" },
  { label: "Cookies", href: "/compliance/cookie-policy" },
  { label: "Data methodology", href: "/compliance/data-sources-and-licensing" },
  { label: "Automated access", href: "/compliance/automated-access" },
] as const;
