import type { Metadata } from "next";
import { PolicyPage } from "@/components/compliance/PolicyPage";
import { COMPLIANCE } from "@/lib/compliance";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "The complete DEETNUTS inventory of cookies, browser storage, optional analytics, consent controls and retention periods.",
  alternates: { canonical: "/compliance/cookie-policy" },
};

export default function CookiePolicy() {
  return (
    <PolicyPage
      title="Cookie policy"
      summary="DEETNUTS uses a small amount of first-party storage for security and requested features. Google Analytics remains off until you affirmatively allow it, and public cutoff pages continue to work after Decline."
    >
      <section id="overview">
        <h2>1. Scope</h2>
        <p>This policy explains cookies and similar browser storage used on deetnuts.com. A cookie is a small value a website asks a browser to return with later requests. Local storage keeps a value in the browser but does not automatically send it with every request. Both are covered here so the controls are not hidden behind technical terminology.</p>
        <p>Storage is divided into <strong>strictly necessary or requested-function storage</strong> and <strong>optional analytics</strong>. Necessary storage supports authentication, security, usage limits, consent memory and a setting or profile you explicitly ask the browser to remember. Optional analytics is disabled unless you select Allow.</p>
      </section>

      <section id="inventory">
        <h2>2. First-party storage inventory</h2>
        <div className="policy-table-wrap" role="region" aria-label="First-party storage inventory" tabIndex={0}>
          <table className="policy-table">
            <caption>Cookies and local storage created for DEETNUTS features</caption>
            <thead><tr><th scope="col">Name or pattern</th><th scope="col">Type</th><th scope="col">Category</th><th scope="col">Purpose</th><th scope="col">Typical duration</th></tr></thead>
            <tbody>
              <tr><th scope="row"><code>{COMPLIANCE.analyticsConsentCookie}</code></th><td data-label="Type">First-party cookie readable by the site</td><td data-label="Category">Necessary preference</td><td data-label="Purpose">Stores the current policy version and whether optional analytics is granted or denied. It prevents the banner from repeatedly asking and allows withdrawal to be applied.</td><td data-label="Typical duration">180 days from the latest choice.</td></tr>
              <tr><th scope="row"><code>mht_cet_state_cutoff_anonymous_requests</code></th><td data-label="Type">First-party HttpOnly cookie</td><td data-label="Category">Security and access control</td><td data-label="Purpose">Maintains a bounded anonymous search count to protect the state-cutoff endpoint from excessive use. It is not available to page JavaScript.</td><td data-label="Typical duration">7 days; removed when the relevant authenticated flow clears it.</td></tr>
              <tr><th scope="row"><code>sb-…-auth-token</code> and related Supabase values</th><td data-label="Type">First-party authentication cookies</td><td data-label="Category">Strictly necessary when signed in</td><td data-label="Purpose">Maintain and refresh the authenticated session, carry access and refresh tokens, and protect account-only features. Exact names and chunks depend on the Supabase project and token size.</td><td data-label="Typical duration">Controlled by the authenticated session and Supabase configuration; removed or replaced during sign-out, expiry or token rotation.</td></tr>
              <tr><th scope="row"><code>deetnuts_theme</code></th><td data-label="Type">Local storage</td><td data-label="Category">Requested preference</td><td data-label="Purpose">Remembers a manual Light or Dark selection. System mode removes this value and follows the device preference.</td><td data-label="Typical duration">Until System is selected or site storage is cleared.</td></tr>
              <tr><th scope="row"><code>deetnuts:admissions-profile:v1:mht-cet</code></th><td data-label="Type">Local storage</td><td data-label="Category">Requested feature</td><td data-label="Purpose">Saves the candidate comparison profile on the current device after you choose to save or compare it.</td><td data-label="Typical duration">Until Clear profile is used, the value is replaced, or site storage is cleared.</td></tr>
              <tr><th scope="row"><code>deetnuts:mht-cet-state-cutoffs:anonymous-actions</code></th><td data-label="Type">Local storage</td><td data-label="Category">Security and access control</td><td data-label="Purpose">Maintains the browser-side anonymous action count used by the state-cutoff experience.</td><td data-label="Typical duration">Until reset by the feature or site storage is cleared.</td></tr>
            </tbody>
          </table>
        </div>
        <p>Browsers and provider libraries may split a large authentication token across multiple cookies or change a technical suffix without changing the purpose described above.</p>
      </section>

      <section id="analytics-cookies">
        <h2>3. Optional Google Analytics storage</h2>
        <p>After Allow, the Google tag may create first-party GA4 cookies. The common values are:</p>
        <div className="policy-table-wrap" role="region" aria-label="Optional analytics cookie inventory" tabIndex={0}>
          <table className="policy-table">
            <caption>Optional analytics cookies</caption>
            <thead><tr><th scope="col">Name</th><th scope="col">Provider</th><th scope="col">Purpose</th><th scope="col">Default maximum</th></tr></thead>
            <tbody>
              <tr><th scope="row"><code>_ga</code></th><td data-label="Provider">Google Analytics</td><td data-label="Purpose">Distinguishes a browser for aggregate analytics.</td><td data-label="Default maximum">Configured for up to 180 days, subject to browser limits and earlier withdrawal.</td></tr>
              <tr><th scope="row"><code>_ga_*</code></th><td data-label="Provider">Google Analytics</td><td data-label="Purpose">Maintains GA4 session state for the configured measurement property.</td><td data-label="Default maximum">Configured for up to 180 days, subject to browser limits and earlier withdrawal.</td></tr>
            </tbody>
          </table>
        </div>
        <p>The site configures analytics storage as denied by default and does not load the external Google tag before Allow. Advertising storage, advertising user data and advertising personalisation remain denied. Google Signals and ad-personalisation signals are disabled. DEETNUTS does not use analytics cookies for admission decisions or advertising profiles.</p>
      </section>

      <section id="consent">
        <h2>4. How consent works</h2>
        <ol>
          <li>On a browser with no current versioned choice, the banner presents Decline and Allow with equal access.</li>
          <li>Until Allow, no external Google Analytics script is loaded and no analytics request is intentionally sent to Google.</li>
          <li>Allow stores the versioned preference, loads the Google tag and enables only analytics storage.</li>
          <li>Decline stores the versioned preference and leaves analytics disabled. Public pages and ordinary cutoff filters remain available.</li>
          <li>Cookie settings reopens the choice. Revoking a prior Allow removes known first-party Google Analytics cookies and reloads the page without the Google tag.</li>
          <li>A materially changed analytics purpose or consent design uses a new consent version and asks again.</li>
        </ol>
        <p>If the browser exposes an active Global Privacy Control signal, DEETNUTS treats optional analytics as denied on that device and does not offer an override while the signal remains active.</p>
      </section>

      <section id="external">
        <h2>5. Embedded and external services</h2>
        <p>Some pages request images from Cloudinary or display a YouTube player using the <code>youtube-nocookie.com</code> privacy-enhanced domain. Those requests disclose ordinary network information to the provider. The privacy-enhanced player is configured to limit personalisation, but YouTube may use cookies or comparable player storage when the embed loads or is used, according to its own controls.</p>
        <p>Selecting Google sign-in, opening a contribution checkout, or following an external link takes you into an independently operated service that may set its own storage. DEETNUTS’s analytics choice does not delete or control cookies already set by another domain.</p>
      </section>

      <section id="controls">
        <h2>6. Your controls</h2>
        <ul>
          <li>Use <strong>Cookie settings</strong> in either footer to review, decline, allow or revoke analytics.</li>
          <li>Use <strong>Theme settings</strong> to choose System, Light or Dark and remove the manual theme value.</li>
          <li>Use <strong>Clear profile</strong> in the candidate tool to remove its saved browser value and profile fragment.</li>
          <li>Use browser settings to inspect or delete site data, block cookies, clear local storage, or restrict third-party content.</li>
          <li>Use sign out to end the addressed local account session. Contact privacy support to request account deletion.</li>
        </ul>
        <p>Blocking strictly necessary authentication or security storage may prevent sign-in, usage-limit enforcement or saved settings from working. It does not prevent ordinary access to public cutoff pages.</p>
      </section>

      <section id="verification">
        <h2>7. Verifying the promise</h2>
        <p>Before analytics consent, developer tools should show no request to <code>googletagmanager.com</code> or <code>google-analytics.com</code> from the DEETNUTS analytics component. After Decline, the same remains true. The site’s automated browser test checks this behavior on a real page.</p>
        <p>Authentication, hosted images, embedded media and links are separate from optional analytics and are described separately above and in the Privacy Policy.</p>
      </section>

      <section id="changes-contact">
        <h2>8. Changes and contact</h2>
        <p>The effective date and version at the top apply to this inventory. If a new non-essential cookie or materially different analytics purpose is introduced, this policy and the consent mechanism must be updated before that use begins.</p>
        <p>Questions or a report that stored behavior differs from this policy may be sent to <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a>. Include the browser, page URL, approximate time and the cookie or request observed; do not include authentication token values.</p>
      </section>
    </PolicyPage>
  );
}
