import manifest from "../docs/timekeeper-migration/manifest.json" with { type: "json" };
import {
  importHtml,
  importScript,
  compatibilityServiceWorker,
} from "./import-page.mjs";

const mapping = new Map(
  Object.entries({ ...manifest.redirects, ...manifest.aliases }),
);
const gone = new Set(manifest.gone);
const helperHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};

function documentResponse(body, contentType, method, extra = {}) {
  return new Response(method === "HEAD" ? null : body, {
    headers: { ...helperHeaders, "Content-Type": contentType, ...extra },
  });
}

function errorResponse(status, method) {
  return new Response(
    method === "HEAD"
      ? null
      : status === 410
        ? "This TimeKeeper example page has been retired."
        : "TimeKeeper page not found.",
    {
      status,
      headers: {
        ...helperHeaders,
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}

async function routeRequest(request, env = {}, fetchSource = fetch) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (!["GET", "HEAD"].includes(request.method))
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...helperHeaders, Allow: "GET, HEAD" },
    });
  if (path === "/migrate-to-deetnuts")
    return documentResponse(
      importHtml,
      "text/html; charset=utf-8",
      request.method,
      {
        "Content-Security-Policy":
          "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src https://www.deetnuts.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      },
    );
  if (path === "/timekeeper-migration.js")
    return documentResponse(
      importScript,
      "text/javascript; charset=utf-8",
      request.method,
    );

  const phase = env.ROLLOUT_PHASE ?? "serve";
  if (!["serve", "canary", "permanent", "retired"].includes(phase))
    return new Response("Migration configuration unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  const canary =
    phase === "canary" &&
    path === "/category/teaching" &&
    Date.parse(env.CANARY_UNTIL) > Date.now();
  const permanent = phase === "permanent" || phase === "retired";
  const destination = mapping.get(path);
  if (destination && (canary || permanent)) {
    // Location has no fragment: browsers inherit the old fragment according
    // to HTTP redirect semantics. Preserve the query string byte for byte.
    return new Response(null, {
      status: canary ? 307 : 301,
      headers: {
        Location: `${manifest.newOrigin}${destination}${url.search}`,
        "Cache-Control": canary ? "no-store, max-age=0" : "public, max-age=300",
        ...(canary ? { Pragma: "no-cache" } : {}),
      },
    });
  }
  if (permanent) {
    if (path === "/sw.js")
      return documentResponse(
        compatibilityServiceWorker,
        "text/javascript; charset=utf-8",
        request.method,
        { "Service-Worker-Allowed": "/" },
      );
    if (path === "/robots.txt")
      return new Response(
        request.method === "HEAD"
          ? null
          : `User-agent: *\nAllow: /\nDisallow: /migrate-to-deetnuts\nSitemap: ${manifest.oldOrigin}/sitemap.xml\n`,
        {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=300",
          },
        },
      );
    if (path === "/sitemap.xml") {
      const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(
        manifest.redirects,
      )
        .map((route) => `<url><loc>${manifest.oldOrigin}${route}</loc></url>`)
        .join("")}</urlset>`;
      return new Response(request.method === "HEAD" ? null : xml, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    }
    if (gone.has(path)) return errorResponse(410, request.method);
    // Retain the pinned deployment's assets for already-open old pages/PWA
    // clients. Unknown documents always get accurate errors after cutover.
    if (
      !path.startsWith("/_astro/") &&
      ![
        "/favicon.svg",
        "/favicon.ico",
        "/browserconfig.xml",
        "/manifest.json",
      ].includes(path)
    )
      return errorResponse(404, request.method);
  }
  // Always use the immutable deployment. Fetching the old public hostname
  // here would loop after this worker is attached to that hostname.
  const source = new URL(manifest.immutableSourceOrigin);
  source.pathname = url.pathname;
  source.search = url.search;
  const headers = new Headers(request.headers);
  headers.delete("cookie");
  headers.delete("authorization");
  headers.delete("host");
  return fetchSource(
    new Request(source, {
      method: request.method,
      headers,
      redirect: "manual",
    }),
  );
}

export async function handleRequest(request, env = {}, fetchSource = fetch) {
  const response = await routeRequest(request, env, fetchSource);
  if (
    ["timekeeper.edbn.me", "timekeeper-933.pages.dev"].includes(
      new URL(request.url).hostname,
    )
  )
    return response;
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow");
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
