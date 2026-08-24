"use strict";

const fs = require("node:fs");
const path = require("node:path");
const FileSystemCache =
  require("next/dist/server/lib/incremental-cache/file-system-cache").default;

const RELEASE_PATTERN = /^[0-9a-f]{40}$/;
const DEFAULT_RUNTIME_CACHE_ROOT = "/app/.next/cache/prerender-releases";

let preparedRuntimeDirectory;

class DeetnutsNextCacheHandler {
  static runtimeCacheRoot = DEFAULT_RUNTIME_CACHE_ROOT;

  constructor(context) {
    const deploymentSha = process.env.DEPLOYMENT_SHA?.trim();

    // `next build` does not have a runtime deployment SHA. Preserve Next.js's
    // normal build-time filesystem behavior so generated seed pages remain in
    // the immutable image.
    if (!deploymentSha) {
      this.runtimeCache = new FileSystemCache(context);
      this.seedCache = null;
      return;
    }

    if (!RELEASE_PATTERN.test(deploymentSha)) {
      throw new Error("DEPLOYMENT_SHA must be a full lowercase Git SHA");
    }

    const runtimeCacheRoot = path.resolve(this.constructor.runtimeCacheRoot);
    const runtimeDirectory = path.join(runtimeCacheRoot, deploymentSha);
    const runtimeServerDirectory = path.join(runtimeDirectory, "server");

    if (preparedRuntimeDirectory !== runtimeDirectory) {
      fs.mkdirSync(runtimeCacheRoot, { recursive: true, mode: 0o700 });
      const rootStat = fs.lstatSync(runtimeCacheRoot);
      if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
        throw new Error(
          "The Next.js runtime cache root must be a real directory",
        );
      }

      for (const entry of fs.readdirSync(runtimeCacheRoot, {
        withFileTypes: true,
      })) {
        if (
          entry.isDirectory() &&
          RELEASE_PATTERN.test(entry.name) &&
          entry.name !== deploymentSha
        ) {
          fs.rmSync(path.join(runtimeCacheRoot, entry.name), {
            recursive: true,
            force: true,
          });
        }
      }

      fs.mkdirSync(runtimeServerDirectory, {
        recursive: true,
        mode: 0o700,
      });
      preparedRuntimeDirectory = runtimeDirectory;
    }

    // New ISR pages are written only below the existing /app/.next/cache
    // volume. Build-generated seed pages continue to be read from the
    // immutable image, keeping the rest of the container read-only.
    this.runtimeCache = new FileSystemCache({
      ...context,
      serverDistDir: runtimeServerDirectory,
    });
    this.seedCache = new FileSystemCache({
      ...context,
      flushToDisk: false,
    });
  }

  async get(key, context) {
    const runtimeEntry = await this.runtimeCache.get(key, context);
    if (runtimeEntry !== null && runtimeEntry !== undefined) {
      return runtimeEntry;
    }
    return this.seedCache?.get(key, context) ?? null;
  }

  async set(key, data, context) {
    return this.runtimeCache.set(key, data, context);
  }

  async revalidateTag(tags, durations) {
    return this.runtimeCache.revalidateTag(tags, durations);
  }

  resetRequestCache() {
    this.runtimeCache.resetRequestCache?.();
    this.seedCache?.resetRequestCache?.();
  }
}

module.exports = DeetnutsNextCacheHandler;
