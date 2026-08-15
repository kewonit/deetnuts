#!/usr/bin/env tsx

import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";
import { readParquetRows } from "@ejam/data/college-predictor";
import { DATA_DIR } from "../../repo-root.js";
import { buildSeoArtifacts } from "./seo-artifacts.js";

type Institute = {
  id: string;
  name: string;
  aliases: string[];
  type: string;
  state: string;
  city: string;
  established: number;
};

type Program = {
  id: string;
  name: string;
  aliases: string[];
  degree: string;
  duration_years: number;
};

type ProgramOffering = {
  source_program_id: string;
  source_program_name: string;
  canonical_program_id: string | null;
};

type ServingRow = {
  body: "josaa" | "csab";
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
  exam_id: "jee-main" | "jee-advanced";
  institute_type: string;
  degree: string;
  duration_years: number;
  source: string;
  source_id: string;
  source_locator: string;
};

type PageCatalogEntry = {
  year: number;
  bodies: Array<"josaa" | "csab">;
  roundsByBody: Record<string, number[]>;
  rowCount: number;
  contentSha256: string;
  lastChangedAt: string;
};

type CollegeCatalogEntry = {
  id: string;
  name: string;
  seoName: string;
  aliases: string[];
  type: string;
  state: string;
  city: string;
  established: number;
  examId: "jee-main" | "jee-advanced";
  artifactPath: string;
  artifactSha256: string;
  rowCount: number;
  pages: PageCatalogEntry[];
};

type CutoffCatalog = {
  schemaVersion: 1 | 2;
  releaseVersion: string;
  sourceManifestVersion: string;
  generatedAt: string;
  seoRoutesArtifactPath?: string;
  seoRoutesArtifactSha256?: string;
  sourceRegistryPath?: string;
  sourceRegistrySha256?: string;
  totals: {
    rows: number;
    colleges: number;
    pages: number;
    jeeMainPages: number;
    jeeAdvancedPages: number;
    programs?: number;
    profiles?: number;
    multiRoundProfiles?: number;
    oneRoundProfiles?: number;
    canonicalRoutes?: number;
    indexableRoutes?: number;
    sources?: number;
  };
  colleges: CollegeCatalogEntry[];
};

type ReleaseManifest = {
  version: string;
  datasets: Array<{ path: string; sha256: string }>;
};

const OUTPUT_DIR = path.join(DATA_DIR, "tools", "college-cutoffs");
const COLLEGE_DIR = path.join(OUTPUT_DIR, "colleges");
const CATALOG_PATH = path.join(OUTPUT_DIR, "catalog.json");
const LINEAGE_PATH = path.join(OUTPUT_DIR, "cutoff-pages.lineage.json");
const OFFERINGS_PATH = path.join(
  DATA_DIR,
  "reference",
  "engineering",
  "jee-program-offerings.json",
);

function normalizeVersion(value: string): string {
  return value.startsWith("v") ? value : `v${value}`;
}

function readArg(name: string): string | undefined {
  return process.argv
    .find((argument) => argument.startsWith(`--${name}=`))
    ?.slice(name.length + 3);
}

function seoName(institute: Institute): string {
  const prefix = institute.type === "3IT" ? "IIIT" : institute.type;
  const alias = institute.aliases.find((value) =>
    value.toUpperCase().startsWith(`${prefix.toUpperCase()} `),
  );
  return alias ?? institute.name;
}

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

async function sha256File(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

function pageContentHash(rows: ServingRow[]): string {
  const stableRows = rows.map((row) => [
    row.body,
    Number(row.year),
    Number(row.round),
    row.source_program_id,
    row.source_program_name,
    row.canonical_program_id,
    row.offering_id,
    row.degree,
    Number(row.duration_years),
    row.quota,
    row.seat_type,
    row.gender,
    Number(row.opening_rank),
    Number(row.closing_rank),
    row.source_id,
    row.source_locator,
  ]);
  return createHash("sha256").update(JSON.stringify(stableRows)).digest("hex");
}

function findCutoffFiles(manifest: ReleaseManifest): Array<{
  body: "josaa" | "csab";
  absolutePath: string;
  manifestPath: string;
  expectedSha256: string;
}> {
  const files: Array<{
    body: "josaa" | "csab";
    absolutePath: string;
    manifestPath: string;
    expectedSha256: string;
  }> = [];
  for (const dataset of manifest.datasets) {
    const match = dataset.path.match(
      /^datasets\/engineering\/jee\/(josaa|csab)\/cutoffs\/year=\d{4}\/round=\d+\/cutoffs\.parquet$/,
    );
    if (!match) continue;
    files.push({
      body: match[1] as "josaa" | "csab",
      absolutePath: path.join(DATA_DIR, dataset.path),
      manifestPath: dataset.path,
      expectedSha256: dataset.sha256,
    });
  }
  return files.sort((left, right) =>
    left.manifestPath.localeCompare(right.manifestPath),
  );
}

function buildProgramOfferings(
  rawProgramIds: string[],
  reviewedOfferings: ProgramOffering[],
  programs: Program[],
): ProgramOffering[] {
  const reviewed = new Map(
    reviewedOfferings.map((offering) => [offering.source_program_id, offering]),
  );
  const canonicalIds = new Set(programs.map((program) => program.id));
  const unresolved = rawProgramIds.filter((programId) => {
    const offering = reviewed.get(programId);
    return !offering?.source_program_name.trim();
  });
  if (unresolved.length > 0) {
    throw new Error(
      `Unreviewed source program labels: ${unresolved.join(", ")}. Add exact official labels to ${OFFERINGS_PATH} before publication.`,
    );
  }
  const invalidCanonical = reviewedOfferings.filter(
    (offering) =>
      offering.canonical_program_id !== null &&
      !canonicalIds.has(offering.canonical_program_id),
  );
  if (invalidCanonical.length > 0) {
    throw new Error(
      `Unknown canonical program IDs: ${invalidCanonical.map((offering) => offering.canonical_program_id).join(", ")}`,
    );
  }
  return rawProgramIds.sort().map((programId) => reviewed.get(programId)!);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function main(): Promise<void> {
  const sourceReleaseArg = readArg("source-release");
  const releaseArg = readArg("release");
  if (!sourceReleaseArg || !releaseArg) {
    throw new Error(
      "Both --source-release and --release are required so cutoff builds cannot consume unpinned files.",
    );
  }
  const sourceManifestVersion = normalizeVersion(sourceReleaseArg);
  const releaseVersion = normalizeVersion(releaseArg);
  const sourceManifest = await readJson<ReleaseManifest>(
    path.join(DATA_DIR, "catalog", "releases", `${sourceManifestVersion}.json`),
  );
  if (normalizeVersion(sourceManifest.version) !== sourceManifestVersion) {
    throw new Error(`Source manifest version mismatch for ${sourceManifestVersion}`);
  }
  const generatedAt = new Date().toISOString();
  const institutes = await readJson<Institute[]>(
    path.join(DATA_DIR, "reference", "engineering", "institutes.json"),
  );
  const programs = await readJson<Program[]>(
    path.join(DATA_DIR, "reference", "engineering", "programs.json"),
  );
  const reviewedOfferings = await readJson<ProgramOffering[]>(OFFERINGS_PATH);
  const instituteById = new Map(
    institutes.map((institute) => [institute.id, institute]),
  );
  const cutoffFiles = findCutoffFiles(sourceManifest);
  if (cutoffFiles.length === 0) throw new Error("No JEE cutoff files found");
  for (const file of cutoffFiles) {
    const actualSha256 = await sha256File(file.absolutePath);
    if (actualSha256 !== file.expectedSha256) {
      throw new Error(`Checksum mismatch for source cutoff ${file.manifestPath}`);
    }
  }

  await fs.mkdir(COLLEGE_DIR, { recursive: true });
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();
  const unionSql = cutoffFiles
    .map(
      ({ body, absolutePath }) =>
        `SELECT ${sqlString(body)} AS body, * FROM read_parquet(${sqlString(absolutePath)})`,
    )
    .join("\nUNION ALL\n");
  await connection.run(`CREATE TEMP TABLE raw_cutoffs AS ${unionSql}`);

  const countReader = await connection.runAndReadAll(
    "SELECT COUNT(*)::INTEGER AS row_count FROM raw_cutoffs",
  );
  const totalRows = Number(countReader.getRowObjects()[0]?.row_count ?? 0);
  const programsReader = await connection.runAndReadAll(
    "SELECT DISTINCT program_id FROM raw_cutoffs ORDER BY program_id",
  );
  const rawProgramIds = programsReader
    .getRowObjects()
    .map((row) => String(row.program_id));
  buildProgramOfferings(
    rawProgramIds,
    reviewedOfferings,
    programs,
  );

  const unknownInstitutesReader = await connection.runAndReadAll(
    "SELECT DISTINCT institute_id FROM raw_cutoffs ORDER BY institute_id",
  );
  const instituteIds = unknownInstitutesReader
    .getRowObjects()
    .map((row) => String(row.institute_id));
  const unknownInstitutes = instituteIds.filter((id) => !instituteById.has(id));
  if (unknownInstitutes.length > 0) {
    throw new Error(`Unknown institutes: ${unknownInstitutes.join(", ")}`);
  }

  const invalidTaxonomyReader = await connection.runAndReadAll(`
    SELECT COUNT(*)::INTEGER AS invalid_taxonomy_rows
    FROM raw_cutoffs
    WHERE rank_exam NOT IN ('jee_main', 'jee_advanced')
       OR instype NOT IN ('IIT', 'NIT', '3IT', 'CFI')
       OR quota NOT IN ('AI', 'AP', 'DASA-CIWG', 'DASA-Non CIWG', 'GO', 'HS', 'JK', 'LA', 'OS')
       OR seat_type NOT IN ('EWS', 'EWS (PwD)', 'OBC-NCL', 'OBC-NCL (PwD)', 'OPEN', 'OPEN (PwD)', 'SC', 'SC (PwD)', 'ST', 'ST (PwD)')
       OR gender NOT IN ('Female-only (including Supernumerary)', 'Gender-Neutral', 'NA')
       OR year < 2010 OR round <= 0 OR duration_years <= 0
       OR degree IS NULL OR trim(degree) = ''
       OR source IS NULL OR trim(source) = ''
  `);
  const invalidTaxonomyRows = Number(
    invalidTaxonomyReader.getRowObjects()[0]?.invalid_taxonomy_rows ?? 0,
  );
  if (invalidTaxonomyRows !== 0) {
    throw new Error(`Found ${invalidTaxonomyRows} rows with invalid cutoff taxonomy`);
  }

  const duplicateReader = await connection.runAndReadAll(`
    SELECT COUNT(*)::INTEGER AS duplicate_groups
    FROM (
      SELECT body, year, round, institute_id, program_id, degree,
             duration_years, quota, seat_type, gender, COUNT(*) AS n
      FROM raw_cutoffs
      GROUP BY ALL
      HAVING COUNT(*) > 1
    ) duplicates
  `);
  const duplicateGroups = Number(
    duplicateReader.getRowObjects()[0]?.duplicate_groups ?? 0,
  );
  if (duplicateGroups !== 0) {
    throw new Error(`Found ${duplicateGroups} duplicate cutoff identities`);
  }

  await connection.run(
    `CREATE TEMP TABLE program_offerings AS SELECT * FROM read_json_auto(${sqlString(OFFERINGS_PATH)})`,
  );
  await connection.run(`
    CREATE TEMP TABLE serving_rows AS
    SELECT
      r.body,
      r.year,
      r.round,
      r.institute_id,
      r.program_id AS source_program_id,
      p.source_program_name,
      p.canonical_program_id,
      'of-' || substr(md5(concat_ws('|', r.institute_id, r.program_id, r.degree, r.duration_years::VARCHAR)), 1, 16) AS offering_id,
      r.quota,
      r.seat_type,
      r.gender,
      r.opening_rank,
      r.closing_rank,
      CASE r.rank_exam WHEN 'jee_main' THEN 'jee-main' ELSE 'jee-advanced' END AS exam_id,
      CASE r.instype WHEN '3IT' THEN 'IIIT' ELSE r.instype END AS institute_type,
      r.degree,
      r.duration_years,
      r.source,
      r.source_id,
      r.source_locator
    FROM raw_cutoffs r
    INNER JOIN program_offerings p ON p.source_program_id = r.program_id
  `);

  const invalidReader = await connection.runAndReadAll(`
    SELECT COUNT(*)::INTEGER AS invalid_rows
    FROM serving_rows
    WHERE opening_rank <= 0 OR closing_rank <= 0 OR opening_rank > closing_rank
       OR source_program_name IS NULL OR source_program_name = ''
       OR source IS NULL OR source = ''
       OR source_id IS NULL OR source_id = ''
       OR source_locator IS NULL OR source_locator = ''
  `);
  const invalidRows = Number(invalidReader.getRowObjects()[0]?.invalid_rows ?? 0);
  if (invalidRows !== 0) throw new Error(`Found ${invalidRows} invalid cutoff rows`);

  const previousCatalog = await readJson<CutoffCatalog>(CATALOG_PATH).catch(
    () => null,
  );
  const previousPages = new Map<string, PageCatalogEntry>();
  for (const college of previousCatalog?.colleges ?? []) {
    for (const page of college.pages) {
      previousPages.set(`${college.examId}|${college.id}|${page.year}`, page);
    }
  }

  const artifacts: Array<{
    instituteId: string;
    path: string;
    sha256: string;
    bytes: number;
    rows: number;
  }> = [];
  const colleges: CollegeCatalogEntry[] = [];

  for (const instituteId of instituteIds) {
    const institute = instituteById.get(instituteId);
    if (!institute) throw new Error(`Missing institute ${instituteId}`);
    const outputPath = path.join(COLLEGE_DIR, `${instituteId}.parquet`);
    await connection.run(`
      COPY (
        SELECT * FROM serving_rows
        WHERE institute_id = ${sqlString(instituteId)}
        ORDER BY exam_id, year, body, round, source_program_name, degree,
                 duration_years, quota, seat_type, gender
      ) TO ${sqlString(outputPath)}
      (FORMAT PARQUET, COMPRESSION ZSTD, ROW_GROUP_SIZE 10000)
    `);
    const rows = await readParquetRows<ServingRow>(outputPath);
    const examIds = [...new Set(rows.map((row) => row.exam_id))];
    if (examIds.length !== 1) {
      throw new Error(`${instituteId} spans multiple rank exams: ${examIds.join(", ")}`);
    }
    const examId = examIds[0];
    const pages: PageCatalogEntry[] = [];
    for (const year of [...new Set(rows.map((row) => Number(row.year)))].sort(
      (left, right) => right - left,
    )) {
      const pageRows = rows.filter((row) => Number(row.year) === year);
      const contentSha256 = pageContentHash(pageRows);
      const previous = previousPages.get(`${examId}|${instituteId}|${year}`);
      const bodies = [...new Set(pageRows.map((row) => row.body))].sort() as Array<
        "josaa" | "csab"
      >;
      const roundsByBody = Object.fromEntries(
        bodies.map((body) => [
          body,
          [...new Set(
            pageRows
              .filter((row) => row.body === body)
              .map((row) => Number(row.round)),
          )].sort((left, right) => left - right),
        ]),
      );
      pages.push({
        year,
        bodies,
        roundsByBody,
        rowCount: pageRows.length,
        contentSha256,
        lastChangedAt:
          previous?.contentSha256 === contentSha256
            ? previous.lastChangedAt
            : generatedAt,
      });
    }

    const artifactPath = path.relative(DATA_DIR, outputPath).split(path.sep).join("/");
    const stat = await fs.stat(outputPath);
    const artifactSha256 = await sha256File(outputPath);
    artifacts.push({
      instituteId,
      path: artifactPath,
      sha256: artifactSha256,
      bytes: stat.size,
      rows: rows.length,
    });
    colleges.push({
      id: institute.id,
      name: institute.name,
      seoName: seoName(institute),
      aliases: institute.aliases,
      type: institute.type === "3IT" ? "IIIT" : institute.type,
      state: institute.state,
      city: institute.city,
      established: institute.established,
      examId,
      artifactPath,
      artifactSha256,
      rowCount: rows.length,
      pages,
    });
  }

  colleges.sort(
    (left, right) =>
      left.examId.localeCompare(right.examId) ||
      left.seoName.localeCompare(right.seoName),
  );
  const pageCount = colleges.reduce(
    (total, college) => total + college.pages.length,
    0,
  );
  const seoArtifacts = await buildSeoArtifacts({
    dataDir: DATA_DIR,
    outputDir: OUTPUT_DIR,
    generatedAt,
    colleges,
  });
  const catalog: CutoffCatalog = {
    schemaVersion: 2,
    releaseVersion,
    sourceManifestVersion,
    generatedAt,
    seoRoutesArtifactPath: seoArtifacts.seoRoutesArtifactPath,
    seoRoutesArtifactSha256: seoArtifacts.seoRoutesArtifactSha256,
    sourceRegistryPath: seoArtifacts.sourceRegistryPath,
    sourceRegistrySha256: seoArtifacts.sourceRegistrySha256,
    totals: {
      rows: totalRows,
      colleges: colleges.length,
      pages: pageCount,
      jeeMainPages: colleges
        .filter((college) => college.examId === "jee-main")
        .reduce((total, college) => total + college.pages.length, 0),
      jeeAdvancedPages: colleges
        .filter((college) => college.examId === "jee-advanced")
        .reduce((total, college) => total + college.pages.length, 0),
      ...seoArtifacts.totals,
    },
    colleges,
  };
  await fs.writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
  const catalogSha256 = await sha256File(CATALOG_PATH);
  await fs.writeFile(
    LINEAGE_PATH,
    `${JSON.stringify(
      {
        schema_version: 1,
        artifact: "college_cutoff_pages",
        release_version: releaseVersion,
        source_manifest_version: sourceManifestVersion,
        generated_at: generatedAt,
        source_cutoffs: cutoffFiles.map((file) => file.manifestPath),
        catalog_sha256: catalogSha256,
        artifacts,
      },
      null,
      2,
    )}\n`,
  );
  connection.closeSync();

  console.log(
    `Built ${colleges.length} college artifacts, ${pageCount} pages, ${totalRows} rows`,
  );
  console.log(
    `JEE Main pages=${catalog.totals.jeeMainPages}, JEE Advanced pages=${catalog.totals.jeeAdvancedPages}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
