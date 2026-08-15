/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/api/predict/[exam_id]": ["ejam/data/**/*"],
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
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "deetnuts.com",
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
  env: {
    EJAM_DATA_ROOT: process.env.EJAM_DATA_ROOT || "ejam/data",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
            value: "1; mode=block",
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
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://res.cloudinary.com https://external-preview.redd.it; font-src 'self'; connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
      // Static assets caching
      {
        source: "/:all*(svg|jpg|png|gif|ico|jpeg|webp|woff2|woff|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
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
