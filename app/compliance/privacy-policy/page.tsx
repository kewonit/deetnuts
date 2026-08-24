import type { Metadata } from "next";
import { PolicyPage } from "@/components/compliance/PolicyPage";
import { COMPLIANCE } from "@/lib/compliance";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "A detailed privacy notice explaining what DEETNUTS processes, why, where it goes, how long it is kept, and how to make a privacy request.",
  alternates: { canonical: "/compliance/privacy-policy" },
};

export default function PrivacyPolicy() {
  return (
    <PolicyPage
      title="Privacy policy"
      summary="This notice explains, in concrete terms, what information DEETNUTS processes, why it is needed, which providers receive it, how long it is kept, and the controls available to you."
    >
      <section id="scope">
        <h2>1. Who this notice covers</h2>
        <p>This Privacy Policy applies to visitors, account holders, people using admission-comparison tools, contributors, support correspondents and other users of deetnuts.com. DEETNUTS determines how personal information is used for operation of the Service and is the contact for privacy and grievance requests.</p>
        <p>Public cutoff pages are open to everyone and do not require an account or analytics consent. This notice does not govern an official counselling portal, Google, DigitalOcean, Cloudflare, YouTube, Cloudinary, a payment checkout, or another independent site you choose to visit.</p>
        <p>Privacy and grievance contact: <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a>. Use the subject “Privacy request” and identify the relevant account or interaction without sending a password, one-time code, identity document or full payment-card number.</p>
      </section>

      <section id="collection">
        <h2>2. Information processed</h2>
        <div className="policy-table-wrap" role="region" aria-label="Information categories table" tabIndex={0}>
          <table className="policy-table">
            <caption>Information categories, sources and uses</caption>
            <thead><tr><th scope="col">Category</th><th scope="col">What it can include</th><th scope="col">Source</th><th scope="col">Why it is used</th></tr></thead>
            <tbody>
              <tr><th scope="row">Request and security data</th><td data-label="What it can include">IP address, approximate city or country derived from IP, date and time, requested route, HTTP method and status, referrer, user agent, device or browser class, request identifiers, performance, error and security events.</td><td data-label="Source">Your browser, hosting infrastructure and security controls.</td><td data-label="Why it is used">Deliver pages, route traffic, prevent abuse, investigate errors, maintain availability and protect accounts.</td></tr>
              <tr><th scope="row">Account and profile data</th><td data-label="What it can include">Google-provided account identifier, email address, display name and avatar; DEETNUTS account and session identifiers; password hash for an existing email account; profile name; avatar uploads; email-verification and authentication timestamps.</td><td data-label="Source">You, Google OAuth and the self-hosted DEETNUTS authentication service.</td><td data-label="Why it is used">Create and secure an account, maintain a session, display account details and support authenticated features.</td></tr>
              <tr><th scope="row">Admission-comparison inputs</th><td data-label="What it can include">Entered rank or percentile, score type, candidature type, home university, category, gender-seat eligibility and selected indicators for EWS, TFWS, disability, orphan or minority eligibility.</td><td data-label="Source">You, when you submit a comparison or save a profile in your browser.</td><td data-label="Why it is used">Derive applicable historical seat pools and calculate the comparison you requested.</td></tr>
              <tr><th scope="row">Service-use events</th><td data-label="What it can include">A random request identifier, feature name, broad platform, served/rejected/failed status and request duration. Bot integrations may additionally record the platform’s external message identifier and values needed to answer that request.</td><td data-label="Source">Your use of a search, API or bot feature.</td><td data-label="Why it is used">Enforce limits, diagnose failures, prevent duplicate processing and understand aggregate service reliability.</td></tr>
              <tr><th scope="row">Optional analytics</th><td data-label="What it can include">Sanitised route template, page-view event, Core Web Vitals, browser and device information, consented analytics identifiers, and network information necessarily received by Google when the tag is requested.</td><td data-label="Source">Your browser, only after an affirmative analytics choice.</td><td data-label="Why it is used">Measure page performance and broad usage so the Service can be improved.</td></tr>
              <tr><th scope="row">Messages and corrections</th><td data-label="What it can include">Email address, message content, attachments, relevant page or source identifiers, response history and abuse-prevention metadata.</td><td data-label="Source">You and the mail provider you use.</td><td data-label="Why it is used">Respond, verify a correction, resolve a grievance, keep an audit trail and protect the support channel.</td></tr>
              <tr><th scope="row">Contribution records</th><td data-label="What it can include">Transaction reference, status, amount and contact details that a checkout provider makes available to the project. Card and bank credentials are entered on the provider’s page, not on DEETNUTS.</td><td data-label="Source">The external checkout provider and you.</td><td data-label="Why it is used">Confirm and reconcile voluntary support, handle billing questions and meet accounting obligations.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="profile-processing">
        <h2>3. Admission-profile processing</h2>
        <p>A saved candidate profile is stored in browser local storage under a DEETNUTS key. A profile placed in a share link is encoded after the <code>#</code> fragment. Browsers do not include that fragment in the ordinary HTTP request for the page, but anyone who receives the complete link can read it.</p>
        <p>When you select the comparison action, the profile values are sent to the DEETNUTS comparison endpoint so the server can calculate a response. That request uses HTTPS in production, has a strict size limit, is validated, is returned with <code>no-store</code> caching, and is not intentionally written into the custom service-use event. Hosting and network providers still process ordinary request metadata.</p>
        <p>Because category, disability and minority selections can be sensitive in context, share a profile link only with a person you trust. Do not enter a diagnosis, certificate number, government identifier or document image. “Clear profile” removes the saved browser copy and the DEETNUTS profile fragment; it does not delete a copy that another person already saved from a shared link.</p>
      </section>

      <section id="analytics">
        <h2>4. Analytics and advertising</h2>
        <p>Google Analytics is optional and uses a global opt-in. Before an affirmative Allow choice, the external Google tag is not loaded and DEETNUTS does not send an analytics request to Google. Decline leaves public functionality available. The choice can be reopened from “Cookie settings” in either footer.</p>
        <p>DEETNUTS sends a route template instead of the exact dynamic college or profile path. URL fragments, cutoff-filter selections, account names, email addresses and admission-profile values are not added to analytics events. Google advertising storage, advertising user data and advertising personalisation stay denied; Google Signals and ad-personalisation signals are disabled in the site configuration.</p>
        <p>DEETNUTS does not sell personal information, use admission selections to build advertising profiles, operate interest-based advertising, or provide personal information to data brokers. A YouTube embed may independently display non-personalised advertising under YouTube’s controls. See the <a href="/compliance/cookie-policy">Cookie Policy</a> for the storage inventory and withdrawal mechanics.</p>
      </section>

      <section id="purposes">
        <h2>5. Purposes and grounds</h2>
        <p>DEETNUTS processes information only for a stated and lawful purpose, using no more than is reasonably necessary for that purpose. Depending on the feature and the law that applies, processing is based on your request or agreement, your consent, legitimate operation and security of the Service, compliance with law, protection of a person, or establishment and defence of legal claims.</p>
        <ul>
          <li><strong>Requested service:</strong> deliver pages, authenticate an account, calculate a comparison, answer a support request or process a contribution.</li>
          <li><strong>Consent:</strong> run optional Google Analytics and any other clearly identified optional processing.</li>
          <li><strong>Security and operation:</strong> prevent abuse, enforce usage limits, diagnose failures, preserve evidence of malicious activity and maintain reliable infrastructure.</li>
          <li><strong>Compliance:</strong> respond to valid legal process, keep records required by law and handle privacy, correction or dispute requests.</li>
        </ul>
        <p>Where consent is the applicable ground, it may be withdrawn as easily as it was given. Withdrawal does not make earlier lawful processing unlawful and does not prevent retention that another applicable legal ground requires.</p>
      </section>

      <section id="disclosures">
        <h2>6. Providers and disclosures</h2>
        <div className="policy-table-wrap" role="region" aria-label="Service providers table" tabIndex={0}>
          <table className="policy-table">
            <caption>Principal service providers and when they receive information</caption>
            <thead><tr><th scope="col">Provider or recipient</th><th scope="col">Function</th><th scope="col">Information involved</th><th scope="col">When</th></tr></thead>
            <tbody>
              <tr><th scope="row">DigitalOcean</th><td data-label="Function">Single-VM container hosting, local PocketBase database and file storage, host networking, infrastructure monitoring and operational availability checks.</td><td data-label="Information involved">Account, profile, session, avatar, database, service-use, request, network, performance, availability and error information processed by the origin server.</td><td data-label="When">When the Service, an account or a stored feature is used, or availability is checked.</td></tr>
              <tr><th scope="row">Cloudflare</th><td data-label="Function">Authoritative DNS, TLS termination, content delivery, request routing, caching and abuse protection.</td><td data-label="Information involved">IP address, requested hostname and route, HTTP and TLS metadata, device or browser information, approximate location, security signals, performance and error information.</td><td data-label="When">When the Service is requested through its public domains.</td></tr>
              <tr><th scope="row">Google</th><td data-label="Function">OAuth sign-in and optional Google Analytics.</td><td data-label="Information involved">OAuth identity and security data during sign-in; analytics information only after Allow.</td><td data-label="When">When Google sign-in is chosen or analytics is allowed.</td></tr>
              <tr><th scope="row">Cloudinary</th><td data-label="Function">Delivery of selected image assets.</td><td data-label="Information involved">Ordinary image-request metadata, including IP address, user agent and referrer information supplied by the browser.</td><td data-label="When">When a page loads a Cloudinary-hosted image.</td></tr>
              <tr><th scope="row">YouTube</th><td data-label="Function">Privacy-enhanced embedded video playback.</td><td data-label="Information involved">Player request, IP address, user agent, referrer and interaction data described by YouTube.</td><td data-label="When">When a page containing the embed loads or you interact with it.</td></tr>
              <tr><th scope="row">Checkout provider</th><td data-label="Function">External payment and transaction processing.</td><td data-label="Information involved">Information you enter at checkout and transaction details made available for reconciliation.</td><td data-label="When">Only if you open and use the external checkout.</td></tr>
              <tr><th scope="row">Authorities and advisers</th><td data-label="Function">Lawful requests, incident response and claims.</td><td data-label="Information involved">Only information reasonably relevant to the request, incident or claim.</td><td data-label="When">When required by law or reasonably necessary to protect a person, the Service or a legal position.</td></tr>
            </tbody>
          </table>
        </div>
        <p>DEETNUTS may also disclose information in a genuine transfer or reorganisation of the Service, subject to appropriate confidentiality and applicable notice requirements. It does not publish account or candidate-profile information as part of public cutoff pages.</p>
      </section>

      <section id="international">
        <h2>7. International processing</h2>
        <p>The Service and its providers may process information in India, the United States, the European Economic Area and other locations where they or their subprocessors operate. Those locations may apply different privacy rules. Where required, the relevant provider terms, contractual safeguards, adequacy mechanism or other lawful transfer method is used.</p>
        <p>Public internet transmission necessarily crosses networks operated by multiple entities. No policy can promise that information remains in one country merely because the visitor or DEETNUTS is located there.</p>
      </section>

      <section id="retention">
        <h2>8. Retention</h2>
        <p>Information is retained for the shortest period reasonably needed for the stated purpose, security, dispute handling and mandatory recordkeeping. The applicable period depends on the record:</p>
        <ul>
          <li><strong>Admission-profile values:</strong> the browser copy remains until you use Clear profile, clear site storage or overwrite it. Submitted comparison bodies are processed to return the result and are not intentionally stored in the custom service-use event.</li>
          <li><strong>Anonymous usage counter:</strong> the first-party server counter expires after seven days. The corresponding local action counter remains until cleared, reset or replaced.</li>
          <li><strong>Analytics consent:</strong> the versioned preference expires after 180 days unless changed sooner. Optional GA cookies follow the periods in the Cookie Policy and browser limits.</li>
          <li><strong>Analytics reports:</strong> event-level retention follows the configured Google Analytics property period. Aggregated reports and deletion-system latency may continue beyond the event-level setting as described by Google.</li>
          <li><strong>Accounts:</strong> active account and profile records remain while the account is used. After a verified deletion request, active account data is deleted or de-identified unless security, fraud, dispute or legal duties require a limited record.</li>
          <li><strong>Operational logs:</strong> origin access, runtime and host logs are configured for a maximum ordinary retention of 14 days and a bounded aggregate host allocation. Provider-level security and availability records follow the applicable DigitalOcean and Cloudflare controls. Security evidence may be retained longer when tied to an abuse investigation or legal requirement.</li>
          <li><strong>Support and corrections:</strong> ordinarily retained for up to 24 months after resolution, or longer when needed to document a material data correction, dispute, abuse report or legal obligation.</li>
          <li><strong>Contribution and accounting records:</strong> retained for the period required for reconciliation, tax, fraud prevention, chargebacks and applicable accounting law.</li>
          <li><strong>Backups:</strong> PocketBase creates a daily local application backup and retains up to seven copies. The VM is not enrolled in DigitalOcean’s paid managed backup or snapshot service. A restored backup follows the same purpose and retention controls as the active data.</li>
        </ul>
      </section>

      <section id="security">
        <h2>9. Security</h2>
        <p>DEETNUTS uses safeguards appropriate to the nature of the Service, including HTTPS in production, an origin restricted to authenticated Cloudflare traffic, secure response headers, non-root isolated containers, restricted server credentials, input validation, request-size and rate limits, no-store responses for personalised comparisons, authenticated account checks, provider access controls, checksum validation for cutoff artifacts and separation of public pages from account features.</p>
        <p>No internet service can guarantee absolute security. You are responsible for securing your Google account, device and complete share links. If you believe personal information or an account has been compromised, contact <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a> promptly with the time and nature of the incident, but do not email passwords or one-time codes.</p>
        <p>When a personal-data incident requires notice under applicable law, DEETNUTS will investigate, contain the issue, preserve appropriate evidence and notify affected people and authorities in the manner and timeframe required.</p>
      </section>

      <section id="choices">
        <h2>10. Your privacy choices and requests</h2>
        <p>Subject to applicable law and necessary verification, you may ask DEETNUTS to provide information about processing, give access to personal information associated with you, correct inaccurate or incomplete information, erase information no longer needed, withdraw consent, or address a grievance. Where applicable, you may also nominate another person to exercise a request in the event of death or incapacity and may complain to the competent data-protection authority after using the grievance process.</p>
        <ul>
          <li><strong>Analytics:</strong> use Cookie settings to Allow, Decline or revoke optional analytics.</li>
          <li><strong>Browser profile:</strong> use Clear profile and remove a shared fragment from any copy of the URL.</li>
          <li><strong>Account profile:</strong> update the displayed name in Account settings.</li>
          <li><strong>Account or data request:</strong> email <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a> from the account address where possible.</li>
          <li><strong>Marketing:</strong> DEETNUTS does not currently send behavioural marketing email. A future optional mailing list would require its own clear control.</li>
        </ul>
        <p>A request should state the action sought and the relevant feature, account email, URL, date or transaction reference. DEETNUTS may request proportionate verification, may redact another person’s information, and may refuse or limit a request where applicable law permits or requires it. A response will be provided within the applicable legal period; privacy grievances are targeted for resolution within one month.</p>
      </section>

      <section id="children">
        <h2>11. Children and students</h2>
        <p>The subject matter is relevant to students, including people under 18, but public cutoff pages do not require a name, account or candidate profile. DEETNUTS does not knowingly request birth dates, school records, identity documents or precise location from children and does not use student profiles for targeted advertising.</p>
        <p>If you are under 18, involve a parent or lawful guardian before creating an account, submitting a personalised profile, making a contribution, contacting support with personal information or allowing analytics. A parent or guardian may request review or deletion through the privacy contact. If DEETNUTS learns that personal information was processed without required permission, it will take reasonable steps to stop and delete that processing unless retention is legally required.</p>
      </section>

      <section id="automated-decisions">
        <h2>12. Automated comparisons</h2>
        <p>Comparison tools apply deterministic filters and calculations to historical cutoff data. They do not make an admission decision, communicate with a counselling authority, change your application or produce a legally significant decision about you. No DEETNUTS output should be used as the sole basis for a decision that materially affects another person.</p>
      </section>

      <section id="changes">
        <h2>13. Policy changes</h2>
        <p>This page carries an effective date and version. Material changes will be presented with an updated date and, where required, a prominent notice or renewed choice. A new purpose that requires consent will not be treated as accepted merely because you visited before the change.</p>
        <p>This notice is intended to remain understandable on its own and to operate alongside applicable Indian privacy requirements, including provisions of the Digital Personal Data Protection Act, 2023 and its rules as they come into force, without limiting protections that apply in another jurisdiction.</p>
      </section>

      <section id="contact">
        <h2>14. Privacy and grievance contact</h2>
        <p>Send privacy questions, grievances, access or deletion requests and suspected incidents to <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a>. DEETNUTS will acknowledge a properly directed grievance, investigate it in good faith and target resolution within one month or the shorter period required by applicable law.</p>
      </section>
    </PolicyPage>
  );
}
