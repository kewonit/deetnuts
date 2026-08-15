import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";
import { readParquetRows } from "@ejam/data/college-predictor";

type CounsellingBody = "josaa" | "csab";
type JeeExamId = "jee-main" | "jee-advanced";

type ServingRow = {
  body: CounsellingBody;
  year: number;
  round: number;
  institute_id: string;
  source_program_id: string;
  source_program_name: string;
  canonical_program_id: string | null;
  offering_id: string;
  quota: string;
  seat_type: string;
  gender: string;
  opening_rank: number;
  closing_rank: number;
  exam_id: JeeExamId;
  institute_type: string;
  degree: string;
  duration_years: number;
  source: string;
  source_id: string;
  source_locator: string;
};

export type SeoCollege = {
  id: string;
  name: string;
  seoName: string;
  examId: JeeExamId;
  artifactPath: string;
  artifactSha256: string;
  pages: Array<{
    year: number;
    contentSha256: string;
    lastChangedAt: string;
  }>;
};

export type SeoRouteRow = {
  route_type: "entry" | "directory" | "hub" | "year" | "program" | "profile";
  path: string;
  exam_id: JeeExamId | null;
  college_id: string | null;
  year: number | null;
  program_slug: string | null;
  offering_id: string | null;
  body: CounsellingBody | null;
  quota: string | null;
  seat_type: string | null;
  gender: string | null;
  rounds_json: string;
  row_count: number;
  round_count: number;
  indexable: boolean;
  index_reason: string;
  content_sha256: string;
  last_changed_at: string;
  source_ids_json: string;
  rights_status: "unconfirmed";
};

type SourceRegistryEntry = {
  sourceId: string;
  body: CounsellingBody;
  publisher: "Joint Seat Allocation Authority" | "Central Seat Allocation Board";
  title: string;
  year: number;
  round: number;
  instituteType: string;
  officialDomain: string;
  sourceLocator: string;
  rightsStatus: "unconfirmed";
  retrievalEvidence: null;
};

const QUOTA_SLUGS: Record<string, string> = {
  AI: "all-india",
  AP: "andhra-pradesh",
  "DASA-CIWG": "dasa-ciwg",
  "DASA-Non CIWG": "dasa-non-ciwg",
  GO: "goa",
  HS: "home-state",
  JK: "jammu-kashmir",
  LA: "ladakh",
  OS: "other-state",
};

const SEAT_TYPE_SLUGS: Record<string, string> = {
  EWS: "ews",
  "EWS (PwD)": "ews-pwd",
  "OBC-NCL": "obc-ncl",
  "OBC-NCL (PwD)": "obc-ncl-pwd",
  OPEN: "open",
  "OPEN (PwD)": "open-pwd",
  SC: "sc",
  "SC (PwD)": "sc-pwd",
  ST: "st",
  "ST (PwD)": "st-pwd",
};

const GENDER_SLUGS: Record<string, string> = {
  "Gender-Neutral": "gender-neutral",
  "Female-only (including Supernumerary)": "female-only",
  NA: "source-not-specified",
};

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function sha256File(filePath: string): Promise<string> {
  return createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
}

function slugPart(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function programSlug(row: ServingRow): string {
  const full = slugPart(
    `${row.source_program_name}-${row.degree}-${row.duration_years}-year-${row.source_program_id}`,
  );
  if (full.length <= 96) return full;
  const suffix = createHash("sha256").update(row.offering_id).digest("hex").slice(0, 8);
  const prefix = full.slice(0, 87).replace(/-+$/g, "");
  return `${prefix}-${suffix}`;
}

function uniqueSorted<T extends string | number>(values: T[]): T[] {
  return [...new Set(values)].sort((left, right) =>
    typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left).localeCompare(String(right)),
  );
}

function rowHash(rows: ServingRow[]): string {
  return sha256(
    [...rows]
      .sort(
        (left, right) =>
          left.body.localeCompare(right.body) ||
          left.round - right.round ||
          left.quota.localeCompare(right.quota) ||
          left.seat_type.localeCompare(right.seat_type) ||
          left.gender.localeCompare(right.gender),
      )
      .map((row) => [
        row.body,
        row.year,
        row.round,
        row.institute_id,
        row.source_program_id,
        row.source_program_name,
        row.degree,
        row.duration_years,
        row.quota,
        row.seat_type,
        row.gender,
        row.opening_rank,
        row.closing_rank,
        row.source_id,
      ]),
  );
}

function groupBy<T>(values: T[], key: (value: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const value of values) {
    const groupKey = key(value);
    const group = groups.get(groupKey);
    if (group) group.push(value);
    else groups.set(groupKey, [value]);
  }
  return groups;
}

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function sourceEntry(row: ServingRow): SourceRegistryEntry {
  const locator = new URL(row.source_locator);
  const year = Number(locator.hash.match(/(?:^|&)year=(\d{4})/)?.[1] ?? row.year);
  const round = Number(locator.hash.match(/(?:^|&)round=(\d+)/)?.[1] ?? row.round);
  const instituteType = decodeURIComponent(
    locator.hash.match(/(?:^|&)instype=([^&]+)/)?.[1] ?? row.institute_type,
  );
  const publisher = row.body === "josaa"
    ? "Joint Seat Allocation Authority"
    : "Central Seat Allocation Board";
  return {
    sourceId: row.source_id,
    body: row.body,
    publisher,
    title: `${row.body === "josaa" ? "JoSAA" : "CSAB"} ${year} opening and closing ranks, Round ${round}, ${instituteType}`,
    year,
    round,
    instituteType,
    officialDomain: locator.hostname,
    sourceLocator: row.source_locator,
    rightsStatus: "unconfirmed",
    retrievalEvidence: null,
  };
}

export async function buildSeoArtifacts(args: {
  dataDir: string;
  outputDir: string;
  generatedAt: string;
  colleges: SeoCollege[];
}): Promise<{
  seoRoutesArtifactPath: string;
  seoRoutesArtifactSha256: string;
  sourceRegistryPath: string;
  sourceRegistrySha256: string;
  totals: {
    programs: number;
    profiles: number;
    multiRoundProfiles: number;
    oneRoundProfiles: number;
    canonicalRoutes: number;
    indexableRoutes: number;
    sources: number;
  };
}> {
  const seoPath = path.join(args.outputDir, "seo-routes.parquet");
  const sourcePath = path.join(args.outputDir, "cutoff-sources.json");
  const temporaryJsonlPath = path.join(args.outputDir, ".seo-routes.jsonl");
  const previousRoutes = await readParquetRows<SeoRouteRow>(seoPath).catch(() => []);
  const previousByPath = new Map(previousRoutes.map((route) => [route.path, route]));
  const routes: SeoRouteRow[] = [];
  const routePaths = new Set<string>();
  const sources = new Map<string, SourceRegistryEntry>();

  const addRoute = (
    route: Omit<SeoRouteRow, "last_changed_at" | "rights_status"> & {
      fallbackLastChangedAt?: string;
    },
  ) => {
    if (routePaths.has(route.path)) throw new Error(`Duplicate SEO route: ${route.path}`);
    routePaths.add(route.path);
    const previous = previousByPath.get(route.path);
    const fallbackLastChangedAt = route.fallbackLastChangedAt ?? args.generatedAt;
    const { fallbackLastChangedAt: _ignored, ...persisted } = route;
    routes.push({
      ...persisted,
      last_changed_at:
        previous?.content_sha256 === route.content_sha256
          ? previous.last_changed_at
          : fallbackLastChangedAt,
      rights_status: "unconfirmed",
    });
  };

  for (const college of args.colleges) {
    const rows = (await readParquetRows<ServingRow>(
      path.join(args.dataDir, college.artifactPath),
    )).map((row) => ({
      ...row,
      year: Number(row.year),
      round: Number(row.round),
      duration_years: Number(row.duration_years),
      opening_rank: Number(row.opening_rank),
      closing_rank: Number(row.closing_rank),
    }));
    for (const row of rows) {
      const entry = sourceEntry(row);
      const existing = sources.get(entry.sourceId);
      if (existing && existing.sourceLocator !== entry.sourceLocator) {
        throw new Error(`Conflicting source locator for ${entry.sourceId}`);
      }
      sources.set(entry.sourceId, entry);
    }

    const collegeSources = uniqueSorted(rows.map((row) => row.source_id));
    const hubPath = `/${college.examId}/colleges/${college.id}`;
    addRoute({
      route_type: "hub",
      path: hubPath,
      exam_id: college.examId,
      college_id: college.id,
      year: null,
      program_slug: null,
      offering_id: null,
      body: null,
      quota: null,
      seat_type: null,
      gender: null,
      rounds_json: "[]",
      row_count: rows.length,
      round_count: uniqueSorted(rows.map((row) => row.round)).length,
      indexable: true,
      index_reason: "college-hub",
      content_sha256: sha256([
        college.name,
        college.seoName,
        college.artifactSha256,
        college.pages.map((page) => [page.year, page.contentSha256]),
      ]),
      source_ids_json: JSON.stringify(collegeSources),
    });

    for (const [yearKey, yearRows] of groupBy(rows, (row) => String(row.year))) {
      const year = Number(yearKey);
      const page = college.pages.find((candidate) => candidate.year === year);
      if (!page) throw new Error(`Missing page catalog entry for ${college.id} ${year}`);
      const yearPath = `${hubPath}/cutoffs/${year}`;
      addRoute({
        route_type: "year",
        path: yearPath,
        exam_id: college.examId,
        college_id: college.id,
        year,
        program_slug: null,
        offering_id: null,
        body: null,
        quota: null,
        seat_type: null,
        gender: null,
        rounds_json: JSON.stringify(uniqueSorted(yearRows.map((row) => row.round))),
        row_count: yearRows.length,
        round_count: uniqueSorted(yearRows.map((row) => row.round)).length,
        indexable: true,
        index_reason: "college-year",
        content_sha256: page.contentSha256,
        fallbackLastChangedAt: page.lastChangedAt,
        source_ids_json: JSON.stringify(uniqueSorted(yearRows.map((row) => row.source_id))),
      });

      const programSlugs = new Set<string>();
      for (const offeringRows of groupBy(yearRows, (row) => row.offering_id).values()) {
        const first = offeringRows[0];
        if (!first) continue;
        const slug = programSlug(first);
        if (!slug || slug.length > 96 || programSlugs.has(slug)) {
          throw new Error(`Invalid or duplicate program slug for ${college.id} ${year}: ${slug}`);
        }
        programSlugs.add(slug);
        const programPath = `${yearPath}/programs/${slug}`;
        const programRounds = uniqueSorted(offeringRows.map((row) => row.round));
        addRoute({
          route_type: "program",
          path: programPath,
          exam_id: college.examId,
          college_id: college.id,
          year,
          program_slug: slug,
          offering_id: first.offering_id,
          body: null,
          quota: null,
          seat_type: null,
          gender: null,
          rounds_json: JSON.stringify(programRounds),
          row_count: offeringRows.length,
          round_count: programRounds.length,
          indexable: true,
          index_reason: "exact-program",
          content_sha256: rowHash(offeringRows),
          source_ids_json: JSON.stringify(uniqueSorted(offeringRows.map((row) => row.source_id))),
        });

        for (const profileRows of groupBy(
          offeringRows,
          (row) => `${row.body}|${row.quota}|${row.seat_type}|${row.gender}`,
        ).values()) {
          const profile = profileRows[0];
          if (!profile) continue;
          const quotaSlug = QUOTA_SLUGS[profile.quota];
          const seatTypeSlug = SEAT_TYPE_SLUGS[profile.seat_type];
          const genderSlug = GENDER_SLUGS[profile.gender];
          if (!quotaSlug || !seatTypeSlug || !genderSlug) {
            throw new Error(
              `Missing profile slug mapping: ${profile.quota}|${profile.seat_type}|${profile.gender}`,
            );
          }
          const rounds = uniqueSorted(profileRows.map((row) => row.round));
          const indexable = rounds.length >= 2;
          addRoute({
            route_type: "profile",
            path: `${programPath}/${profile.body}/${quotaSlug}/${seatTypeSlug}/${genderSlug}`,
            exam_id: college.examId,
            college_id: college.id,
            year,
            program_slug: slug,
            offering_id: profile.offering_id,
            body: profile.body,
            quota: profile.quota,
            seat_type: profile.seat_type,
            gender: profile.gender,
            rounds_json: JSON.stringify(rounds),
            row_count: profileRows.length,
            round_count: rounds.length,
            indexable,
            index_reason: indexable ? "multi-round-profile" : "single-round-profile",
            content_sha256: rowHash(profileRows),
            source_ids_json: JSON.stringify(uniqueSorted(profileRows.map((row) => row.source_id))),
          });
        }
      }
    }
  }

  for (const examId of ["jee-main", "jee-advanced"] as const) {
    const colleges = args.colleges.filter((college) => college.examId === examId);
    addRoute({
      route_type: "directory",
      path: `/${examId}/colleges`,
      exam_id: examId,
      college_id: null,
      year: null,
      program_slug: null,
      offering_id: null,
      body: null,
      quota: null,
      seat_type: null,
      gender: null,
      rounds_json: "[]",
      row_count: colleges.length,
      round_count: 0,
      indexable: true,
      index_reason: "exam-directory",
      content_sha256: sha256(
        colleges.map((college) => [college.id, college.name, college.artifactSha256]),
      ),
      source_ids_json: "[]",
    });
  }

  addRoute({
    route_type: "entry",
    path: "/jee-cutoffs",
    exam_id: null,
    college_id: null,
    year: null,
    program_slug: null,
    offering_id: null,
    body: null,
    quota: null,
    seat_type: null,
    gender: null,
    rounds_json: "[]",
    row_count: args.colleges.length,
    round_count: 0,
    indexable: true,
    index_reason: "jee-entry",
    content_sha256: sha256(
      args.colleges.map((college) => [college.examId, college.id, college.artifactSha256]),
    ),
    source_ids_json: "[]",
  });

  routes.sort((left, right) => left.path.localeCompare(right.path));
  await fs.writeFile(
    temporaryJsonlPath,
    `${routes.map((route) => JSON.stringify(route)).join("\n")}\n`,
  );
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();
  await connection.run(`
    COPY (
      SELECT * FROM read_json_auto(
        ${sqlString(temporaryJsonlPath)},
        format = 'newline_delimited',
        maximum_object_size = 10485760
      )
      ORDER BY path
    ) TO ${sqlString(seoPath)}
    (FORMAT PARQUET, COMPRESSION ZSTD, ROW_GROUP_SIZE 10000)
  `);
  connection.closeSync();
  await fs.unlink(temporaryJsonlPath);

  const sourceEntries = [...sources.values()].sort((left, right) =>
    left.sourceId.localeCompare(right.sourceId),
  );
  await fs.writeFile(
    sourcePath,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        generatedAt: args.generatedAt,
        rightsNotice:
          "Technical provenance only. A source entry does not assert permission, endorsement, or a data reuse licence.",
        sources: sourceEntries,
      },
      null,
      2,
    )}\n`,
  );

  const programCount = routes.filter((route) => route.route_type === "program").length;
  const profiles = routes.filter((route) => route.route_type === "profile");
  return {
    seoRoutesArtifactPath: path.relative(args.dataDir, seoPath).split(path.sep).join("/"),
    seoRoutesArtifactSha256: await sha256File(seoPath),
    sourceRegistryPath: path.relative(args.dataDir, sourcePath).split(path.sep).join("/"),
    sourceRegistrySha256: await sha256File(sourcePath),
    totals: {
      programs: programCount,
      profiles: profiles.length,
      multiRoundProfiles: profiles.filter((route) => route.indexable).length,
      oneRoundProfiles: profiles.filter((route) => !route.indexable).length,
      canonicalRoutes: routes.length,
      indexableRoutes: routes.filter((route) => route.indexable).length,
      sources: sourceEntries.length,
    },
  };
}
