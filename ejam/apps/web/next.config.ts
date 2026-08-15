import path from "node:path";
import type { NextConfig } from "next";
import { Agentation as AgentationStub } from "./src/lib/agentation-stub";

void AgentationStub;

const monorepoRoot = path.join(import.meta.dirname, "../..");

const isProd = process.env.NODE_ENV === "production";

const staticAssetCache =
  "public, max-age=2592000, stale-while-revalidate=86400";

const nextConfig: NextConfig = {
  // Trace workspace packages + repo-root data/ into serverless bundles.
  outputFileTracingRoot: monorepoRoot,
  outputFileTracingIncludes: {
    "/api/predict/[exam_id]": ["data/**/*"],
  },
  images: {
    unoptimized: true,
  },
  compress: false,
  async headers() {
    return [
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: staticAssetCache }],
      },
      {
        source: "/exams/:path*",
        headers: [{ key: "Cache-Control", value: staticAssetCache }],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, must-revalidate",
          },
        ],
      },
      {
        source: "/identity/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, must-revalidate",
          },
        ],
      },
    ];
  },
  turbopack: {
    resolveAlias: isProd
      ? {
          agentation: "./src/lib/agentation-stub.ts",
        }
      : {},
  },
};

export default nextConfig;
