import type { Metadata } from "next";
import { PolicyPage } from "@/components/compliance/PolicyPage";
import { COMPLIANCE } from "@/lib/compliance";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "The terms governing access to and use of DEETNUTS, its college information, accounts, comparison tools and public pages.",
  alternates: { canonical: "/compliance/terms-and-conditions" },
};

export default function Terms() {
  return (
    <PolicyPage
      title="Terms and conditions"
      summary="These terms govern the DEETNUTS website, public college information, comparison tools, accounts and related services. Please read them before relying on or using the service."
    >
      <section id="agreement">
        <h2>1. Agreement and scope</h2>
        <p>These Terms and Conditions form an agreement between you and DEETNUTS concerning your access to and use of deetnuts.com, its subpages, interfaces, accounts, tools and content (collectively, the “Service”). “You” means the individual using the Service and, where that individual acts for an organisation, that organisation.</p>
        <p>By accessing the Service, creating an account, or selecting a button that states you agree to these terms, you confirm that you have read and accepted them. If you do not agree, do not create an account or use restricted or interactive features. You may still review this document and any page that must remain available for legal or support purposes.</p>
        <p>The <a href="/compliance/privacy-policy">Privacy Policy</a>, <a href="/compliance/cookie-policy">Cookie Policy</a>, and <a href="/compliance/automated-access">Automated Access Policy</a> are incorporated into these terms where relevant to the activity they describe.</p>
      </section>

      <section id="service">
        <h2>2. What DEETNUTS provides</h2>
        <p>DEETNUTS is an independent educational-information service. Public cutoff pages and their published facts are open to everyone without requiring an account. The Service organises college, programme, counselling, seat-pool, opening-rank and closing-rank information and may provide historical comparisons or candidate-specific filtering.</p>
        <p>DEETNUTS is not JoSAA, CSAB, NTA, CET Cell Maharashtra, a university, a college, an examination authority, a counselling authority or a government body. References to those organisations identify the relevant examination, institution or source; they do not imply affiliation, approval, sponsorship or endorsement.</p>
        <div className="policy-callout"><p><strong>Admission decisions must be verified officially.</strong> The Service is a research aid, not an admission offer, eligibility certificate, counselling allocation, legal opinion or professional educational advice.</p></div>
      </section>

      <section id="eligibility">
        <h2>3. Eligibility and users under 18</h2>
        <p>You must be capable of entering a binding agreement under applicable law. If you are under 18, use account features, personalised comparisons, support channels and optional analytics only with the involvement and permission of a parent or lawful guardian. A parent or guardian who permits such use accepts responsibility for supervising it.</p>
        <p>Do not submit identity documents, passwords, application credentials, payment-card information, medical records or other information that the Service does not expressly request. DEETNUTS may suspend an account or remove submitted material when reasonably necessary to protect a child, another person or the Service.</p>
      </section>

      <section id="information">
        <h2>4. College data, cutoffs and comparisons</h2>
        <h3>Historical information</h3>
        <p>Cutoffs describe past published counselling outcomes. They do not predict future demand, establish eligibility, reserve a seat, show real-time vacancy, or guarantee admission at any rank, percentile, category or preference. Rules, seat matrices, rank lists, programme names, quotas and counselling rounds can change between releases and years.</p>
        <h3>Data quality</h3>
        <p>DEETNUTS applies validation, lineage and checksum controls, but source publications and processing can still contain omissions, formatting irregularities or errors. A page marked “available through Round N” is partial. Missing rounds remain missing; they are not estimated. Where the Service conflicts with an applicable official notice or portal, use the official information.</p>
        <h3>Candidate-specific tools</h3>
        <p>Fit, predictor and filtering tools compare the values you submit with historical records under stated assumptions. They are not probabilistic guarantees unless expressly labelled as such, and they do not account for every rule, document, tie-break, preference order or change in counselling procedure. You remain responsible for checking current eligibility rules and submitting applications correctly and on time.</p>
      </section>

      <section id="accounts">
        <h2>5. Accounts and authentication</h2>
        <p>Some features may require an account authenticated with Google or an existing email and password. Account records are maintained in the self-hosted DEETNUTS PocketBase service. You must provide accurate account information, keep access to your Google account and password secure, and promptly notify <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a> if you suspect unauthorised access. Do not share an authenticated session or use another person’s account without authority.</p>
        <p>You may stop using an account at any time and request deletion through the privacy contact. Signing out ends the local authenticated session addressed by that action; it may not erase the account or records that must be retained for security, dispute handling or legal compliance. Account processing is described in the Privacy Policy.</p>
      </section>

      <section id="acceptable-use">
        <h2>6. Acceptable use</h2>
        <p>You may browse, link to and make ordinary use of public pages. Respectful automated retrieval of public HTML is permitted when it follows robots.txt and the Automated Access Policy. In using the Service, you must not:</p>
        <ul>
          <li>break any applicable law, court order, contractual restriction or third-party privacy obligation;</li>
          <li>bypass authentication, access controls, rate limits, robots instructions, security measures or technical restrictions;</li>
          <li>probe, scan or test vulnerabilities without prior written authorisation, or introduce malware, destructive code or abusive traffic;</li>
          <li>interfere with availability, overload infrastructure, repeatedly request unchanged resources, or ignore a 429 response or <code>Retry-After</code> instruction;</li>
          <li>collect personal information from users, attempt to identify anonymous visitors, or expose another person’s credentials or confidential information without authority;</li>
          <li>misrepresent DEETNUTS output as an official result, fabricate an affiliation, remove material context, or use the Service to deceive applicants;</li>
          <li>use an automated output as the sole basis for a decision that materially affects a person; or</li>
          <li>assist another person in doing any of the above.</li>
        </ul>
        <p>We may use proportionate technical measures to protect the Service and may restrict abusive clients. If a legitimate crawler is blocked, use the contact in the Automated Access Policy.</p>
      </section>

      <section id="submissions">
        <h2>7. Information you submit</h2>
        <p>You retain responsibility for names, avatars, messages, correction evidence and other material you choose to submit. You confirm that you may submit it and that it is accurate, lawful, non-malicious and does not expose another person’s confidential or personal information without authority.</p>
        <p>You permit DEETNUTS and its service providers to host, copy, transmit, resize and otherwise process submitted material only as reasonably necessary to operate, secure and support the requested feature. This permission ends when the material is deleted from active systems, subject to reasonable backup, security and legal-retention periods.</p>
      </section>

      <section id="contributions">
        <h2>8. Voluntary contributions</h2>
        <p>A contribution is voluntary support for the project. It does not purchase admission assistance, preferential treatment, guaranteed uptime, a seat, a prediction or access to otherwise public cutoff facts. Checkout is provided on an external payment page. Do not send card or bank details to DEETNUTS by email or through cutoff fields.</p>
        <p>The checkout provider’s displayed terms, privacy notice, price, currency, tax treatment and transaction process apply on its page. For a billing error, include the transaction reference—but never a full card number or security code—in a message to the checkout provider and <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a>.</p>
      </section>

      <section id="external-services">
        <h2>9. External services and links</h2>
        <p>The Service may link to official portals, GitHub, Discord, X, Google, a payment checkout, or other third-party sites, and may display hosted images or privacy-enhanced YouTube embeds. Those services operate independently and may apply their own terms and privacy practices. A link is provided for convenience or attribution and is not a warranty of the third party’s availability, accuracy or security.</p>
        <p>Use official portals directly for application submission, fees, deadlines, document upload, choice filling and counselling results. DEETNUTS does not ask for or receive your official admission-portal password.</p>
      </section>

      <section id="availability">
        <h2>10. Changes, corrections and availability</h2>
        <p>We may correct, update, add, remove, suspend or discontinue data, routes or features when reasonably necessary for accuracy, security, legal compliance, source changes or operation of the Service. We may preserve redirects for changed public routes but do not promise that every historical URL or feature will remain available.</p>
        <p>Maintenance, network events, provider failures and security incidents may interrupt access. No service-level commitment applies unless DEETNUTS expressly signs a separate written agreement that identifies one.</p>
      </section>

      <section id="disclaimers">
        <h2>11. Disclaimers</h2>
        <p>To the fullest extent permitted by applicable law, the Service is provided on an “as available” and “as presented” basis. DEETNUTS does not make an express or implied promise that the Service will be uninterrupted, complete, current for your particular counselling event, free from every error, or suitable as the sole basis for an admission, financial or career decision.</p>
        <p>Nothing in these terms excludes a warranty, remedy or responsibility that applicable law does not permit to be excluded. Statements on the Service do not create a fiduciary, advisory, agency, partnership, employment or professional-client relationship.</p>
      </section>

      <section id="liability">
        <h2>12. Limitation of liability</h2>
        <p>To the fullest extent permitted by applicable law, DEETNUTS and its maintainers will not be liable for indirect, incidental, special, exemplary or consequential loss; loss of opportunity, data, goodwill or expected admission outcome; or loss caused by reliance on stale, incomplete or incorrectly entered information.</p>
        <p>This limitation does not apply to liability that cannot lawfully be limited, including where applicable liability for fraud, wilful misconduct, or personal injury caused by negligence. Any limitation is to be read down only to the minimum extent necessary to make it enforceable.</p>
      </section>

      <section id="indemnity">
        <h2>13. Responsibility for misuse</h2>
        <p>To the extent permitted by law, if your unlawful misuse of the Service, malicious submission, security attack or material breach of these terms causes a third-party claim against DEETNUTS, you are responsible for the resulting reasonable, documented losses and defence costs. This provision does not apply to losses caused by DEETNUTS or to the extent prohibited by consumer law.</p>
      </section>

      <section id="enforcement">
        <h2>14. Suspension and termination</h2>
        <p>We may suspend or terminate access when reasonably necessary to stop abuse, secure an account, comply with law, investigate a material breach or protect users and infrastructure. Where appropriate and lawful, we may give notice and an opportunity to correct the issue. Provisions that by their nature should continue—such as disclaimers, limitations, dispute terms and obligations arising before termination—survive.</p>
      </section>

      <section id="law">
        <h2>15. Governing law and disputes</h2>
        <p>These terms are governed by the laws of India, without overriding any mandatory protection that applies to you. Before filing a non-urgent claim, please send a clear description and requested resolution to <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a> and allow a reasonable opportunity to respond. Nothing prevents either party from seeking urgent protective relief or using a regulator, consumer forum or other process available under applicable law.</p>
        <p>Subject to any mandatory consumer forum or statutory venue, disputes will be brought before a court of competent jurisdiction in India. You and DEETNUTS remain free to resolve a dispute by mutual written agreement.</p>
      </section>

      <section id="general">
        <h2>16. General provisions</h2>
        <ul>
          <li><strong>Severability.</strong> If a provision is unenforceable, it will be limited or removed only to the necessary extent; the remainder continues.</li>
          <li><strong>No waiver.</strong> A delay in enforcing a provision is not a waiver.</li>
          <li><strong>Assignment.</strong> You may not transfer your account or this agreement without consent. DEETNUTS may transfer the Service together with these obligations as part of a genuine reorganisation or transfer of operation, subject to applicable law.</li>
          <li><strong>Entire agreement.</strong> These terms and the incorporated policies are the agreement about the Service, except for a separately signed agreement.</li>
          <li><strong>Headings.</strong> Headings aid navigation and do not narrow the text.</li>
        </ul>
      </section>

      <section id="changes-contact">
        <h2>17. Changes and contact</h2>
        <p>Material changes will be posted with a new effective date and, where required, an additional notice or renewed consent. Changes do not retroactively reduce obligations already accrued. Continued use after the stated effective date constitutes acceptance only where that method is lawful and adequate for the change.</p>
        <p>Questions, security notices, correction requests and legal communications may be sent to <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a>. Include the relevant URL and enough detail to investigate, but do not send passwords, full payment-card numbers, government identity documents or admission-portal credentials.</p>
      </section>
    </PolicyPage>
  );
}
