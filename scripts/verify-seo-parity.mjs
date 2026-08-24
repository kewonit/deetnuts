import { extractLocations } from "./seo-xml.mjs";

const canonicalOrigin = "https://www.deetnuts.com";

function readOrigin(name, fallback) {
  const raw = process.env[name]?.trim() || fallback;
  if (!raw) throw new Error(`${name} is required`);

  const url = new URL(raw);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      `${name} must be an HTTP(S) origin without credentials or a path`,
    );
  }
  return url.origin;
}

function readSampleSize() {
  const value = Number(process.env.SEO_SAMPLE_SIZE || 50);
  if (!Number.isInteger(value) || value < 10 || value > 200) {
    throw new Error("SEO_SAMPLE_SIZE must be an integer between 10 and 200");
  }
  return value;
}

const baselineOrigin = readOrigin(
  "BASELINE_ORIGIN",
  "https://www.deetnuts.com",
);
const candidateOrigin = readOrigin("CANDIDATE_ORIGIN");
const sampleSize = readSampleSize();

async function request(origin, path, init = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${origin}${path}`, {
        ...init,
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      });
      if (response.status >= 500 && attempt < 3) {
        await response.body?.cancel();
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }
  throw lastError;
}

function toPath(location) {
  const url = new URL(location);
  return `${url.pathname}${url.search}`;
}

async function requireXml(origin, path) {
  const response = await request(origin, path, {
    headers: { accept: "application/xml,text/xml;q=0.9" },
  });
  if (response.status !== 200) {
    throw new Error(`${origin}${path} returned ${response.status}`);
  }
  return response.text();
}

async function crawlSitemaps(origin) {
  const indexXml = await requireXml(origin, "/sitemap-index.xml");
  const sitemapPaths = extractLocations(indexXml).map(toPath);
  if (
    !sitemapPaths.length ||
    new Set(sitemapPaths).size !== sitemapPaths.length
  ) {
    throw new Error(`${origin} has an empty or duplicate sitemap index`);
  }

  const routes = new Set();
  for (const sitemapPath of sitemapPaths) {
    const xml = await requireXml(origin, sitemapPath);
    for (const location of extractLocations(xml)) {
      const path = toPath(location);
      if (routes.has(path)) {
        throw new Error(`${origin} publishes duplicate sitemap URL ${path}`);
      }
      routes.add(path);
    }
  }

  return { routes, sitemapPaths: new Set(sitemapPaths) };
}

function difference(left, right) {
  return [...left].filter((value) => !right.has(value)).sort();
}

function requireEqualSets(label, baseline, candidate) {
  const missing = difference(baseline, candidate);
  const unexpected = difference(candidate, baseline);
  if (missing.length || unexpected.length) {
    throw new Error(
      `${label} differ: missing=${JSON.stringify(missing.slice(0, 20))} ` +
        `unexpected=${JSON.stringify(unexpected.slice(0, 20))}`,
    );
  }
}

function selectSamples(routes, count) {
  const sorted = [...routes].sort();
  const selected = new Set(["/"]);
  if (sorted.length <= count) return sorted;

  for (let index = 0; index < count; index += 1) {
    selected.add(
      sorted[Math.floor((index * (sorted.length - 1)) / (count - 1))],
    );
  }
  return [...selected].sort();
}

function readCanonical(html) {
  return html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
  )?.[1];
}

async function verifyRoute(path) {
  const [baseline, candidate] = await Promise.all([
    request(baselineOrigin, path, { headers: { accept: "text/html" } }),
    request(candidateOrigin, path, { headers: { accept: "text/html" } }),
  ]);
  if (baseline.status !== 200 || candidate.status !== baseline.status) {
    throw new Error(
      `${path} status differs: baseline=${baseline.status} candidate=${candidate.status}`,
    );
  }

  await baseline.body?.cancel();
  const candidateHtml = await candidate.text();
  const canonical = readCanonical(candidateHtml);
  const expectedCanonical = `${canonicalOrigin}${path === "/" ? "" : path}`;
  if (canonical !== expectedCanonical) {
    throw new Error(
      `${path} canonical is ${JSON.stringify(canonical)}; expected ${expectedCanonical}`,
    );
  }
}

const [baseline, candidate] = await Promise.all([
  crawlSitemaps(baselineOrigin),
  crawlSitemaps(candidateOrigin),
]);
requireEqualSets(
  "Sitemap-index paths",
  baseline.sitemapPaths,
  candidate.sitemapPaths,
);
requireEqualSets("Indexed URL paths", baseline.routes, candidate.routes);

const samples = selectSamples(baseline.routes, sampleSize);
for (let offset = 0; offset < samples.length; offset += 5) {
  await Promise.all(samples.slice(offset, offset + 5).map(verifyRoute));
}

console.log(
  JSON.stringify(
    {
      baselineOrigin,
      candidateOrigin,
      indexedPaths: baseline.routes.size,
      sampledPages: samples.length,
      sitemapFiles: baseline.sitemapPaths.size,
      status: "passed",
    },
    null,
    2,
  ),
);
