import type { Metadata } from "next";
import { PolicyPage } from "@/components/compliance/PolicyPage";
import { COMPLIANCE } from "@/lib/compliance";

export const metadata: Metadata = {
  title: "Automated Access",
  description: "Rules and technical guidance for respectful automated retrieval of public DEETNUTS HTML.",
  alternates: { canonical: "/compliance/automated-access" },
};

export default function AutomatedAccess() {
  return (
    <PolicyPage title="Automated access" summary="Public cutoff HTML is open to everyone, including respectful scrapers. These rules keep discovery predictable and protect availability for students.">
      <section id="allowed"><h2>Public HTML</h2><p>Automated clients may retrieve public, robots-allowed HTML and sitemap files. Core cutoff facts are server-rendered; JavaScript execution is not required to read the default table, headings, source references or crawlable year and profile links.</p><ul><li>Begin with <a href="/robots.txt">robots.txt</a> and the published <a href="/sitemap-index.xml">sitemap index</a>.</li><li>Use canonical URLs and do not manufacture query-string or fragment combinations for discovery.</li><li>Identify sustained crawlers with a truthful user agent containing a working contact URL or email.</li><li>Cache responses and honour <code>ETag</code>, <code>Last-Modified</code>, <code>If-None-Match</code> and <code>If-Modified-Since</code> where supplied.</li><li>Keep concurrency modest, add jitter, back off exponentially on 429 or 5xx responses, and obey <code>Retry-After</code>.</li></ul></section>
      <section id="boundaries"><h2>Operational boundaries</h2><p>Do not bypass authentication, CAPTCHA, private routes, rate limits, robots instructions or another access control. Do not probe for vulnerabilities, enumerate account data, submit high-volume interactive-filter requests, or repeatedly fetch unchanged pages. Access that materially degrades the Service may be limited to protect users.</p><p>The interactive API supports the website and is not a guaranteed bulk mirror. Its validation, pagination, release requirements and cache behavior may change. Use the server-rendered canonical pages and sitemaps for durable public discovery.</p></section>
      <section id="representation"><h2>Machine-readable page conventions</h2><ul><li>Tables use captions, scoped headers and stable <code>data-field</code> labels.</li><li>Pages expose a release identifier and exact source identifiers.</li><li>Canonical tags identify the indexable path; filtered fragment state is intentionally not canonicalised as a separate page.</li><li>Missing rounds are gaps, not zeroes. Do not infer unpublished ranks.</li><li>Rank 1 is best; opening and closing ranks must remain associated with their exact body, year, round, quota, category, gender and offering.</li></ul></section>
      <section id="attribution"><h2>Accuracy and attribution</h2><p>If you republish a DEETNUTS-derived presentation, preserve the counselling body, year, round, seat pool, programme identity and source context so students are not misled. Do not present DEETNUTS as an official counselling authority. Verify time-sensitive admission actions on the relevant official portal.</p></section>
      <section id="contact"><h2>Crawl support</h2><p>For sustained research access, a mistaken block, a sitemap issue or a request pattern not covered here, contact <a href={`mailto:${COMPLIANCE.privacyEmail}`}>{COMPLIANCE.privacyEmail}</a> before increasing traffic. Include the crawler user agent, source IP range if stable, intended paths, expected request rate and contact person.</p></section>
    </PolicyPage>
  );
}
