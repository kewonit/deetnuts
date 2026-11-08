import type { Metadata } from "next";
import Link from "next/link";
import { Clause, PolicyPage } from "@/components/compliance/PolicyPage";
import { COMPLIANCE } from "@/lib/compliance";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How DEETNUTS collects, uses, discloses, retains and protects personal data, and how to exercise your rights.",
  alternates: { canonical: "/compliance/privacy-policy" },
};

const SECTIONS = [
  { id: "scope", label: "Introduction and scope" },
  { id: "definitions", label: "Definitions" },
  { id: "collection", label: "Personal data we collect" },
  { id: "not-requested", label: "Personal data we do not request" },
  { id: "purposes", label: "Purposes of processing" },
  { id: "grounds", label: "Legal grounds for processing" },
  { id: "profiles", label: "Candidate profiles and comparison tools" },
  { id: "study-map", label: "Exam countdowns and the study map" },
  { id: "community", label: "Community Integrations" },
  { id: "analytics", label: "Analytics, advertising and sale of data" },
  { id: "cookies", label: "Cookies and similar technologies" },
  { id: "disclosures", label: "Service providers and other recipients" },
  { id: "transfers", label: "International transfers" },
  { id: "retention", label: "Retention" },
  { id: "security", label: "Security" },
  { id: "breaches", label: "Personal data breaches" },
  { id: "rights", label: "Your rights" },
  { id: "requests", label: "Exercising your rights" },
  { id: "children", label: "Children" },
  { id: "automated-processing", label: "Automated processing" },
  { id: "signals", label: "Browser privacy signals" },
  { id: "outside-india", label: "Visitors outside India" },
  { id: "changes", label: "Changes to this Privacy Policy" },
  { id: "contact", label: "Grievance Officer and contact" },
] as const;

const email = <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a>;

export default function PrivacyPolicy() {
  return (
    <PolicyPage title="Privacy Policy" contents={SECTIONS}>
      <Clause sections={SECTIONS} id="scope">
        <p>This Privacy Policy describes how DEETNUTS (“DEETNUTS”, “we”, “us” or “our”) collects, uses, discloses, retains and protects personal data in connection with the website at deetnuts.com and its subdomains, its tools, accounts and Community Integrations (collectively, the “Service”). It should be read together with the <Link href="/compliance/terms-and-conditions">Terms and Conditions</Link> and the <Link href="/compliance/cookie-policy">Cookie Policy</Link>.</p>
        <p>DEETNUTS determines the purposes and means of processing personal data in connection with the Service and is the Data Fiduciary for that processing within the meaning of the Digital Personal Data Protection Act, 2023 (the “DPDP Act”). This Privacy Policy is intended to meet the requirements of the DPDP Act and the Digital Personal Data Protection Rules, 2025 as they come into force, the Information Technology Act, 2000 and the rules made under it, and other Applicable Law.</p>
        <p>This Privacy Policy applies to visitors, Account holders, users of comparison and countdown tools, participants in the study map, users of Community Integrations, correspondents and contributors. It does not apply to websites or services operated by third parties, including Official Sources, Google, YouTube, Discord, Reddit, GitHub or payment providers, even where the Service links to or embeds them.</p>
        <p>Public cutoff pages can be used without an Account, without providing a name and without consenting to analytics.</p>
      </Clause>

      <Clause sections={SECTIONS} id="definitions">
        <p>Capitalised terms not defined in this Privacy Policy have the meanings given in the Terms and Conditions. In addition:</p>
        <ul>
          <li><strong>“Personal data”</strong> means any data about an individual who is identifiable by or in relation to that data.</li>
          <li><strong>“Processing”</strong> means any operation performed on personal data, including collection, recording, storage, use, sharing, disclosure and erasure.</li>
          <li><strong>“Data Principal”</strong> means the individual to whom personal data relates and, in the case of a child or a person with a disability, includes the parent or lawful guardian acting on their behalf.</li>
          <li><strong>“Data Processor”</strong> means a person that processes personal data on behalf of DEETNUTS.</li>
        </ul>
      </Clause>

      <Clause sections={SECTIONS} id="collection">
        <p>The personal data we process depends on how you use the Service. The table below sets out each category, its source and its purpose.</p>
        <div className="policy-table-wrap" role="region" aria-label="Categories of personal data" tabIndex={0}>
          <table className="policy-table">
            <caption>Categories of personal data, sources and purposes</caption>
            <thead><tr><th scope="col">Category</th><th scope="col">Data elements</th><th scope="col">Source</th><th scope="col">Purpose</th></tr></thead>
            <tbody>
              <tr><th scope="row">Request and device data</th><td data-label="Data elements">IP address; approximate country or city derived from the IP address; date and time; requested URL and HTTP method; response status; referrer; user agent; browser and device type; request identifiers; performance, error and security events.</td><td data-label="Source">Your browser or client, and our hosting and network infrastructure.</td><td data-label="Purpose">Delivering pages, routing and caching traffic, preventing abuse, diagnosing errors, maintaining availability and securing Accounts.</td></tr>
              <tr><th scope="row">Account data</th><td data-label="Data elements">Email address; display name; profile picture; Google account identifier where Google sign-in is used; password hash where an email account is used; Account and session identifiers; verification and authentication timestamps; uploaded avatar.</td><td data-label="Source">You, and Google when you choose Google sign-in.</td><td data-label="Purpose">Creating and securing your Account, maintaining your session and providing Account features.</td></tr>
              <tr><th scope="row">Candidate profile values</th><td data-label="Data elements">Rank or percentile and score type; candidature type; home university; reservation category; gender-specific seat eligibility; and any selected indicators for EWS, TFWS, persons with disabilities, orphan or minority eligibility.</td><td data-label="Source">You, when you enter or save a profile or request a comparison.</td><td data-label="Purpose">Determining the applicable historical seat pools and returning the comparison you request.</td></tr>
              <tr><th scope="row">Study-map data</th><td data-label="Data elements">Selected examination, session and subject; approximate city and state; an offset map position; a generated avatar identifier; an anonymous session identifier; session start, activity and end times.</td><td data-label="Source">You, and a location lookup performed by your browser when you start a session.</td><td data-label="Purpose">Displaying your study session on the public study map and protecting the map from abuse.</td></tr>
              <tr><th scope="row">Countdown preferences</th><td data-label="Data elements">Saved countdowns, countdown theme and avatar identifier, including data you import from the TimeKeeper service.</td><td data-label="Source">You.</td><td data-label="Purpose">Remembering your countdowns and preferences on your device.</td></tr>
              <tr><th scope="row">Community Integration data</th><td data-label="Data elements">The platform’s identifier for the message or interaction; the server, channel or subreddit from which it was sent; command values such as rank or percentile, year and round; result count; processing status and duration; and metadata supplied by the platform that is needed to process and reply to the request.</td><td data-label="Source">You, and Discord or Reddit when you issue a command.</td><td data-label="Purpose">Answering your request, preventing duplicate replies, enforcing usage limits and diagnosing failures.</td></tr>
              <tr><th scope="row">Service-use events</th><td data-label="Data elements">A random request identifier; feature name; platform; outcome (served, rejected, failed or duplicate); query parameters needed for the feature; result count; duration; error code; and an anonymous usage counter for certain search features.</td><td data-label="Source">Your use of search, API and Community Integration features.</td><td data-label="Purpose">Enforcing usage limits, diagnosing failures and understanding aggregate reliability.</td></tr>
              <tr><th scope="row">Optional analytics data</th><td data-label="Data elements">Page-view events with a generalised route; Core Web Vitals; browser and device information; analytics identifiers; and network information received by Google when the analytics tag is requested.</td><td data-label="Source">Your browser, only after you select Allow.</td><td data-label="Purpose">Measuring performance and aggregate usage to improve the Service.</td></tr>
              <tr><th scope="row">Correspondence</th><td data-label="Data elements">Name and email address; message content and attachments; relevant URLs and identifiers; response history.</td><td data-label="Source">You.</td><td data-label="Purpose">Responding to enquiries, verifying corrections, handling grievances and rights requests, and keeping records of them.</td></tr>
              <tr><th scope="row">Payment records</th><td data-label="Data elements">Transaction reference, amount, currency, status, date and the contact details that the payment provider makes available. Card and bank credentials are entered on the provider’s page and are not received by DEETNUTS.</td><td data-label="Source">The payment provider, and you.</td><td data-label="Purpose">Confirming and reconciling contributions, handling billing queries and meeting accounting and tax obligations.</td></tr>
              <tr><th scope="row">Contributor information</th><td data-label="Data elements">Public GitHub username, profile picture and contribution counts of people who have contributed to the DEETNUTS repository.</td><td data-label="Source">GitHub’s public interface.</td><td data-label="Purpose">Crediting contributors on the Creators page.</td></tr>
            </tbody>
          </table>
        </div>
      </Clause>

      <Clause sections={SECTIONS} id="not-requested">
        <p>The Service does not request, and you should not provide, any of the following: passwords or one-time codes for any other service; admission-portal or counselling credentials; Aadhaar, PAN, passport or other government identification numbers or documents; application numbers or certificate numbers; medical records or diagnoses; payment-card numbers, security codes or bank credentials; or precise location data. If you send such information to us, we may delete it without using it.</p>
      </Clause>

      <Clause sections={SECTIONS} id="purposes">
        <p>We process personal data only for the following purposes, and only to the extent necessary for each purpose:</p>
        <ul>
          <li>to provide the Service and the features you request, including pages, Accounts, comparisons, countdowns, the study map and Community Integrations;</li>
          <li>to authenticate users, maintain sessions and secure Accounts;</li>
          <li>to protect the Service, its users and third parties from fraud, abuse, security incidents and unlawful activity, including by enforcing usage limits;</li>
          <li>to monitor, diagnose and improve the performance, reliability and accuracy of the Service;</li>
          <li>to measure aggregate usage where you have consented to optional analytics;</li>
          <li>to respond to enquiries, correction requests, grievances and requests to exercise your rights;</li>
          <li>to process and reconcile voluntary contributions;</li>
          <li>to comply with Applicable Law, legal process and requests from competent authorities; and</li>
          <li>to establish, exercise or defend legal claims.</li>
        </ul>
        <p>We do not process personal data for any purpose that is incompatible with these purposes without first informing you and, where required, obtaining your consent.</p>
      </Clause>

      <Clause sections={SECTIONS} id="grounds">
        <p>We process personal data on the following grounds, as applicable to the activity concerned:</p>
        <ul>
          <li><strong>Consent.</strong> Where you provide consent, including for optional analytics, the study map and Account creation. Consent is free, specific, informed, unconditional and unambiguous, and may be withdrawn at any time.</li>
          <li><strong>Voluntary provision for a specified purpose.</strong> Where you voluntarily provide personal data for a purpose, such as requesting a comparison or sending us a message, and have not indicated that you do not consent to its use for that purpose.</li>
          <li><strong>Legal obligation.</strong> Where processing is required to comply with Applicable Law, a judgment or order, or a request from a competent authority.</li>
          <li><strong>Other legitimate uses.</strong> Where processing is permitted by Applicable Law without consent, including to respond to a medical emergency or threat to safety, or to ensure the security and integrity of the Service.</li>
        </ul>
        <p>Withdrawal of consent does not affect the lawfulness of processing carried out before withdrawal. Following withdrawal, we will cease processing the relevant personal data within a reasonable time unless continued processing is required or permitted by Applicable Law. Withdrawal may mean that a feature that depends on that consent is no longer available to you.</p>
      </Clause>

      <Clause sections={SECTIONS} id="profiles">
        <p>A candidate profile that you save is stored in your browser’s local storage on your device. It is not stored in your Account and is not transmitted to DEETNUTS until you request a comparison.</p>
        <p>When you request a comparison, the profile values are transmitted over an encrypted connection to the DEETNUTS comparison service, which validates them, calculates the result and returns it with caching disabled. The profile values are not intentionally written to service-use records. Ordinary request data is processed by our hosting and network providers as described in section 12.</p>
        <p>If you create a share link, the profile values are encoded in the part of the URL that follows the <code>#</code> character. Browsers do not send that part of the URL to the server when loading the page, but any person who receives the complete link can read the profile values. Because reservation category, disability and minority selections may be sensitive, share a profile link only with people you trust.</p>
        <p>Selecting “Clear profile” removes the saved copy from your browser and the profile from the current URL. It does not remove copies of a link that you have already shared.</p>
      </Clause>

      <Clause sections={SECTIONS} id="study-map">
        <p>Saved countdowns and countdown preferences are stored in your browser’s local storage and are not transmitted to DEETNUTS. If you import countdowns from the TimeKeeper service, the transfer is carried out using a single-use, time-limited token, and the imported data is stored in your browser.</p>
        <p>The study map is optional. Starting a study session constitutes your consent to the following processing:</p>
        <ul>
          <li>your browser sends a request to IPinfo to determine an approximate city, state and map position from your IP address. The request is made without cookies or referrer information;</li>
          <li>the map position is randomly offset by up to approximately five kilometres before it leaves your browser. The position returned by IPinfo is not stored or transmitted to DEETNUTS. If the lookup fails or returns a location outside India, a default location is used instead;</li>
          <li>an anonymous identity is created with Supabase, which operates the study-map database and real-time service, and the session details listed in section 3 are stored there; and</li>
          <li>the selected examination, session and subject, approximate city and state, offset map position, generated avatar and elapsed study time are displayed publicly to other visitors in real time.</li>
        </ul>
        <p>Avatars are generated by DiceBear from a random identifier stored in your browser; no name or photograph is used. A session is removed from the public map when you end it or when it stops sending activity signals. You can withdraw consent at any time by ending your session.</p>
      </Clause>

      <Clause sections={SECTIONS} id="community">
        <p>When you issue a command to a DEETNUTS Community Integration on Discord or Reddit, the platform transmits your command and associated metadata to DEETNUTS. We use that information to produce and post a reply, to prevent duplicate replies and to enforce usage limits. Replies are posted publicly in the community where the command was issued, in accordance with the platform’s settings.</p>
        <p>Your use of Discord and Reddit is governed by their own terms and privacy policies. DEETNUTS does not control the information that those platforms collect, display or retain.</p>
      </Clause>

      <Clause sections={SECTIONS} id="analytics">
        <p>Google Analytics is used only if you select Allow in the cookie settings. Until you do so, the Google tag is not loaded and no analytics request is sent to Google. Declining analytics does not affect your ability to use the Service.</p>
        <p>Where analytics is allowed, DEETNUTS sends a generalised route rather than the exact page path for dynamic college and profile pages. URL fragments, cutoff filter selections, Account names, email addresses and candidate profile values are not included in analytics events. Google advertising storage, advertising user data and advertising personalisation are denied, and Google Signals and advertising personalisation signals are disabled.</p>
        <p>DEETNUTS does not sell personal data, does not share personal data for cross-context behavioural advertising, does not use candidate profile values for advertising, does not display interest-based advertising and does not provide personal data to data brokers. A YouTube video embedded in the Service may display non-personalised advertising under YouTube’s own controls.</p>
      </Clause>

      <Clause sections={SECTIONS} id="cookies">
        <p>The Service uses cookies and browser storage that are necessary for security, authentication and features you request, and optional analytics cookies that are used only with your consent. The <Link href="/compliance/cookie-policy">Cookie Policy</Link> lists each item, its purpose and its duration, and explains how to change your choices.</p>
      </Clause>

      <Clause sections={SECTIONS} id="disclosures">
        <p>We disclose personal data only to the recipients listed below and only to the extent necessary for the stated function. Service providers that act as Data Processors process personal data on our behalf under contractual terms. Third-party platforms that you choose to use process personal data as independent controllers under their own policies.</p>
        <div className="policy-table-wrap" role="region" aria-label="Recipients of personal data" tabIndex={0}>
          <table className="policy-table">
            <caption>Recipients of personal data</caption>
            <thead><tr><th scope="col">Recipient</th><th scope="col">Function</th><th scope="col">Personal data involved</th><th scope="col">When</th></tr></thead>
            <tbody>
              <tr><th scope="row">DigitalOcean</th><td data-label="Function">Server hosting, database and file storage, networking and infrastructure monitoring.</td><td data-label="Personal data involved">All personal data stored or processed by the DEETNUTS origin server, including Account, service-use, request and log data.</td><td data-label="When">Whenever the Service is used.</td></tr>
              <tr><th scope="row">Cloudflare</th><td data-label="Function">DNS, TLS termination, content delivery, caching, request routing, abuse and bot protection, and identity-gated administrator access.</td><td data-label="Personal data involved">IP address, request and TLS metadata, browser information, approximate location and security signals; for administrators, the verified email address and authentication result.</td><td data-label="When">Whenever the Service is requested through its domains.</td></tr>
              <tr><th scope="row">Google</th><td data-label="Function">Google sign-in and optional Google Analytics.</td><td data-label="Personal data involved">Sign-in identity and security data; analytics data only after you select Allow.</td><td data-label="When">When you sign in with Google or allow analytics.</td></tr>
              <tr><th scope="row">Supabase</th><td data-label="Function">Study-map database, anonymous authentication and real-time updates.</td><td data-label="Personal data involved">Study-map data, anonymous session identifier and request metadata.</td><td data-label="When">When you open the study map or start a study session.</td></tr>
              <tr><th scope="row">IPinfo</th><td data-label="Function">Approximate location lookup for the study map.</td><td data-label="Personal data involved">IP address and browser request metadata.</td><td data-label="When">Only when you start a study session.</td></tr>
              <tr><th scope="row">DiceBear</th><td data-label="Function">Generation of study-map avatar images.</td><td data-label="Personal data involved">Random avatar identifier, IP address and browser request metadata.</td><td data-label="When">When study-map avatars are displayed.</td></tr>
              <tr><th scope="row">Cloudinary</th><td data-label="Function">Image delivery.</td><td data-label="Personal data involved">IP address, user agent and referrer.</td><td data-label="When">When a page loads an image hosted by Cloudinary.</td></tr>
              <tr><th scope="row">YouTube</th><td data-label="Function">Embedded video playback using the privacy-enhanced domain.</td><td data-label="Personal data involved">IP address, user agent, referrer and player interaction data.</td><td data-label="When">When a page with an embedded video loads or you interact with the player.</td></tr>
              <tr><th scope="row">Discord and Reddit</th><td data-label="Function">Platforms on which Community Integrations operate.</td><td data-label="Personal data involved">Commands and replies, and data that the platform collects under its own policy.</td><td data-label="When">When you use a Community Integration.</td></tr>
              <tr><th scope="row">Payment provider</th><td data-label="Function">Processing of voluntary contributions.</td><td data-label="Personal data involved">Information you enter at checkout and the transaction details made available to DEETNUTS.</td><td data-label="When">Only if you make a payment.</td></tr>
              <tr><th scope="row">Authorities and professional advisers</th><td data-label="Function">Compliance with legal obligations, incident response and legal claims.</td><td data-label="Personal data involved">Only personal data relevant to the request, incident or claim.</td><td data-label="When">When required by Applicable Law or reasonably necessary to protect a person, the Service or our legal rights.</td></tr>
            </tbody>
          </table>
        </div>
        <p>If the operation of the Service is transferred or reorganised, personal data may be transferred to the successor operator, which will be bound by this Privacy Policy or will provide notice of any change as required by Applicable Law. Account data and candidate profile values are never published on public cutoff pages.</p>
      </Clause>

      <Clause sections={SECTIONS} id="transfers">
        <p>The primary DEETNUTS origin infrastructure is located in India. Our service providers may process personal data in India, the United States, the European Economic Area and other countries in which they or their sub-processors operate. Transfers of personal data outside India are made in accordance with the DPDP Act and are not made to any country or territory to which transfer is restricted by notification of the Central Government.</p>
        <p>Where Applicable Law requires a specific safeguard for an international transfer, we rely on the safeguards provided in our service providers’ terms, such as standard contractual clauses.</p>
      </Clause>

      <Clause sections={SECTIONS} id="retention">
        <p>We retain personal data only for as long as necessary for the purpose for which it was collected, and thereafter only where retention is required by Applicable Law, for the resolution of disputes or for the investigation of security incidents. Specific retention periods are as follows:</p>
        <ul>
          <li><strong>Candidate profile values:</strong> stored in your browser until you select “Clear profile”, replace the profile or clear your browser’s site data. Values sent for a comparison are processed to return the result and are not intentionally retained.</li>
          <li><strong>Countdown preferences:</strong> stored in your browser until you remove them or clear your browser’s site data.</li>
          <li><strong>Study-map data:</strong> displayed while your session is active and retained thereafter only as long as reasonably necessary to operate the map and prevent abuse.</li>
          <li><strong>Accounts:</strong> retained for as long as your Account is active. Following a verified deletion request, Account data is deleted or de-identified, except for limited records that we are required to retain for security, dispute resolution or compliance with Applicable Law. Where an Account has been inactive for an extended period, we may delete it after giving notice to the associated email address at least forty-eight (48) hours in advance.</li>
          <li><strong>Server and access logs:</strong> configured for an ordinary retention period of up to fourteen (14) days, unless a longer period is required by Applicable Law or for the investigation of a specific security incident or abuse. Logs held by Cloudflare and DigitalOcean are subject to those providers’ retention controls.</li>
          <li><strong>Service-use and Community Integration records:</strong> retained for as long as necessary to enforce usage limits, prevent duplicate processing and diagnose reliability issues.</li>
          <li><strong>Anonymous usage counter:</strong> the server cookie expires after seven (7) days; the browser counter remains until it is reset by the feature or your browser’s site data is cleared.</li>
          <li><strong>Analytics consent preference:</strong> one hundred and eighty (180) days from your latest choice, unless changed earlier.</li>
          <li><strong>Analytics data:</strong> event-level data is retained in accordance with the retention period configured in Google Analytics. Aggregated reports may be retained for longer as described by Google.</li>
          <li><strong>Correspondence, corrections and grievances:</strong> ordinarily retained for up to twenty-four (24) months after resolution, or for longer where necessary to document a material data correction, dispute, abuse report or legal obligation.</li>
          <li><strong>Payment records:</strong> retained for the period required for reconciliation, prevention of fraud and chargebacks, and compliance with tax and accounting law.</li>
          <li><strong>Backups:</strong> the database is backed up daily and up to seven (7) ordinary backups are kept. A verified, encrypted archive or a short-term server snapshot may also be created before a significant infrastructure change and kept for a limited rollback period. Data restored from a backup remains subject to this Privacy Policy, and deleted data is removed from backups as they expire.</li>
        </ul>
      </Clause>

      <Clause sections={SECTIONS} id="security">
        <p>We implement reasonable security safeguards appropriate to the nature of the personal data and the Service, including:</p>
        <ul>
          <li>encryption of data in transit using HTTPS;</li>
          <li>restriction of the origin server to traffic that has passed through Cloudflare, and restriction of administrative access to a named identity with multi-factor authentication;</li>
          <li>host-only, HttpOnly and Secure authentication cookies;</li>
          <li>isolated application containers running without root privileges, restricted server credentials and firewall rules;</li>
          <li>input validation, request-size limits and rate limits;</li>
          <li>disabling of caching for personalised and administrative responses;</li>
          <li>access controls on service-provider accounts; and</li>
          <li>regular backups and checksum verification of published data.</li>
        </ul>
        <p>No method of transmission or storage is completely secure, and we cannot guarantee absolute security. You are responsible for keeping your credentials, devices and shared links secure. If you believe that your Account or personal data has been compromised, contact {email} promptly. Do not include passwords or one-time codes in your message.</p>
      </Clause>

      <Clause sections={SECTIONS} id="breaches">
        <p>If we become aware of a personal data breach, we will take prompt steps to investigate and contain it, preserve relevant evidence and mitigate its effects. Where required by Applicable Law, we will notify the Data Protection Board of India, CERT-In and the affected Data Principals in the form and within the time prescribed, including a description of the breach, its likely consequences, the measures taken and the steps that affected Data Principals can take to protect themselves.</p>
      </Clause>

      <Clause sections={SECTIONS} id="rights">
        <p>Subject to Applicable Law, you have the following rights in respect of your personal data:</p>
        <ul>
          <li><strong>Access.</strong> To obtain a summary of the personal data we process about you and the processing activities undertaken, and the identities of the persons with whom it has been shared.</li>
          <li><strong>Correction and completion.</strong> To have inaccurate or misleading personal data corrected, incomplete personal data completed and outdated personal data updated.</li>
          <li><strong>Erasure.</strong> To have personal data erased where it is no longer necessary for the purpose for which it was collected, unless retention is required by Applicable Law.</li>
          <li><strong>Withdrawal of consent.</strong> To withdraw consent at any time, with the same ease with which it was given.</li>
          <li><strong>Grievance redressal.</strong> To have a grievance concerning our processing of your personal data addressed by us, and, after exhausting that process, to complain to the Data Protection Board of India.</li>
          <li><strong>Nomination.</strong> To nominate another individual to exercise your rights in the event of your death or incapacity.</li>
        </ul>
        <p>Several controls are available directly within the Service:</p>
        <ul>
          <li><strong>Analytics:</strong> use “Cookie settings” in the site footer to allow, decline or withdraw consent for analytics.</li>
          <li><strong>Candidate profile:</strong> use “Clear profile” in the comparison tool.</li>
          <li><strong>Display name:</strong> update it in Account settings.</li>
          <li><strong>Study map:</strong> end your study session.</li>
          <li><strong>Browser storage:</strong> clear site data in your browser settings.</li>
        </ul>
      </Clause>

      <Clause sections={SECTIONS} id="requests">
        <p>To exercise a right, send a request to {email} with the subject line “Privacy request”. Where possible, send the request from the email address associated with your Account, and state the right you wish to exercise and the relevant feature, Account, URL, date or transaction reference.</p>
        <p>We may ask for information reasonably necessary to verify your identity, or the authority of a person acting on your behalf, before acting on a request. We may decline or limit a request where permitted or required by Applicable Law, including where it would disclose personal data of another person or where the data must be retained for a legal obligation, in which case we will explain the reasons.</p>
        <p>We will respond to a request within thirty (30) days of receipt, and in any event within the period prescribed by Applicable Law. Requests are handled free of charge, except where Applicable Law permits a reasonable fee for requests that are manifestly unfounded, excessive or repetitive.</p>
      </Clause>

      <Clause sections={SECTIONS} id="children">
        <p>The Service is relevant to students, including individuals under 18 years of age. Public pages can be used without providing personal data. Where Applicable Law requires verifiable consent of a parent or lawful guardian before processing the personal data of a child, a child may create an Account, save or submit a candidate profile, participate in the study map, contact us with personal information, allow analytics or make a payment only after such consent has been given.</p>
        <p>DEETNUTS does not undertake tracking or behavioural monitoring of children, does not direct targeted advertising at children and does not knowingly request dates of birth, school records, identity documents or precise location from children. If we learn that we have processed a child’s personal data without required consent, we will stop that processing and delete the data unless retention is required by Applicable Law. A parent or lawful guardian may contact {email} to review or request deletion of a child’s personal data.</p>
      </Clause>

      <Clause sections={SECTIONS} id="automated-processing">
        <p>Comparison and predictor tools apply defined rules and calculations to historical data and the values you enter. They do not make decisions that produce legal or similarly significant effects concerning you, do not communicate with any counselling authority and do not alter any application. Their outputs are informational only, as described in the Terms and Conditions.</p>
      </Clause>

      <Clause sections={SECTIONS} id="signals">
        <p>If your browser sends a Global Privacy Control signal, DEETNUTS treats optional analytics as declined on that browser and does not offer an option to override the signal while it remains active. Other “Do Not Track” signals are not standardised, and the Service does not respond to them differently; however, no optional tracking occurs without your consent.</p>
      </Clause>

      <Clause sections={SECTIONS} id="outside-india">
        <p>If you access the Service from the European Economic Area, the United Kingdom or another jurisdiction with comparable data protection law, DEETNUTS is the controller of your personal data. Our legal bases are your consent (for optional analytics and the study map), the performance of our agreement with you (for Accounts and requested features), our legitimate interests in operating, securing and improving the Service (for request data, logs and service-use records), and compliance with legal obligations.</p>
        <p>In addition to the rights described in section 17, you may have the right to restrict or object to processing based on legitimate interests, to receive personal data you have provided in a portable format, and to lodge a complaint with the data protection supervisory authority in your place of residence or work.</p>
      </Clause>

      <Clause sections={SECTIONS} id="changes">
        <p>We may update this Privacy Policy from time to time. The updated policy will be published on this page with a revised effective date and version. Where a change is material, we will provide reasonable additional notice, such as a notice on the Service or an email to the address associated with your Account. Where a change introduces a new purpose that requires consent, we will request your consent before processing for that purpose.</p>
      </Clause>

      <Clause sections={SECTIONS} id="contact">
        <p>Questions, requests and grievances concerning this Privacy Policy or our processing of personal data may be addressed to the Grievance Officer, DEETNUTS, at {email}. Please use the subject line “Privacy request” or “Grievance”, as applicable.</p>
        <p>We aim to acknowledge a grievance within seven (7) days and to resolve it within thirty (30) days of receipt, and in any event within the period prescribed by Applicable Law. If you are not satisfied with our response, you may approach the Data Protection Board of India.</p>
      </Clause>
    </PolicyPage>
  );
}
