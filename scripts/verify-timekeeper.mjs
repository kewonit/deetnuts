import manifest from "../docs/timekeeper-migration/manifest.json" with { type: "json" };
import metadata from "../lib/timekeeper/exam-metadata.json" with { type: "json" };
import { pathToFileURL } from "node:url";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

// fetch may replace a custom Host header. Internal deployment checks need the
// real HTTP Host that Nginx sends, so use Node's HTTP client for this one case.
function requestWithHost(url, init) {
  return new Promise((resolve, reject) => {
    const send = url.protocol === "https:" ? httpsRequest : httpRequest;
    const request = send(
      url,
      {
        headers: init.headers,
        signal: init.signal,
        ...(url.protocol === "https:" ? { servername: url.hostname } : {}),
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("error", reject);
        response.on("end", () => {
          const headers = new Headers();
          for (const [name, value] of Object.entries(response.headers)) {
            for (const item of Array.isArray(value)
              ? value
              : value === undefined
                ? []
                : [value])
              headers.append(name, item);
          }
          resolve(
            new Response(Buffer.concat(chunks), {
              status: response.statusCode,
              headers,
            }),
          );
        });
      },
    );
    request.on("error", reject);
    request.end();
  });
}

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
const requireThat = (condition, message) => {
  if (!condition) throw new Error(message);
};

export async function verifyTimekeeper({
  origin = manifest.newOrigin,
  expectedSha,
  production = true,
  host,
  checkAssets = true,
  fetchRequest = fetch,
} = {}) {
  const base = new URL(origin);
  requireThat(
    ["http:", "https:"].includes(base.protocol) &&
      base.pathname === "/" &&
      !base.username &&
      !base.password &&
      !base.search &&
      !base.hash,
    "Use an origin without a path or credentials",
  );
  const request = (path) =>
    (host && fetchRequest === fetch ? requestWithHost : fetchRequest)(
      new URL(path, base),
      {
        redirect: "manual",
        headers: {
          ...(host ? { Host: host } : {}),
          accept: "text/html,application/json,application/xml",
        },
        signal: AbortSignal.timeout(20_000),
      },
    );
  const assets = new Set([
    "/exam-countdown/favicon.svg",
    "/exam-countdown/icon-192.png",
    "/exam-countdown/icon-512.png",
    "/exam-countdown/fonts/inter.woff2",
    "/exam-countdown/fonts/playfair-italic.woff2",
    "/exam-countdown/manifest.webmanifest",
    "/exam-countdown/sw.js",
  ]);
  const paths = Object.values(manifest.redirects);
  for (const path of paths) {
    const response = await request(path);
    requireThat(
      response.status === 200,
      `${path}: expected 200, got ${response.status}`,
    );
    const html = await response.text();
    requireThat(
      html.includes(`rel="canonical" href="${manifest.newOrigin}${path}"`),
      `${path}: incorrect canonical`,
    );
    requireThat(
      /<title>[^<]+<\/title>/.test(html) &&
        /<meta name="description" content="[^"]+"/.test(html) &&
        /<h1\b/.test(html),
      `${path}: missing static metadata or heading`,
    );
    const blocked =
      /<meta name="robots" content="[^"]*noindex/.test(html) ||
      /noindex/i.test(response.headers.get("x-robots-tag") ?? "");
    requireThat(
      production ? !blocked : blocked,
      `${path}: incorrect indexing policy for ${production ? "production" : "preview"}`,
    );
    if (production)
      requireThat(
        !/no-store|private/i.test(response.headers.get("cache-control") ?? ""),
        `${path}: public page is not cacheable`,
      );
    const csp = response.headers.get("content-security-policy") ?? "";
    const cspSources = csp.split(/[\s;]+/);
    requireThat(
      csp.split("default-src").length === 2 &&
        cspSources.includes("https://api.dicebear.com") &&
        cspSources.includes("https://ivmobluuegkikmbwbfhe.supabase.co") &&
        (!production || !csp.includes("'unsafe-eval'")),
      `${path}: incorrect feature CSP`,
    );
    const exam = Object.values(metadata.metadata).find(
      (exam) => exam.slug === path.split("/exams/")[1],
    );
    if (exam)
      requireThat(
        html.includes(escapeHtml(exam.name)) &&
          html.includes(escapeHtml(exam.fullName)) &&
          html.includes("Latest published schedule"),
        `${path}: missing original exam content`,
      );
    for (const match of html.matchAll(/(?:src|href)="([^"?#]+)[^"]*"/g))
      if (
        /^\/_next\/static\/|^\/exam-countdown\/.*\.(?:css|js|woff2|svg|png)$/.test(
          match[1],
        )
      )
        assets.add(match[1]);
    let pageSchemaFound = false;
    for (const match of html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    )) {
      const data = JSON.parse(match[1]);
      if (data["@type"] === "WebPage") {
        requireThat(
          data.url === `${manifest.newOrigin}${path}`,
          `${path}: structured data URL is incorrect`,
        );
        pageSchemaFound = true;
      }
    }
    requireThat(pageSchemaFound, `${path}: page structured data is missing`);
  }
  const sitemap = await request("/exam-countdown/sitemap.xml");
  requireThat(sitemap.status === 200, "Feature sitemap is unavailable");
  const locations = Array.from(
    (await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g),
    (match) => match[1],
  );
  requireThat(
    locations.length === paths.length &&
      paths.every((path) => locations.includes(`${manifest.newOrigin}${path}`)),
    "Feature sitemap does not match the route manifest",
  );
  const index = await request("/sitemap-index.xml");
  requireThat(
    index.status === 200 &&
      (await index.text()).includes(
        `${manifest.newOrigin}/exam-countdown/sitemap.xml`,
      ),
    "Feature sitemap is absent from the sitemap index",
  );
  for (const path of [
    "/exam-countdown/exams/missing-exam",
    "/exam-countdown/category/missing-category",
  ])
    requireThat(
      (await request(path)).status === 404,
      `${path}: missing page must return 404`,
    );
  const config = await request("/api/exam-countdown/config");
  requireThat(
    config.status === 200 &&
      /no-store/.test(config.headers.get("cache-control") ?? ""),
    "Study-map runtime configuration is unavailable or cacheable",
  );
  const publicConfig = await config.json();
  requireThat(
    Object.keys(publicConfig).sort().join(",") === "anonKey,url" &&
      publicConfig.url === "https://ivmobluuegkikmbwbfhe.supabase.co" &&
      typeof publicConfig.anonKey === "string",
    "Unexpected public study-map configuration",
  );
  if (!publicConfig.anonKey.startsWith("sb_publishable_")) {
    let role;
    try {
      role = JSON.parse(
        Buffer.from(publicConfig.anonKey.split(".")[1], "base64url").toString(),
      ).role;
    } catch {
      /* Invalid public configuration fails below. */
    }
    requireThat(role === "anon", "Study-map key is not public");
  }
  if (checkAssets)
    for (const path of assets) {
      const response = await request(path);
      requireThat(
        response.status === 200 &&
          !(response.headers.get("content-type") ?? "").includes("text/html"),
        `${path}: broken asset`,
      );
      if (path === "/exam-countdown/sw.js")
        requireThat(
          response.headers.get("service-worker-allowed") ===
            "/exam-countdown" &&
            /no-cache/.test(response.headers.get("cache-control") ?? ""),
          "Feature service worker has an incorrect scope or update policy",
        );
      const body = await response.arrayBuffer();
      requireThat(body.byteLength > 0, `${path}: empty asset`);
    }
  if (expectedSha) {
    requireThat(
      /^[0-9a-f]{40}$/.test(expectedSha),
      "Expected release must be a full Git SHA",
    );
    const health = await request("/api/health");
    requireThat(
      health.status === 200 && (await health.json()).sha === expectedSha,
      "Candidate release mismatch",
    );
  }
  return {
    passed: true,
    checkedAt: new Date().toISOString(),
    origin: base.origin,
    releaseSha: expectedSha ?? null,
    production,
    pages: paths.length,
    assets: checkAssets ? assets.size : 0,
  };
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  const report = await verifyTimekeeper({
    origin: process.env.TIMEKEEPER_VERIFY_ORIGIN,
    expectedSha: process.env.EXPECTED_DEPLOYMENT_SHA,
    production: process.env.TIMEKEEPER_VERIFY_PREVIEW !== "true",
    host: process.env.TIMEKEEPER_VERIFY_HOST,
  });
  console.log(JSON.stringify(report));
}
