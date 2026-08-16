import { COMPLIANCE } from "@/lib/compliance";

export type AnalyticsConsentChoice = "granted" | "denied";

const consentValue = (choice: AnalyticsConsentChoice) =>
  `${choice}:${COMPLIANCE.policyVersion}`;

export function hasGlobalPrivacyControl(): boolean {
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

export function readAnalyticsConsent(): AnalyticsConsentChoice | null {
  if (hasGlobalPrivacyControl()) return "denied";
  const value = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${COMPLIANCE.analyticsConsentCookie}=`))
    ?.slice(COMPLIANCE.analyticsConsentCookie.length + 1);
  if (value === consentValue("granted")) return "granted";
  if (value === consentValue("denied")) return "denied";
  return null;
}

export function writeAnalyticsConsent(choice: AnalyticsConsentChoice) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COMPLIANCE.analyticsConsentCookie}=${consentValue(choice)}; Path=/; Max-Age=${COMPLIANCE.analyticsConsentMaxAgeSeconds}; SameSite=Lax${secure}`;
}

export function clearGoogleAnalyticsCookies() {
  const host = location.hostname.replace(/^www\./, "");
  const domainAttributes = host === "deetnuts.com"
    ? ["", "; Domain=deetnuts.com", "; Domain=.deetnuts.com"]
    : [""];
  for (const item of document.cookie.split("; ")) {
    const name = item.slice(0, item.indexOf("="));
    if (name !== "_ga" && !name.startsWith("_ga_")) continue;
    for (const domain of domainAttributes) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${domain}${location.protocol === "https:" ? "; Secure" : ""}`;
    }
  }
}
