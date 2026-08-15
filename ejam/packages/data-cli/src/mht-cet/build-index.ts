#!/usr/bin/env tsx

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { DuckDBInstance } from "@duckdb/node-api";
import { readParquetRows } from "@ejam/data/college-predictor";
import {
  assertMhtCetIndexCompleteness,
  buildMhtCetPredictorIndex,
  evaluateMhtCetModel,
  loadMhtCetAllocationRuleRegistry,
  loadMhtCetSeatPoolRegistry,
  type MhtCetCutoffRow,
  MhtCetCutoffRow as MhtCetCutoffRowSchema,
  type MhtCetInstituteReference,
  MhtCetInstituteReference as MhtCetInstituteReferenceSchema,
  type MhtCetModelConfiguration,
  MhtCetModelConfiguration as MhtCetModelConfigurationSchema,
  MhtCetPredictorIndexRow,
} from "@ejam/data/mht-cet";
import {
  resolveManifestVersionForBuild,
  writeIndexLineageSidecar,
} from "../lib/index-lineage.js";
import { DATA_DIR } from "../repo-root.js";

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

async function readCutoffs(paths: string[]): Promise<MhtCetCutoffRow[]> {
  const rows: MhtCetCutoffRow[] = [];
  for (const path of paths) {
    const rawRows = await readParquetRows(path);
    for (const [index, raw] of rawRows.entries()) {
      const normalized = Object.fromEntries(
        Object.entries(raw).map(([key, value]) => {
          if (typeof value !== "bigint") return [key, value];
          const number = Number(value);
          if (!Number.isSafeInteger(number)) {
            throw new Error(
              `${path}: cutoff row ${index} field ${key} exceeds JSON safe-integer range`,
            );
          }
          return [key, number];
        }),
      );
      const parsed = MhtCetCutoffRowSchema.safeParse(normalized);
      if (!parsed.success) {
        throw new Error(
          `${path}: cutoff row ${index} failed MHT validation: ${parsed.error.message}`,
        );
      }
      rows.push(parsed.data);
    }
  }
  return rows;
}

async function readInstituteReferences(
  paths: string[],
): Promise<MhtCetInstituteReference[]> {
  const references: MhtCetInstituteReference[] = [];
  for (const path of paths) {
    const raw: unknown = JSON.parse(await readFile(path, "utf-8"));
    if (!Array.isArray(raw)) {
      throw new Error(`${path}: institute reference must be a JSON array`);
    }
    for (const [index, entry] of raw.entries()) {
      const parsed = MhtCetInstituteReferenceSchema.safeParse(entry);
      if (!parsed.success) {
        throw new Error(
          `${path}: institute reference ${index} failed validation: ${parsed.error.message}`,
        );
      }
      references.push(parsed.data);
    }
  }
  return references;
}

async function writeIndexParquet(
  rows: MhtCetPredictorIndexRow[],
  outputPath: string,
  scratchPath: string,
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await mkdir(dirname(scratchPath), { recursive: true });
  await writeFile(
    scratchPath,
    `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`,
  );
  const instance = await DuckDBInstance.create();
  const connection = await instance.connect();
  try {
    await connection.run(
      `COPY (
        SELECT * FROM read_json_auto(
          ${sqlLiteral(scratchPath)},
          format = 'newline_delimited',
          maximum_object_size = 104857600
        )
        ORDER BY institute_code, choice_code, seat_pool_id,
          source_seat_scope_id, allocation_scope_id, stage_semantics_id
      ) TO ${sqlLiteral(outputPath)} (FORMAT PARQUET, COMPRESSION ZSTD)`,
    );
  } finally {
    connection.closeSync();
    instance.closeSync();
  }
}

function assertCriticalIndexRegressions(rows: MhtCetPredictorIndexRow[]): void {
  const expected = [
    {
      choiceCode: "0675526310",
      seatPoolId: "mht-gopeno",
      sourceSeatScopeId: "other-university",
      allocationScopeId: "other-university",
      stageSemanticsId: "standard",
      ranks: [24_555, 27_575, 27_179, null],
    },
    {
      choiceCode: "0100219110",
      seatPoolId: "mht-gopens",
      sourceSeatScopeId: "state-level",
      allocationScopeId: "state-level",
      stageSemanticsId: "standard",
      ranks: [37_591, 39_713, 31_618, 28_216],
    },
    {
      choiceCode: "0675526310",
      seatPoolId: "mht-gsto",
      sourceSeatScopeId: "other-university",
      allocationScopeId: "home-university",
      stageSemanticsId: "standard",
      ranks: [null, null, 150_714, null],
    },
    {
      choiceCode: "0675526310",
      seatPoolId: "mht-gsto",
      sourceSeatScopeId: "other-university",
      allocationScopeId: "other-university",
      stageSemanticsId: "standard",
      ranks: [158_509, null, null, null],
    },
    {
      choiceCode: "0675526310",
      seatPoolId: "mht-gsto",
      sourceSeatScopeId: "other-university",
      allocationScopeId: "other-university",
      stageSemanticsId: "unrestricted-maharashtra-merit",
      ranks: [null, 27_806, null, null],
    },
  ] as const;

  for (const regression of expected) {
    const row = rows.find(
      (candidate) =>
        candidate.choice_code === regression.choiceCode &&
        candidate.seat_pool_id === regression.seatPoolId &&
        candidate.source_seat_scope_id === regression.sourceSeatScopeId &&
        candidate.allocation_scope_id === regression.allocationScopeId &&
        candidate.stage_semantics_id === regression.stageSemanticsId,
    );
    if (!row) {
      throw new Error(
        `MHT-CET critical regression missing ${regression.choiceCode}/${regression.seatPoolId}/${regression.allocationScopeId}`,
      );
    }
    const actual = [
      row.round1_rank,
      row.round2_rank,
      row.round3_rank,
      row.round4_rank,
    ];
    if (actual.some((rank, index) => rank !== regression.ranks[index])) {
      throw new Error(
        `MHT-CET critical regression changed ${regression.choiceCode}/${regression.seatPoolId}/${regression.allocationScopeId}: expected ${JSON.stringify(regression.ranks)}, received ${JSON.stringify(actual)}`,
      );
    }
  }
  const recoveredStages = new Set(
    rows
      .filter((row) => row.choice_code === "0100219110")
      .map((row) => row.stage_semantics_id),
  );
  for (const semantics of [
    "standard",
    "pwd-released-to-base-category",
    "unrestricted-maharashtra-merit",
  ] as const) {
    if (!recoveredStages.has(semantics)) {
      throw new Error(
        `MHT-CET critical regression missing ${semantics} channel for 0100219110`,
      );
    }
  }
  if (
    !rows.some(
      (row) =>
        row.choice_code === "0347119110" &&
        [row.round2_status, row.round3_status, row.round4_status].some(
          (status) => status !== "not-published",
        ),
    )
  ) {
    throw new Error(
      "MHT-CET critical regression missing later-round official channel for 0347119110",
    );
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      output: { type: "string" },
      "evaluation-output": { type: "string" },
    },
  });
  const cutoffPaths = [2024, 2025].flatMap((year) =>
    Array.from({ length: year === 2024 ? 3 : 4 }, (_, index) =>
      resolve(
        DATA_DIR,
        "datasets",
        "engineering",
        "mht-cet",
        "maharashtra-cap",
        "cutoffs",
        `year=${year}`,
        `round=${index + 1}`,
        "cutoffs.parquet",
      ),
    ),
  );
  const instituteReferencePaths = [2024, 2025].map((year) =>
    resolve(
      DATA_DIR,
      "reference",
      "engineering",
      "mht-cet",
      `institutes-${year}.json`,
    ),
  );
  const modelConfigurationPath = resolve(
    DATA_DIR,
    "reference",
    "engineering",
    "mht-cet",
    "model-2026.json",
  );
  const config = MhtCetModelConfigurationSchema.parse(
    JSON.parse(await readFile(modelConfigurationPath, "utf-8")),
  ) as MhtCetModelConfiguration;
  const [cutoffRows, instituteReferences] = await Promise.all([
    readCutoffs(cutoffPaths),
    readInstituteReferences(instituteReferencePaths),
  ]);
  const registry = loadMhtCetSeatPoolRegistry();
  const allocationRegistry = loadMhtCetAllocationRuleRegistry(
    config.rules_year,
  );
  if (registry.rules_year !== config.rules_year) {
    throw new Error(
      `MHT-CET rules mismatch: registry=${registry.rules_year}, model=${config.rules_year}`,
    );
  }
  const supportedStages = new Set(
    allocationRegistry.entries.flatMap((entry) => entry.supported_semantics),
  );
  for (const row of cutoffRows) {
    if (!supportedStages.has(row.stage_semantics_id)) {
      throw new Error(
        `MHT-CET ${config.rules_year} rules do not support historical stage ${row.stage_semantics_id}`,
      );
    }
  }

  const evaluation = evaluateMhtCetModel({
    cutoffRows,
    seatPools: registry.entries,
    config,
  });
  const evaluationOutput = resolve(
    values["evaluation-output"] ??
      resolve(
        DATA_DIR,
        "tools",
        "college-predictor",
        "maharashtra-cap",
        "evaluation-2026.json",
      ),
  );
  await mkdir(dirname(evaluationOutput), { recursive: true });
  await writeFile(evaluationOutput, `${JSON.stringify(evaluation, null, 2)}\n`);
  if (!evaluation.release_gates.passed) {
    throw new Error(
      `MHT-CET release gates failed; index was not written (report: ${evaluationOutput})`,
    );
  }

  const rows = buildMhtCetPredictorIndex({
    cutoffRows,
    instituteReferences,
    seatPools: registry.entries,
    config,
  }).map((row) => MhtCetPredictorIndexRow.parse(row));
  const completeness = assertMhtCetIndexCompleteness({
    cutoffRows,
    indexRows: rows,
    seatPoolRegistry: registry,
    latestYear: config.source_years[1],
  });
  assertCriticalIndexRegressions(rows);
  const outputPath = resolve(
    values.output ??
      resolve(
        DATA_DIR,
        "tools",
        "college-predictor",
        "maharashtra-cap",
        "predictor-index.parquet",
      ),
  );
  const scratchPath = join(
    DATA_DIR,
    "_scratch",
    "mht-cet",
    "predictor-index.jsonl",
  );
  await writeIndexParquet(rows, outputPath, scratchPath);
  writeIndexLineageSidecar({
    indexParquetPath: outputPath,
    indexDataset: "mht-cet-maharashtra-cap-predictor-index",
    sourceCutoffPaths: cutoffPaths,
    sourceReferences: [
      ...instituteReferencePaths.map((path) => ({
        dataset: "institute_reference",
        path,
      })),
      {
        dataset: "seat_pool_rules",
        path: resolve(
          DATA_DIR,
          "reference",
          "engineering",
          "mht-cet",
          "seat-pools-2026.json",
        ),
      },
      {
        dataset: "official_extraction",
        path: resolve(
          DATA_DIR,
          "reference",
          "engineering",
          "mht-cet",
          "official-extraction-2024-2025.json",
        ),
      },
      ...[2024, 2025].map((year) => ({
        dataset: `historical_stage_rules_${year}`,
        path: resolve(
          DATA_DIR,
          "reference",
          "engineering",
          "mht-cet",
          `historical-stage-rules-${year}.json`,
        ),
      })),
      {
        dataset: "allocation_rules_2026",
        path: resolve(
          DATA_DIR,
          "reference",
          "engineering",
          "mht-cet",
          "allocation-rules-2026.json",
        ),
      },
    ],
    modelConfigurationPath,
    manifestVersion: await resolveManifestVersionForBuild(),
  });
  console.log(`MHT-CET predictor index: ${rows.length} rows`);
  console.log(
    `Completeness oracle: ${completeness.officialStagePoints} official stage points, ${completeness.eligibilityWitnesses} eligible profile witnesses`,
  );
  console.log(`Evaluation report: ${evaluationOutput}`);
  console.log(`Index: ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
