import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/analytics/CookieConsent";
import { Clause, PolicyPage } from "@/components/compliance/PolicyPage";
import { COMPLIANCE } from "@/lib/compliance";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "The cookies and browser storage used by DEETNUTS, their purposes and durations, and how to manage your preferences.",
  alternates: { canonical: "/compliance/cookie-policy" },
};

const SECTIONS = [
  { id: "scope", label: "Introduction and scope" },
  { id: "technologies", label: "Cookies and similar technologies" },
  { id: "categories", label: "Categories of storage" },
  { id: "necessary", label: "Strictly necessary cookies" },
  { id: "functional", label: "Functional browser storage" },
  { id: "analytics", label: "Optional analytics cookies" },
  { id: "third-party", label: "Third-party content and services" },
  { id: "consent", label: "Consent" },
  { id: "manage", label: "Managing your preferences" },
  { id: "changes", label: "Changes to this Cookie Policy" },
  { id: "contact", label: "Contact" },
] as const;

const email = <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a>;

type Row = { name: React.ReactNode; type: string; purpose: React.ReactNode; duration: string };

function StorageTable({ label, caption, rows }: { label: string; caption: string; rows: Row[] }) {
  return (
    <div className="policy-table-wrap" role="region" aria-label={label} tabIndex={0}>
      <table className="policy-table">
        <caption>{caption}</caption>
        <thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Purpose</th><th scope="col">Duration</th></tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <th scope="row">{row.name}</th>
              <td data-label="Type">{row.type}</td>
              <td data-label="Purpose">{row.purpose}</td>
              <td data-label="Duration">{row.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const NECESSARY: Row[] = [
  {
    name: <code>{COMPLIANCE.analyticsConsentCookie}</code>,
    type: "First-party cookie",
    purpose: "Records whether you have allowed or declined optional analytics, and the version of the consent request to which the choice applies.",
    duration: "180 days from your latest choice.",
  },
  {
    name: <code>__Host-deetnuts_auth</code>,
    type: "First-party cookie; HttpOnly, Secure, host-only",
    purpose: "Holds the signed session token that authenticates you after you sign in. It cannot be read by page scripts or set by other subdomains.",
    duration: "Up to 7 days; removed on sign-out.",
  },
  {
    name: <code>__Host-deetnuts_oauth</code>,
    type: "First-party cookie; HttpOnly, Secure, host-only",
    purpose: "Binds a Google sign-in response to the browser that started sign-in, to prevent forged sign-in requests, and stores a safe return path.",
    duration: "Up to 10 minutes; removed when sign-in completes.",
  },
  {
    name: <code>mht_cet_state_cutoff_anonymous_requests</code>,
    type: "First-party cookie; HttpOnly",
    purpose: "Counts state-cutoff searches made without an Account, to enforce the usage limit for anonymous users and protect the service from excessive use.",
    duration: "7 days.",
  },
  {
    name: <><code>__cf_bm</code>, <code>cf_clearance</code></>,
    type: "Cloudflare cookies",
    purpose: "May be set by Cloudflare to distinguish automated traffic from people and to record that a security challenge has been passed.",
    duration: "__cf_bm: 30 minutes. cf_clearance: as configured for the challenge, typically up to 30 minutes.",
  },
  {
    name: <><code>CF_Authorization</code>, <code>CF_Binding</code>, <code>CF_AppSession</code>, <code>CF_Session</code>, <code>CF_Device</code></>,
    type: "Cloudflare Access cookies; HttpOnly",
    purpose: "Set only on the restricted administrator hostname and the Cloudflare Access login domain. They authenticate an authorised administrator, bind the session to the browser and protect the login flow against forgery.",
    duration: "From 1 hour (application session) to 30 days (device record), depending on the cookie.",
  },
];

const FUNCTIONAL: Row[] = [
  {
    name: <code>deetnuts_theme</code>,
    type: "Local storage",
    purpose: "Remembers a Light or Dark theme that you select. Selecting System removes the value.",
    duration: "Until you select System or clear site data.",
  },
  {
    name: <code>deetnuts:admissions-profile:v1:*</code>,
    type: "Local storage",
    purpose: "Stores a candidate profile that you save for comparison on this device.",
    duration: "Until you select Clear profile, replace the profile or clear site data.",
  },
  {
    name: <><code>deetnuts:mht-cet-score:v1</code>, <code>deetnuts:mht-cet-seat-view:v1</code>, <code>deetnuts:mht-cet-cutoff-mode:v1</code></>,
    type: "Local storage",
    purpose: "Remember the rank or percentile you entered, the seat categories you selected and the list or grid view on MHT-CET cutoff pages.",
    duration: "Until you change or clear the value, or clear site data.",
  },
  {
    name: <><code>deetnuts:jee-seat:v1</code>, <code>deetnuts:jee-cutoff-mode:v1</code></>,
    type: "Local storage",
    purpose: "Remember the seat pool and view mode you selected on JEE cutoff pages.",
    duration: "Until you change the selection or clear site data.",
  },
  {
    name: <code>deetnuts:mht-cet-state-cutoffs:anonymous-actions</code>,
    type: "Local storage",
    purpose: "Counts state-cutoff actions made without an Account, so that the usage limit can be shown before a request is sent.",
    duration: "Until reset by the feature or you clear site data.",
  },
  {
    name: <><code>timekeeper-countdown-state</code>, <code>timekeeper-countdowns</code>, <code>timekeeper-theme</code>, <code>timekeeper_avatar_seed</code></>,
    type: "Local storage",
    purpose: "Store your saved exam countdowns, countdown theme and the random identifier used to generate your study-map avatar.",
    duration: "Until you remove them or clear site data.",
  },
  {
    name: <code>timekeeper-study-auth</code>,
    type: "Local storage",
    purpose: "Holds the anonymous Supabase session used by the study map. Created only when you open the study map or start a study session.",
    duration: "Until the session expires or you clear site data.",
  },
  {
    name: <code>timekeeper-pending-import</code>,
    type: "Session storage",
    purpose: "Holds countdown data briefly while an import from the TimeKeeper service is completed.",
    duration: "Until the import completes or the tab is closed.",
  },
  {
    name: <><code>ejam:college-predictor:accuracy-banner-dismissed</code>, <code>github-stars:*</code></>,
    type: "Session storage",
    purpose: "Remember that you dismissed the college predictor accuracy notice, and cache the repository star count shown in the page header.",
    duration: "Until the tab is closed.",
  },
];

const ANALYTICS: Row[] = [
  {
    name: <code>_ga</code>,
    type: "First-party cookie set by Google Analytics",
    purpose: "Distinguishes browsers for aggregate usage measurement.",
    duration: "Up to 180 days, subject to browser limits and earlier withdrawal.",
  },
  {
    name: <code>_ga_*</code>,
    type: "First-party cookie set by Google Analytics",
    purpose: "Maintains session state for the DEETNUTS Google Analytics property.",
    duration: "Up to 180 days, subject to browser limits and earlier withdrawal.",
  },
];

export default function CookiePolicy() {
  return (
    <PolicyPage title="Cookie Policy" contents={SECTIONS}>
      <Clause sections={SECTIONS} id="scope">
        <p>This Cookie Policy explains how DEETNUTS uses cookies and similar technologies on deetnuts.com and its subdomains (the “Service”). It forms part of the <Link href="/compliance/privacy-policy">Privacy Policy</Link>, which describes how personal data collected through these technologies is processed and the rights available to you.</p>
      </Clause>

      <Clause sections={SECTIONS} id="technologies">
        <p>A cookie is a small text file that a website stores in your browser and that the browser returns with later requests to the same website. Local storage and session storage are browser features that allow a website to keep information on your device; unlike cookies, they are not sent automatically with each request. Session storage is cleared when the browser tab is closed. In this policy, “storage” refers to all of these technologies.</p>
        <p>First-party storage is set by the Service. Third-party storage is set by another domain, such as an embedded video player.</p>
      </Clause>

      <Clause sections={SECTIONS} id="categories">
        <ul>
          <li><strong>Strictly necessary.</strong> Required for security, authentication, abuse prevention and recording your consent choices. These cannot be disabled through the Service’s settings because the Service would not function securely without them.</li>
          <li><strong>Functional.</strong> Used to remember settings and information that you choose to save, such as your theme, candidate profile and countdowns. They are set only when you use the relevant feature.</li>
          <li><strong>Analytics.</strong> Used to measure aggregate usage and performance. They are optional and are set only after you select Allow.</li>
        </ul>
        <p>DEETNUTS does not use advertising, targeting or social-media tracking cookies.</p>
      </Clause>

      <Clause sections={SECTIONS} id="necessary">
        <StorageTable label="Strictly necessary cookies" caption="Strictly necessary cookies" rows={NECESSARY} />
        <p>Authentication cookies use the <code>SameSite=Lax</code> attribute. Never copy the value of an authentication cookie into a message, screenshot or support request.</p>
      </Clause>

      <Clause sections={SECTIONS} id="functional">
        <StorageTable label="Functional browser storage" caption="Functional local storage and session storage" rows={FUNCTIONAL} />
      </Clause>

      <Clause sections={SECTIONS} id="analytics">
        <StorageTable label="Optional analytics cookies" caption="Optional analytics cookies (set only after Allow)" rows={ANALYTICS} />
        <p>Analytics storage is denied by default, and the Google tag is not loaded until you select Allow. Advertising storage, advertising user data and advertising personalisation remain denied at all times, and Google Signals is disabled. Analytics cookies are not used for admission-related decisions or for advertising.</p>
      </Clause>

      <Clause sections={SECTIONS} id="third-party">
        <p>Some pages load content from third parties, which may set their own storage or receive information from your browser under their own policies:</p>
        <ul>
          <li><strong>YouTube.</strong> Videos are embedded using the privacy-enhanced <code>youtube-nocookie.com</code> domain. YouTube may store information in your browser when the player loads or when you interact with it.</li>
          <li><strong>Cloudinary and DiceBear.</strong> Images are delivered from these providers, which receive ordinary request information such as your IP address and browser details.</li>
          <li><strong>Google sign-in.</strong> When you choose to sign in with Google, Google’s pages may set their own cookies.</li>
          <li><strong>Payment providers and external links.</strong> Sites you visit from the Service may set their own cookies.</li>
        </ul>
        <p>Your analytics choice on the Service does not control storage set by other domains. Refer to the relevant provider’s policy for details.</p>
      </Clause>

      <Clause sections={SECTIONS} id="consent">
        <ol>
          <li>On your first visit, or when the consent request changes, a notice offers Decline and Allow with equal prominence.</li>
          <li>Until you select Allow, the Google tag is not loaded and no analytics request is sent to Google.</li>
          <li>Selecting Allow records your choice, loads the Google tag and enables analytics storage only.</li>
          <li>Selecting Decline records your choice and keeps analytics disabled. All features of the Service remain available.</li>
          <li>You may change your choice at any time. Withdrawing consent removes the first-party Google Analytics cookies and reloads the page without the Google tag.</li>
          <li>If the purposes of analytics change materially, we will ask for your consent again.</li>
        </ol>
        <p>If your browser sends a Global Privacy Control signal, analytics is treated as declined and the option to allow it is unavailable while the signal remains active.</p>
      </Clause>

      <Clause sections={SECTIONS} id="manage">
        <p>You can manage storage in the following ways:</p>
        <ul>
          <li><strong>Cookie settings:</strong> use the button below or the “Cookie settings” link in the site footer to allow, decline or withdraw analytics consent.</li>
          <li><strong>Theme settings:</strong> select System to remove the stored theme preference.</li>
          <li><strong>Clear profile:</strong> remove a saved candidate profile in the comparison tool.</li>
          <li><strong>Sign out:</strong> remove the authentication cookie from your browser.</li>
          <li><strong>Browser settings:</strong> view and delete cookies and site data, block cookies, or restrict third-party content. Guidance is available from the provider of your browser.</li>
        </ul>
        <p>Blocking strictly necessary cookies may prevent sign-in, usage limits and saved settings from working. Public cutoff pages remain available.</p>
        <CookieSettingsButton className="policy-action" />
      </Clause>

      <Clause sections={SECTIONS} id="changes">
        <p>We will update this Cookie Policy before introducing any new non-essential cookie or materially changing the purpose of existing storage. Updates are published on this page with a revised effective date and version.</p>
      </Clause>

      <Clause sections={SECTIONS} id="contact">
        <p>Questions about this Cookie Policy, or reports that the Service’s storage differs from this policy, may be sent to {email}. Please include your browser, the page URL, the approximate time and the name of the cookie or request observed. Do not include authentication cookie values.</p>
      </Clause>
    </PolicyPage>
  );
}
