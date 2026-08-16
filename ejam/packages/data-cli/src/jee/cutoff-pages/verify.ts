#!/usr/bin/env tsx

import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { readParquetRows } from "@ejam/data/college-predictor";
import { DATA_DIR } from "../../repo-root.js";

type Catalog = {
  schemaVersion: number;
  releaseVersion: string;
  seoRoutesArtifactPath: string;
  seoRoutesArtifactSha256: string;
  sourceRegistryPath: string;
  sourceRegistrySha256: string;
  totals: {
    rows: number;
    colleges: number;
    pages: number;
    jeeMainPages: number;
    jeeAdvancedPages: number;
    programs: number;
    profiles: number;
    multiRoundProfiles: number;
    oneRoundProfiles: number;
    canonicalRoutes: number;
    indexableRoutes: number;
    sources: number;
  };
  colleges: Array<{
    id: string;
    examId: string;
    artifactPath: string;
    artifactSha256: string;
    rowCount: number;
    pages: Array<{ year: number; rowCount: number }>;
  }>;
};

type ServingRow = {
  body: string;
  year: number;
  round: number;
  institute_id: string;
  source_program_id: string;
  source_program_name: string;
  degree: string;
  duration_years: number;
  quota: string;
  seat_type: string;
  gender: string;
  opening_rank: number;
  closing_rank: number;
  source_id: string;
  source_locator: string;
  exam_id: string;
};

type SeoRouteRow = {
  route_type: string;
  path: string;
  program_slug: string | null;
  row_count: number;
  round_count: number;
  indexable: boolean;
  index_reason: string;
  content_sha256: string;
  last_changed_at: string;
};

const VALID_BODIES = new Set(["josaa", "csab"]);
const VALID_EXAMS = new Set(["jee-main", "jee-advanced"]);
const VALID_QUOTAS = new Set([
  "AI", "AP", "DASA-CIWG", "DASA-Non CIWG", "GO", "HS", "JK", "LA", "OS",
]);
const VALID_SEAT_TYPES = new Set([
  "EWS", "EWS (PwD)", "OBC-NCL", "OBC-NCL (PwD)", "OPEN", "OPEN (PwD)", "SC", "SC (PwD)", "ST", "ST (PwD)",
]);
const VALID_GENDERS = new Set([
  "Female-only (including Supernumerary)", "Gender-Neutral", "NA",
]);

async function sha256File(filePath: string): Promise<string> {
  return createHash("sha256")
    .update(await fs.readFile(filePath))
    .digest("hex");
}

async function main(): Promise<void> {
  const catalogPath = path.join(
    DATA_DIR,
    "tools",
    "college-cutoffs",
    "catalog.json",
  );
  const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8")) as Catalog;
  const latest = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, "catalog", "latest.json"), "utf8"),
  ) as { version: string };
  if (catalog.releaseVersion !== latest.version) {
    throw new Error(
      `Cutoff catalog ${catalog.releaseVersion} does not match latest manifest ${latest.version}`,
    );
  }
  if (catalog.schemaVersion !== 2) {
    throw new Error(`Unsupported cutoff catalog schema ${catalog.schemaVersion}`);
  }

  const seoPath = path.join(DATA_DIR, catalog.seoRoutesArtifactPath);
  if ((await sha256File(seoPath)) !== catalog.seoRoutesArtifactSha256) {
    throw new Error("SEO route artifact checksum mismatch");
  }
  const sourceRegistryPath = path.join(DATA_DIR, catalog.sourceRegistryPath);
  if ((await sha256File(sourceRegistryPath)) !== catalog.sourceRegistrySha256) {
    throw new Error("Cutoff source registry checksum mismatch");
  }
  const seoRoutes = await readParquetRows<SeoRouteRow>(seoPath);
  const routePaths = new Set<string>();
  for (const route of seoRoutes) {
    if (
      !route.path.startsWith("/") ||
      route.path.includes("?") ||
      route.path.includes("#") ||
      routePaths.has(route.path) ||
      !route.content_sha256 ||
      !route.last_changed_at ||
      route.row_count < 0 ||
      route.round_count < 0
    ) {
      throw new Error(`Invalid SEO route ${route.path}`);
    }
    if (route.program_slug && route.program_slug.length > 96) {
      throw new Error(`Program slug exceeds 96 characters: ${route.program_slug}`);
    }
    if (route.route_type === "profile") {
      const expectedIndexable = route.round_count >= 2;
      if (
        route.indexable !== expectedIndexable ||
        route.index_reason !==
          (expectedIndexable ? "multi-round-profile" : "single-round-profile")
      ) {
        throw new Error(`Invalid profile quality gate: ${route.path}`);
      }
    }
    routePaths.add(route.path);
  }
  const programs = seoRoutes.filter((route) => route.route_type === "program").length;
  const profiles = seoRoutes.filter((route) => route.route_type === "profile");
  const multiRoundProfiles = profiles.filter((route) => route.indexable).length;
  const oneRoundProfiles = profiles.length - multiRoundProfiles;
  const indexableRoutes = seoRoutes.filter((route) => route.indexable).length;
  const sourceRegistry = JSON.parse(await fs.readFile(sourceRegistryPath, "utf8")) as {
    schemaVersion: number;
    sources: Array<{ sourceId: string; title: string; officialDomain: string }>;
  };
  if (
    programs !== catalog.totals.programs ||
    profiles.length !== catalog.totals.profiles ||
    multiRoundProfiles !== catalog.totals.multiRoundProfiles ||
    oneRoundProfiles !== catalog.totals.oneRoundProfiles ||
    seoRoutes.length !== catalog.totals.canonicalRoutes ||
    indexableRoutes !== catalog.totals.indexableRoutes ||
    sourceRegistry.schemaVersion !== 2 ||
    sourceRegistry.sources.length !== catalog.totals.sources ||
    sourceRegistry.sources.some(
      (source) => !source.sourceId || !source.title || !source.officialDomain,
    )
  ) {
    throw new Error("SEO route/source totals do not reconcile");
  }

  let rowsSeen = 0;
  let pagesSeen = 0;
  const identities = new Set<string>();
  for (const college of catalog.colleges) {
    const artifactPath = path.join(DATA_DIR, college.artifactPath);
    const hash = await sha256File(artifactPath);
    if (hash !== college.artifactSha256) {
      throw new Error(`Checksum mismatch: ${college.artifactPath}`);
    }
    const rows = await readParquetRows<ServingRow>(artifactPath);
    if (rows.length !== college.rowCount) {
      throw new Error(
        `${college.id} row count mismatch: ${rows.length} !== ${college.rowCount}`,
      );
    }
    const pageRowCount = college.pages.reduce((total, page) => total + page.rowCount, 0);
    if (pageRowCount !== rows.length) {
      throw new Error(`${college.id} page row counts do not reconcile`);
    }
    for (const page of college.pages) {
      const actualPageRows = rows.filter((row) => Number(row.year) === page.year).length;
      if (actualPageRows !== page.rowCount) {
        throw new Error(`${college.id} ${page.year} row count mismatch`);
      }
    }
    for (const row of rows) {
      if (!row.source_program_name || !row.source_id || !row.source_locator) {
        throw new Error(`${college.id} contains unresolved display/source data`);
      }
      if (
        row.opening_rank <= 0 ||
        row.closing_rank <= 0 ||
        row.opening_rank > row.closing_rank
      ) {
        throw new Error(`${college.id} contains invalid rank data`);
      }
      if (
        row.institute_id !== college.id ||
        row.exam_id !== college.examId ||
        !VALID_BODIES.has(row.body) ||
        !VALID_EXAMS.has(row.exam_id) ||
        !VALID_QUOTAS.has(row.quota) ||
        !VALID_SEAT_TYPES.has(row.seat_type) ||
        !VALID_GENDERS.has(row.gender)
      ) {
        throw new Error(`${college.id} contains invalid serving taxonomy`);
      }
      const identity = [
        row.body,
        row.year,
        row.round,
        row.institute_id,
        row.source_program_id,
        row.degree,
        row.duration_years,
        row.quota,
        row.seat_type,
        row.gender,
      ].join("|");
      if (identities.has(identity)) {
        throw new Error(`Duplicate cutoff identity: ${identity}`);
      }
      identities.add(identity);
    }
    rowsSeen += rows.length;
    pagesSeen += college.pages.length;
  }

  if (
    rowsSeen !== catalog.totals.rows ||
    pagesSeen !== catalog.totals.pages ||
    catalog.colleges.length !== catalog.totals.colleges
  ) {
    throw new Error("Cutoff catalog totals do not reconcile");
  }
  if (
    catalog.releaseVersion === "v0.2.5" &&
    (rowsSeen !== 463_050 ||
      catalog.colleges.length !== 131 ||
      pagesSeen !== 1_096 ||
      catalog.totals.jeeMainPages !== 866 ||
      catalog.totals.jeeAdvancedPages !== 230 ||
      catalog.totals.programs !== 7_476 ||
      catalog.totals.profiles !== 105_115 ||
      catalog.totals.multiRoundProfiles !== 88_147 ||
      catalog.totals.oneRoundProfiles !== 16_968 ||
      catalog.totals.canonicalRoutes !== 113_821 ||
      catalog.totals.indexableRoutes !== 96_853 ||
      catalog.totals.sources !== 274)
  ) {
    throw new Error("v0.2.5 does not match the accepted JEE cutoff release totals");
  }
  console.log(
    `Verified ${rowsSeen} rows, ${catalog.colleges.length} colleges, ${pagesSeen} year pages, ${programs} programs, ${profiles.length} profiles`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
