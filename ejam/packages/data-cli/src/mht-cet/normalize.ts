#!/usr/bin/env tsx

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  loadMhtCetSeatPoolRegistry,
  loadMhtCetStageRuleRegistry,
  type MhtCetCutoffRow,
  type MhtCetInstituteReference,
} from "@ejam/data/mht-cet";
import type { z } from "zod";
import { DATA_DIR } from "../repo-root.js";
import { readInstituteReferences } from "./normalize-institutes.js";
import {
  type AuditReason,
  classifyStagingRows,
  normalizeOfficialRows,
} from "./normalize-records.js";
import {
  cutoffKey,
  OfficialCutoff,
  OfficialProgram,
  parquetFromJsonLines,
  type RawCutoff,
  readJsonArray,
  readJsonLines,
} from "./normalize-support.js";
import {
  assertMhtCetSourceAccounting,
  MHT_CET_CUTOFF_SOURCES,
  MHT_CET_EXPECTED_ADDITIONAL_STAGE_CELLS,
  MHT_CET_EXPECTED_MULTI_STAGE_KEYS,
  MHT_CET_EXPECTED_OFFICIAL_KEYS,
  MHT_CET_EXPECTED_OFFICIAL_ROWS,
} from "./source-spec.js";

type ExtractionSource = {
  source_id: string;
  year: number;
  round: number;
  pdf_path: string;
  pdf_sha256: string;
  normalized_path: string;
  normalized_sha256: string;
  row_count: number;
  source_key_count: number;
};

const EXPECTED_STAGE_LABELS = [
  "I",
  "I-Non Defence",
  "I-Non PWD",
  "II",
  "MH",
  "VII",
] as const;

function countClassifications(rows: AuditReason[]) {
  return rows.reduce(
    (counts, row) => {
      counts[row.classification] += 1;
      return counts;
    },
    {
      published: 0,
      "excluded-by-scope": 0,
      quarantined: 0,
    },
  );
}

async function sha256File(path: string): Promise<string> {
  return createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "snapshot-root": { type: "string" },
      "official-root": { type: "string" },
      "run-id": { type: "string" },
      publish: { type: "boolean", default: false },
    },
  });
  if (!values["snapshot-root"] || !values["official-root"]) {
    throw new Error(
      "--snapshot-root and --official-root are required; staging data is never normalized alone",
    );
  }
  const snapshotRoot = resolve(values["snapshot-root"]);
  const officialRoot = resolve(values["official-root"]);
  const runId = values["run-id"] ?? randomUUID();
  const registry = loadMhtCetSeatPoolRegistry();
  const poolByCode = new Map(
    registry.entries.map((entry) => [entry.source_code, entry]),
  );
  const snapshotReport = JSON.parse(
    await readFile(join(snapshotRoot, "snapshot-report.json"), "utf-8"),
  ) as {
    tables: Array<{
      table: string;
      source_count: number;
      canonical_sha256: string;
    }>;
  };
  const snapshotByTable = new Map(
    snapshotReport.tables.map((table) => [table.table, table]),
  );
  assertMhtCetSourceAccounting(
    new Map(
      MHT_CET_CUTOFF_SOURCES.map((source) => [
        source.table,
        snapshotByTable.get(source.table)?.source_count ?? 0,
      ]),
    ),
  );

  const instituteReferences = new Map<
    string,
    z.infer<typeof MhtCetInstituteReference>
  >();
  const programs = new Map<string, z.infer<typeof OfficialProgram>>();
  for (const year of [2024, 2025] as const) {
    const institutes = await readInstituteReferences(
      join(officialRoot, `institutes-${year}.json`),
    );
    for (const institute of institutes) {
      instituteReferences.set(`${year}:${institute.institute_code}`, institute);
    }
    const yearPrograms = await readJsonArray(
      join(officialRoot, `programs-${year}.json`),
      OfficialProgram,
    );
    for (const program of yearPrograms) {
      const institute = instituteReferences.get(
        `${year}:${program.institute_code}`,
      );
      if (!institute) {
        throw new Error(
          `program references missing institute ${year}:${program.institute_code}`,
        );
      }
      const normalizedProgram = OfficialProgram.parse({
        ...program,
        home_university_id: institute.home_university_id,
        affiliating_university_id:
          program.affiliating_university_id ?? program.home_university_id,
      });
      programs.set(
        `${year}:${program.institute_code}:${program.choice_code}`,
        normalizedProgram,
      );
    }
  }

  const stagingAudit: AuditReason[] = [];
  const officialAudit: AuditReason[] = [];
  const canonicalRowsBySource = new Map<string, MhtCetCutoffRow[]>();
  const extractionSources: ExtractionSource[] = [];
  const officialKeyCounts = new Map<string, number>();
  const observedStageLabels = new Set<string>();
  let officialRowCount = 0;
  let officialKeyCount = 0;

  for (const source of MHT_CET_CUTOFF_SOURCES) {
    const raw: unknown = JSON.parse(
      await readFile(join(snapshotRoot, `${source.table}.json`), "utf-8"),
    );
    if (!Array.isArray(raw) || raw.length !== source.expectedRows) {
      throw new Error(
        `${source.table}: expected ${source.expectedRows}, found ${Array.isArray(raw) ? raw.length : "non-array"}`,
      );
    }
    const normalizedPath = `cutoffs-year=${source.year}-round=${source.round}.jsonl`;
    const officialRows = await readJsonLines(
      join(officialRoot, normalizedPath),
      OfficialCutoff,
    );
    if (officialRows.length !== source.expectedOfficialRows) {
      throw new Error(
        `${normalizedPath}: expected ${source.expectedOfficialRows} official rows, found ${officialRows.length}`,
      );
    }
    const sourceKeys = new Set(officialRows.map(cutoffKey));
    if (sourceKeys.size !== source.expectedOfficialKeys) {
      throw new Error(
        `${normalizedPath}: expected ${source.expectedOfficialKeys} source keys, found ${sourceKeys.size}`,
      );
    }
    for (const row of officialRows) {
      const key = cutoffKey(row);
      officialKeyCounts.set(key, (officialKeyCounts.get(key) ?? 0) + 1);
      observedStageLabels.add(row.source_stage_label);
    }
    officialRowCount += officialRows.length;
    officialKeyCount += sourceKeys.size;
    const stageRegistry = loadMhtCetStageRuleRegistry(source.year);
    const officialResult = normalizeOfficialRows({
      source,
      officialRows,
      instituteReferences,
      programs,
      poolByCode,
      stageRegistry,
    });
    officialAudit.push(...officialResult.audit);
    canonicalRowsBySource.set(source.table, officialResult.rows);
    stagingAudit.push(
      ...classifyStagingRows({
        source,
        rawRows: raw as RawCutoff[],
        officialRows,
        poolByCode,
        stageRegistry,
      }),
    );
    const pdfPath = join(
      officialRoot,
      "cutoffs",
      `${source.year}-cap${source.round}.pdf`,
    );
    extractionSources.push({
      source_id:
        officialRows[0]?.source_id ??
        `mht-cet.${source.year}.cap${source.round}`,
      year: source.year,
      round: source.round,
      pdf_path: `cutoffs/${source.year}-cap${source.round}.pdf`,
      pdf_sha256: await sha256File(pdfPath),
      normalized_path: normalizedPath,
      normalized_sha256: officialResult.canonicalSha256,
      row_count: officialRows.length,
      source_key_count: sourceKeys.size,
    });
  }

  if (officialRowCount !== MHT_CET_EXPECTED_OFFICIAL_ROWS) {
    throw new Error(
      `MHT-CET official accounting mismatch: expected ${MHT_CET_EXPECTED_OFFICIAL_ROWS}, found ${officialRowCount}`,
    );
  }
  if (officialKeyCount !== MHT_CET_EXPECTED_OFFICIAL_KEYS) {
    throw new Error(
      `MHT-CET official key accounting mismatch: expected ${MHT_CET_EXPECTED_OFFICIAL_KEYS}, found ${officialKeyCount}`,
    );
  }
  const multiStageKeyCount = Array.from(officialKeyCounts.values()).filter(
    (count) => count > 1,
  ).length;
  const additionalStageCellCount = officialRowCount - officialKeyCount;
  if (
    multiStageKeyCount !== MHT_CET_EXPECTED_MULTI_STAGE_KEYS ||
    additionalStageCellCount !== MHT_CET_EXPECTED_ADDITIONAL_STAGE_CELLS
  ) {
    throw new Error(
      `MHT-CET stage expansion mismatch: expected ${MHT_CET_EXPECTED_MULTI_STAGE_KEYS} multi-stage keys/${MHT_CET_EXPECTED_ADDITIONAL_STAGE_CELLS} additional cells, found ${multiStageKeyCount}/${additionalStageCellCount}`,
    );
  }
  const stageLabels = Array.from(observedStageLabels).sort();
  if (
    JSON.stringify(stageLabels) !==
    JSON.stringify([...EXPECTED_STAGE_LABELS].sort())
  ) {
    throw new Error(
      `MHT-CET stage labels require review: expected ${EXPECTED_STAGE_LABELS.join(", ")}, found ${stageLabels.join(", ")}`,
    );
  }
  const stagingCounts = countClassifications(stagingAudit);
  const officialCounts = countClassifications(officialAudit);
  const classifiedStagingRows =
    stagingCounts.published +
    stagingCounts["excluded-by-scope"] +
    stagingCounts.quarantined;
  if (classifiedStagingRows !== 290_113) {
    throw new Error(
      `MHT-CET staging accounting mismatch: expected 290113, classified ${classifiedStagingRows}`,
    );
  }

  const auditRoot = resolve(
    DATA_DIR,
    "_scratch",
    "mht-cet",
    "normalization",
    runId,
  );
  await mkdir(auditRoot, { recursive: true });
  await writeFile(
    join(auditRoot, "classification-report.json"),
    `${JSON.stringify(
      {
        schema_version: 3,
        run_id: runId,
        staging: {
          counts: stagingCounts,
          classified_rows: classifiedStagingRows,
          rows: stagingAudit,
        },
        official: {
          counts: officialCounts,
          classified_rows: officialRowCount,
          rows: officialAudit,
        },
      },
      null,
      2,
    )}\n`,
  );
  const officialBlockers = officialAudit.filter(
    (row) => row.classification === "quarantined",
  );
  if (officialBlockers.length > 0) {
    throw new Error(
      `MHT-CET official normalization found ${officialBlockers.length} unresolved rows; nothing was published (audit: ${auditRoot})`,
    );
  }
  if (officialCounts.published !== MHT_CET_EXPECTED_OFFICIAL_ROWS) {
    throw new Error(
      `MHT-CET publication requires ${MHT_CET_EXPECTED_OFFICIAL_ROWS} official rows; found ${officialCounts.published}`,
    );
  }
  if (!values.publish) {
    console.log(
      `MHT-CET audit complete: ${officialCounts.published} official rows publishable`,
    );
    console.log(
      `Deetnuts reconciliation: ${stagingCounts.published} matched, ${stagingCounts["excluded-by-scope"]} excluded, ${stagingCounts.quarantined} quarantined`,
    );
    console.log(`Audit: ${auditRoot}`);
    return;
  }

  for (const source of MHT_CET_CUTOFF_SOURCES) {
    const rows = canonicalRowsBySource.get(source.table) ?? [];
    const jsonLinesPath = join(
      auditRoot,
      `cutoffs-year=${source.year}-round=${source.round}.jsonl`,
    );
    await writeFile(
      jsonLinesPath,
      `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`,
    );
    await parquetFromJsonLines(
      jsonLinesPath,
      resolve(
        DATA_DIR,
        "datasets",
        "engineering",
        "mht-cet",
        "maharashtra-cap",
        "cutoffs",
        `year=${source.year}`,
        `round=${source.round}`,
        "cutoffs.parquet",
      ),
    );
  }
  for (const year of [2024, 2025] as const) {
    const institutes = Array.from(instituteReferences.values())
      .filter((reference) => reference.year === year)
      .sort((left, right) =>
        left.institute_code.localeCompare(right.institute_code),
      );
    await writeFile(
      resolve(
        DATA_DIR,
        "reference",
        "engineering",
        "mht-cet",
        `institutes-${year}.json`,
      ),
      `${JSON.stringify(institutes, null, 2)}\n`,
    );
  }
  const parserPath = resolve(
    DATA_DIR,
    "..",
    "packages",
    "data-validation",
    "src",
    "ejam_data_validation",
    "mht_cet",
    "extract",
    "cutoffs.py",
  );
  const referenceParserPath = resolve(
    DATA_DIR,
    "..",
    "packages",
    "data-validation",
    "src",
    "ejam_data_validation",
    "mht_cet",
    "extract",
    "institutes.py",
  );
  await writeFile(
    resolve(
      DATA_DIR,
      "reference",
      "engineering",
      "mht-cet",
      "official-extraction-2024-2025.json",
    ),
    `${JSON.stringify(
      {
        schema_version: 2,
        parser: {
          id: "mht-cet-cutoff-extractor-v2",
          sha256: await sha256File(parserPath),
        },
        reference_parser: {
          id: "mht-cet-institute-reference-extractor-v2",
          sha256: await sha256File(referenceParserPath),
        },
        rules_sources: [
          {
            source_id: "mht-cet.2024.brochure",
            sha256:
              "c07a7c0edc2ecc7c8b65e2053a91f39b49203941404b20164113934a67013f06",
          },
          {
            source_id: "mht-cet.2025.brochure",
            sha256:
              "7b821016f55ad88086587216da4a9901d8ad7c81b266507a611a973cf1acf825",
          },
          {
            source_id: "mht-cet.2026.brochure",
            sha256:
              "f2f74f09669937c5cbfff0033e00838c85ee861d5c8923eecbd0894134cae1ba",
          },
        ],
        historical_stage_rule_registries: await Promise.all(
          [2024, 2025].map(async (year) => {
            const path = resolve(
              DATA_DIR,
              "reference",
              "engineering",
              "mht-cet",
              `historical-stage-rules-${year}.json`,
            );
            const stageRegistry = loadMhtCetStageRuleRegistry(year);
            return {
              source_year: year,
              source_id: stageRegistry.source_id,
              source_sha256: stageRegistry.source_sha256,
              registry_path: `historical-stage-rules-${year}.json`,
              registry_sha256: await sha256File(path),
            };
          }),
        ),
        allocation_rule_registry: {
          rules_year: 2026,
          source_id: "mht-cet.2026.brochure",
          registry_path: "allocation-rules-2026.json",
          registry_sha256: await sha256File(
            resolve(
              DATA_DIR,
              "reference",
              "engineering",
              "mht-cet",
              "allocation-rules-2026.json",
            ),
          ),
        },
        total_stage_rows: officialRowCount,
        source_key_count: officialKeyCount,
        multi_stage_key_count: multiStageKeyCount,
        additional_stage_cell_count: additionalStageCellCount,
        observed_stage_labels: stageLabels,
        sources: extractionSources,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `MHT-CET official publication complete: ${officialCounts.published} cutoff rows`,
  );
  console.log(
    `Deetnuts audit retained ${stagingCounts.quarantined} quarantined staging rows without suppressing official records`,
  );
  console.log(`Audit: ${auditRoot}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
