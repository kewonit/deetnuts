// Checks that the pages carrying most search traffic are still indexable.
// Runs hourly from .github/workflows/seo-watch.yaml and fails loudly if a
// change to the proxy, Nginx or Cloudflare would hide them from search.
const origin = "https://www.deetnuts.com";
const pages = [
  "/exam-countdown",
  "/exam-countdown/exams/jee-main",
  "/exam-countdown/exams/icse-class-10",
  "/exam-countdown/exams/neet-pg",
  "/exam-countdown/exams/maharashtra-hsc",
  "/exam-countdown/exams/neet-ug",
];
// The exam-countdown sitemap lists every exam, category and tool page.
const MIN_SITEMAP_URLS = 101;
const headers = {
  "User-Agent": "deetnuts-seo-watch (+https://github.com/kewonit/deetnuts)",
};

const problems = [];
const blocked = (value) => /noindex|none/i.test(value ?? "");

async function get(path) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(`${origin}${path}`, {
        headers,
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 5_000));
    }
  }
}

for (const path of pages) {
  const response = await get(path);
  if (response.status !== 200) {
    problems.push(`${path}: status ${response.status}`);
    continue;
  }
  if (blocked(response.headers.get("x-robots-tag")))
    problems.push(
      `${path}: X-Robots-Tag ${response.headers.get("x-robots-tag")}`,
    );
  const head = (await response.text()).split("</head>")[0];
  if (!/<title>[^<]+<\/title>/.test(head))
    problems.push(`${path}: no <title> in <head>`);
  const robots = head.match(/<meta name="robots" content="([^"]*)"/)?.[1];
  if (blocked(robots)) problems.push(`${path}: robots meta ${robots}`);
  const canonical = head.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  if (canonical !== `${origin}${path}`)
    problems.push(`${path}: canonical ${canonical ?? "missing"}`);
}

const sitemap = await get("/exam-countdown/sitemap.xml");
const urls =
  sitemap.status === 200
    ? ((await sitemap.text()).match(/<loc>/g)?.length ?? 0)
    : 0;
if (urls < MIN_SITEMAP_URLS)
  problems.push(
    `exam-countdown sitemap: status ${sitemap.status}, ${urls} URLs`,
  );

const robotsTxt = await get("/robots.txt");
const rules = robotsTxt.status === 200 ? await robotsTxt.text() : "";
if (!rules.includes(`Sitemap: ${origin}/sitemap-index.xml`))
  problems.push(
    `robots.txt: status ${robotsTxt.status} or sitemap line missing`,
  );
if (/^Disallow:\s*\/(exam-countdown)?\s*$/im.test(rules))
  problems.push("robots.txt: disallows the exam countdowns");

if (problems.length) {
  console.error(`SEO watch found ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}
console.log(
  `SEO watch: ${pages.length} pages, ${urls} sitemap URLs and robots.txt look right.`,
);
