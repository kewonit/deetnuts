"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const FileSystemCache =
  require("next/dist/server/lib/incremental-cache/file-system-cache").default;
const { nodeFs } = require("next/dist/server/lib/node-fs-methods");
const { CachedRouteKind } = require("next/dist/server/response-cache");
const DeetnutsNextCacheHandler = require("./next-cache-handler.cjs");

const DEPLOYMENT_SHA = "a".repeat(40);
const OLD_DEPLOYMENT_SHA = "b".repeat(40);

function createContext(serverDistDir) {
  return {
    dev: false,
    fs: nodeFs,
    flushToDisk: true,
    maxMemoryCacheSize: 0,
    revalidatedTags: [],
    serverDistDir,
  };
}

function appPage(html) {
  return {
    kind: CachedRouteKind.APP_PAGE,
    headers: {},
    html,
    postponed: undefined,
    rscData: Buffer.from(`${html}-rsc`),
    segmentData: undefined,
    status: 200,
  };
}

const setContext = {
  fetchCache: false,
  isFallback: false,
  isRoutePPREnabled: false,
};
const getContext = {
  isFallback: false,
  isRoutePPREnabled: false,
  kind: "APP_PAGE",
};

test("keeps the image seed immutable and persists runtime ISR by release", async () => {
  const temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "deetnuts-next-cache-"),
  );
  const originalDeploymentSha = process.env.DEPLOYMENT_SHA;
  const originalRuntimeCacheRoot = DeetnutsNextCacheHandler.runtimeCacheRoot;

  try {
    const seedServerDirectory = path.join(temporaryRoot, "seed", "server");
    const runtimeCacheRoot = path.join(temporaryRoot, "runtime");
    const oldRuntimeDirectory = path.join(runtimeCacheRoot, OLD_DEPLOYMENT_SHA);
    fs.mkdirSync(oldRuntimeDirectory, { recursive: true });
    fs.writeFileSync(path.join(oldRuntimeDirectory, "stale"), "stale");

    const context = createContext(seedServerDirectory);
    const seedCache = new FileSystemCache(context);
    await seedCache.set("/seed", appPage("seed-html"), setContext);

    process.env.DEPLOYMENT_SHA = DEPLOYMENT_SHA;
    DeetnutsNextCacheHandler.runtimeCacheRoot = runtimeCacheRoot;
    const handler = new DeetnutsNextCacheHandler(context);

    assert.equal(
      (await handler.get("/seed", getContext)).value.html,
      "seed-html",
    );
    assert.equal(fs.existsSync(oldRuntimeDirectory), false);

    await handler.set("/runtime", appPage("runtime-html"), setContext);
    assert.equal(
      fs.existsSync(path.join(seedServerDirectory, "app", "runtime.html")),
      false,
    );
    assert.equal(
      fs.readFileSync(
        path.join(
          runtimeCacheRoot,
          DEPLOYMENT_SHA,
          "server",
          "app",
          "runtime.html",
        ),
        "utf8",
      ),
      "runtime-html",
    );

    const restartedHandler = new DeetnutsNextCacheHandler(context);
    assert.equal(
      (await restartedHandler.get("/runtime", getContext)).value.html,
      "runtime-html",
    );
  } finally {
    if (originalDeploymentSha === undefined) {
      delete process.env.DEPLOYMENT_SHA;
    } else {
      process.env.DEPLOYMENT_SHA = originalDeploymentSha;
    }
    DeetnutsNextCacheHandler.runtimeCacheRoot = originalRuntimeCacheRoot;
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("rejects an invalid runtime deployment identifier", () => {
  const originalDeploymentSha = process.env.DEPLOYMENT_SHA;
  process.env.DEPLOYMENT_SHA = "not-a-release";

  try {
    assert.throws(
      () => new DeetnutsNextCacheHandler(createContext("/tmp/unused")),
      /full lowercase Git SHA/,
    );
  } finally {
    if (originalDeploymentSha === undefined) {
      delete process.env.DEPLOYMENT_SHA;
    } else {
      process.env.DEPLOYMENT_SHA = originalDeploymentSha;
    }
  }
});
