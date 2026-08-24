import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === "production";
const deploymentId = process.env.NEXT_DEPLOYMENT_ID?.trim();
const selfHostedCacheHandler = fileURLToPath(
  new URL("./deploy/next-cache-handler.cjs", import.meta.url),
);

if (deploymentId && !/^[A-Za-z0-9._-]{7,64}$/.test(deploymentId)) {
  throw new Error("NEXT_DEPLOYMENT_ID must be a 7-64 character release identifier");
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://www.deetnuts.com https://deetnuts.com https://res.cloudinary.com https://external-preview.redd.it",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com",
  "frame-src https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig = {
  output: "standalone",
  cacheHandler: selfHostedCacheHandler,
  cacheMaxMemorySize: 0,

  ...(deploymentId
    ? {
        deploymentId,
        generateBuildId: async () => deploymentId,
      }
    : {}),

  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/api/predict/[exam_id]": [
      "ejam/data/catalog/**/*",
      "ejam/data/reference/**/*",
      "ejam/data/tools/college-predictor/**/*",
    ],
    "/api/jee-cutoffs/[exam]/[college]/[year]": [
      "ejam/data/catalog/**/*",
      "ejam/data/tools/college-cutoffs/**/*",
    ],
    "/api/jee-cutoffs/[exam]/[college]/trend": [
      "ejam/data/catalog/**/*",
      "ejam/data/tools/college-cutoffs/**/*",
    ],
    "/jee-main/colleges/**/*": [
      "ejam/data/catalog/**/*",
      "ejam/data/tools/college-cutoffs/**/*",
    ],
    "/jee-advanced/colleges/**/*": [
      "ejam/data/catalog/**/*",
      "ejam/data/tools/college-cutoffs/**/*",
    ],
    "/compliance/data-sources-and-licensing": [
      "ejam/data/catalog/**/*",
      "ejam/data/tools/college-cutoffs/**/*",
    ],
    "/sitemaps/**/*": [
      "ejam/data/catalog/**/*",
      "ejam/data/tools/college-cutoffs/**/*",
    ],
  },

  // React 19 & Next.js 16 Performance Features
  reactCompiler: true, // Enable React Compiler for automatic memoization

  // Keep Turbopack enabled while the legacy webpack font rule remains available.
  turbopack: {},

  // Production performance optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true, // Enable gzip compression

  images: {
    remotePatterns: [
      ...(!isProduction
        ? [
            {
              protocol: "http",
              hostname: "localhost",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "deetnuts.com",
      },
      {
        protocol: "https",
        hostname: "www.deetnuts.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "external-preview.redd.it",
      },
    ],
    // Production image optimization
    minimumCacheTTL: 60,
    formats: ["image/avif", "image/webp"],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.woff2$/,
      type: "asset/resource",
    });
    return config;
  },
  async headers() {
    return [
      // Security headers for all routes
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "0",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
      // Public filenames are not guaranteed to be content-hashed.
      {
        source: "/:all*(svg|jpg|png|gif|ico|jpeg|webp|woff2|woff|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // API routes default to no-store. Versioned JEE cutoff routes set their
      // own success/error policy so 400/404/409 responses are never immutable.
      {
        source: "/api/:path((?!jee-cutoffs(?:/|$)).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
