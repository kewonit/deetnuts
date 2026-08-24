const canonicalOrigin = "https://www.deetnuts.com";
const expectedSha = process.env.EXPECTED_DEPLOYMENT_SHA?.trim();

if (!expectedSha || !/^[0-9a-f]{40}$/.test(expectedSha)) {
  throw new Error("EXPECTED_DEPLOYMENT_SHA must be a full Git SHA");
}

async function request(url, init = {}) {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(20_000),
  });
}

async function requireRedirect(url) {
  const response = await request(url, { redirect: "manual" });
  const location = response.headers.get("location");
  const expected = `${canonicalOrigin}${new URL(url).pathname}${new URL(url).search}`;
  if (response.status !== 308 || location !== expected) {
    throw new Error(
      `${url} returned ${response.status} -> ${location}; expected 308 -> ${expected}`,
    );
  }
}

await Promise.all([
  requireRedirect("http://deetnuts.com/robots.txt?probe=1"),
  requireRedirect("https://deetnuts.com/robots.txt?probe=1"),
  requireRedirect("http://www.deetnuts.com/robots.txt?probe=1"),
]);

const health = await request(`${canonicalOrigin}/api/health`, {
  headers: { accept: "application/json" },
});
if (!health.ok) throw new Error(`Health returned ${health.status}`);
const healthBody = await health.json();
if (healthBody.status !== "ok" || healthBody.sha !== expectedSha) {
  throw new Error(`Unexpected health body: ${JSON.stringify(healthBody)}`);
}
if (!/no-store/i.test(health.headers.get("cache-control") || "")) {
  throw new Error("Health response is cacheable");
}

const home = await request(canonicalOrigin);
if (!home.ok) throw new Error(`Home returned ${home.status}`);
const homeHtml = await home.text();
if (!homeHtml.includes(`<link rel="canonical" href="${canonicalOrigin}"`)) {
  throw new Error("Home canonical is missing or incorrect");
}

const securityHeaders = {
  "content-security-policy": /object-src 'none'/,
  "strict-transport-security": /max-age=/,
  "x-content-type-options": /^nosniff$/,
  "x-frame-options": /^DENY$/,
  "x-xss-protection": /^0$/,
};
for (const [name, pattern] of Object.entries(securityHeaders)) {
  const value = home.headers.get(name) || "";
  if (!pattern.test(value)) throw new Error(`Invalid ${name}: ${value}`);
}
if (
  (home.headers.get("content-security-policy") || "").includes("'unsafe-eval'")
) {
  throw new Error("Production CSP still permits unsafe-eval");
}
if (home.headers.has("x-powered-by")) {
  throw new Error("Production response exposes X-Powered-By");
}

const robots = await request(`${canonicalOrigin}/robots.txt`);
const robotsText = await robots.text();
if (
  !robots.ok ||
  !robotsText.includes(`${canonicalOrigin}/sitemap-index.xml`)
) {
  throw new Error("robots.txt does not publish the canonical sitemap index");
}

const sitemap = await request(`${canonicalOrigin}/sitemap-index.xml`);
const sitemapText = await sitemap.text();
if (!sitemap.ok || !sitemapText.includes(`${canonicalOrigin}/sitemap.xml`)) {
  throw new Error("Sitemap index does not use the canonical origin");
}
if (/https:\/\/deetnuts\.com\//.test(sitemapText)) {
  throw new Error("Sitemap index still contains apex URLs");
}

console.log(`Production verification passed for ${expectedSha}`);
