#!/usr/bin/env tsx

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { readParquetRows } from "@ejam/data/college-predictor";
import {
  loadMhtCetSeatPoolRegistry,
  loadMhtCetStageRuleRegistry,
  type MhtCetCutoffRow,
  MhtCetCutoffRow as MhtCetCutoffRowSchema,
  type MhtCetInstituteReference,
  MhtCetInstituteReference as MhtCetInstituteReferenceSchema,
  type MhtCetSeatPoolDefinition,
  mhtCetStageRuleBySourceLabel,
  validateMhtCetStagePoolCombination,
} from "@ejam/data/mht-cet";
import { z } from "zod";
import { DATA_DIR } from "../repo-root.js";
import {
  effectiveAllocationScope,
  OfficialCutoff,
  parquetFromJsonLines,
  readJsonArray,
  readJsonLines,
  sourceSeatScope,
  stableOfficialRowId,
} from "./normalize-support.js";

const YEAR = 2026;
const ROUND = 1;
const EXPECTED_EXTRACTED_ROWS = 36_059;
const EXPECTED_PUBLISHED_ROWS = 36_053;
const EXPECTED_BASE_KEYS = 35_956;
const EXPECTED_INSTITUTES = 380;
const EXPECTED_CHOICE_CODES = 4_238;
const EXPECTED_MULTI_STAGE_KEYS = 97;
const EXPECTED_STAGE_COUNTS = new Map([
  ["I:standard", 35_306],
  ["II:ladies-to-male-same-category", 747],
]);

const SOURCE_ROOT = resolve(
  DATA_DIR,
  "_scratch",
  "mht-cet",
  "official",
  "2026-round-1",
);
const DEFAULT_OFFICIAL_JSONL = join(
  SOURCE_ROOT,
  "cutoffs-year=2026-round=1.jsonl",
);
const DEFAULT_RECONCILIATION_JSON = join(
  SOURCE_ROOT,
  "reconciliation",
  "normalized_cutoffs.json",
);
const DEFAULT_SOURCE_PDF = join(SOURCE_ROOT, "cutoffs", "2026-cap1.pdf");

const ReconciliationRecord = z.object({
  id: z.string().min(1),
  college_code: z.string().min(1),
  college_name: z.string().min(1),
  course_code: z.string().regex(/^\d{10}[A-Z]{0,2}$/),
  course_name: z.string().min(1),
  category: z.string().min(1),
  seat_allocation_section: z.enum([
    "HOME_TO_HOME",
    "HOME_TO_OTHER",
    "OTHER_TO_OTHER",
    "OTHER_TO_HOME",
    "STATE_LEVEL",
    "MAHARASHTRA_STATE",
  ]),
  cutoff_score: z.number().min(0).max(100),
  last_rank: z.number().int().positive(),
  total_admitted: z.number().int().positive(),
  status: z.string().min(1),
  home_university: z.string().min(1),
  institute_home_university_id: z.string().regex(/^[a-z0-9-]+$/),
  affiliating_university_id: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .nullable(),
  minority_community_id: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .nullable(),
  source_pdf: z.string().min(1),
  source_page: z.number().int().positive(),
  source_serial_no: z.number().int().positive(),
  source_pdf_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  source_index_url: z.string().url(),
});
type ReconciliationRecord = z.infer<typeof ReconciliationRecord>;

const ReconciliationPayload = z.object({
  summary: z.object({
    normalized_database_rows: z.literal(EXPECTED_BASE_KEYS),
    normalized_admitted_seats: z.number().int().positive(),
    new_institute_codes: z.array(z.string().regex(/^\d{5}$/)).length(12),
  }),
  records: z.array(ReconciliationRecord).length(EXPECTED_BASE_KEYS),
});

const InstituteAddition = z.object({
  institute_code: z.string().regex(/^\d{5}$/),
  district: z.string().min(1),
  source_locator: z.string().url(),
});
type InstituteAddition = z.infer<typeof InstituteAddition>;

type OfficialRow = z.infer<typeof OfficialCutoff>;

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(path: string): Promise<string> {
  return sha256(await readFile(path));
}

function normalizeCategory(sourceCode: string): string {
  return sourceCode === "ORPHANI" || sourceCode === "ORPHANN"
    ? "ORPHAN"
    : sourceCode;
}

function cutoffKey(value: {
  institute_code: string;
  choice_code: string;
  source_category_code: string;
  source_allocation_section: string;
}): string {
  return [
    value.institute_code,
    value.choice_code,
    value.source_category_code,
    value.source_allocation_section,
  ].join(":");
}

function reconciliationKey(row: ReconciliationRecord): string {
  return cutoffKey({
    institute_code: row.college_code.padStart(5, "0"),
    choice_code: row.course_code,
    source_category_code: row.category,
    source_allocation_section: row.seat_allocation_section,
  });
}

function minorityReconciliationKey(value: {
  instituteCode: string;
  choiceCode: string;
  rank: number;
  percentile: number;
}): string {
  return [
    value.instituteCode,
    value.choiceCode,
    value.rank,
    value.percentile.toFixed(7),
  ].join(":");
}

function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replaceAll("&", " and ")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
  if (!slug) throw new Error(`cannot derive program ID from ${value}`);
  return slug;
}

function normalizeProgramName(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();
}

async function historicalProgramMaps(): Promise<{
  byChoiceCode: Map<string, string>;
  byProgramName: Map<string, string>;
}> {
  const byChoiceCode = new Map<string, string>();
  const idsByProgramName = new Map<string, Set<string>>();
  for (const year of [2024, 2025]) {
    const rounds = year === 2024 ? 3 : 4;
    for (let round = 1; round <= rounds; round += 1) {
      const path = resolve(
        DATA_DIR,
        "datasets",
        "engineering",
        "mht-cet",
        "maharashtra-cap",
        "cutoffs",
        `year=${year}`,
        `round=${round}`,
        "cutoffs.parquet",
      );
      for (const raw of await readParquetRows(path)) {
        const parsed = MhtCetCutoffRowSchema.parse(
          Object.fromEntries(
            Object.entries(raw).map(([key, value]) => [
              key,
              typeof value === "bigint" ? Number(value) : value,
            ]),
          ),
        );
        // Years are read oldest-to-newest, so the latest official mapping wins
        // when a stable choice code's displayed program name was revised.
        byChoiceCode.set(parsed.choice_code, parsed.program_id);
        const name = normalizeProgramName(parsed.program_name);
        const ids = idsByProgramName.get(name) ?? new Set<string>();
        ids.add(parsed.program_id);
        idsByProgramName.set(name, ids);
      }
    }
  }
  const byProgramName = new Map<string, string>();
  for (const [name, ids] of idsByProgramName) {
    if (ids.size === 1) byProgramName.set(name, Array.from(ids)[0]);
  }
  return { byChoiceCode, byProgramName };
}

async function instituteReferences(
  rows: ReconciliationRecord[],
): Promise<MhtCetInstituteReference[]> {
  const historical = await Promise.all(
    [2024, 2025].map((year) =>
      readJsonArray(
        resolve(
          DATA_DIR,
          "reference",
          "engineering",
          "mht-cet",
          `institutes-${year}.json`,
        ),
        MhtCetInstituteReferenceSchema,
      ),
    ),
  );
  const districtByCode = new Map<string, string>();
  const historicalByCode = new Map<string, MhtCetInstituteReference>();
  for (const references of historical) {
    for (const reference of references) {
      districtByCode.set(reference.institute_code, reference.district);
      historicalByCode.set(reference.institute_code, reference);
    }
  }
  const additions = await readJsonArray(
    resolve(
      DATA_DIR,
      "reference",
      "engineering",
      "mht-cet",
      "institute-additions-2026.json",
    ),
    InstituteAddition,
  );
  const additionByCode = new Map<string, InstituteAddition>();
  for (const addition of additions) {
    if (additionByCode.has(addition.institute_code)) {
      throw new Error(
        `duplicate 2026 institute addition ${addition.institute_code}`,
      );
    }
    additionByCode.set(addition.institute_code, addition);
    districtByCode.set(addition.institute_code, addition.district);
  }

  const metadataByCode = new Map<string, ReconciliationRecord>();
  for (const row of rows) {
    const code = row.college_code.padStart(5, "0");
    const existing = metadataByCode.get(code);
    if (existing) {
      const fields = [
        "college_name",
        "institute_home_university_id",
        "affiliating_university_id",
        "minority_community_id",
      ] as const;
      for (const field of fields) {
        if (existing[field] !== row[field]) {
          throw new Error(
            `2026 institute ${code} has inconsistent ${field} metadata`,
          );
        }
      }
      continue;
    }
    metadataByCode.set(code, row);
  }
  if (metadataByCode.size !== EXPECTED_INSTITUTES) {
    throw new Error(
      `expected ${EXPECTED_INSTITUTES} 2026 institutes, found ${metadataByCode.size}`,
    );
  }

  const missingHistorical = Array.from(metadataByCode.keys())
    .filter(
      (code) =>
        !historical.some((references) =>
          references.some((reference) => reference.institute_code === code),
        ),
    )
    .sort();
  const additionCodes = Array.from(additionByCode.keys()).sort();
  if (JSON.stringify(missingHistorical) !== JSON.stringify(additionCodes)) {
    throw new Error(
      `2026 institute additions do not exactly cover new codes: expected ${missingHistorical.join(", ")}, found ${additionCodes.join(", ")}`,
    );
  }

  return Array.from(metadataByCode.entries())
    .map(([code, metadata]) => {
      const district = districtByCode.get(code);
      if (!district) throw new Error(`missing official district for ${code}`);
      return MhtCetInstituteReferenceSchema.parse({
        schema_version: 1,
        year: YEAR,
        institute_id: `mht-institute-${code}`,
        institute_code: code,
        institute_name: metadata.college_name,
        institute_type:
          historicalByCode.get(code)?.institute_type ?? metadata.status,
        district,
        home_university_id: metadata.institute_home_university_id,
        affiliating_university_id:
          metadata.affiliating_university_id ??
          metadata.institute_home_university_id,
        minority_community_id: metadata.minority_community_id,
        source_id: "mht-cet.2026.institutes",
        source_locator: `https://fe2026.mahacet.org/StaticPages/frmInstituteSummary?InstituteCode=${code}`,
      });
    })
    .sort((left, right) =>
      left.institute_code.localeCompare(right.institute_code),
    );
}

function normalizeOfficialRows(options: {
  officialRows: OfficialRow[];
  reconciliationRows: ReconciliationRecord[];
  institutes: MhtCetInstituteReference[];
  poolByCode: Map<string, MhtCetSeatPoolDefinition>;
  programByChoiceCode: Map<string, string>;
  programByName: Map<string, string>;
  snapshotSha256: string;
}): MhtCetCutoffRow[] {
  const reconciliationByKey = new Map<string, ReconciliationRecord>();
  const minorityByRank = new Map<string, ReconciliationRecord>();
  for (const row of options.reconciliationRows) {
    const key = reconciliationKey(row);
    if (reconciliationByKey.has(key)) {
      throw new Error(`duplicate reconciliation cutoff ${key}`);
    }
    reconciliationByKey.set(key, row);
    if (row.category === "MI") {
      const minorityKey = minorityReconciliationKey({
        instituteCode: row.college_code.padStart(5, "0"),
        choiceCode: row.course_code,
        rank: row.last_rank,
        percentile: row.cutoff_score,
      });
      if (minorityByRank.has(minorityKey)) {
        throw new Error(`duplicate minority reconciliation ${minorityKey}`);
      }
      minorityByRank.set(minorityKey, row);
    }
  }
  const instituteByCode = new Map(
    options.institutes.map((institute) => [
      institute.institute_code,
      institute,
    ]),
  );
  const stageRegistry = loadMhtCetStageRuleRegistry(YEAR);
  const stageRowIndexes = new Map<string, number>();
  const baseKeys = new Set<string>();
  const reconciledBaseKeys = new Set<string>();
  const stageCounts = new Map<string, number>();
  const baseKeyCounts = new Map<string, number>();
  const normalized: MhtCetCutoffRow[] = [];

  for (const source of options.officialRows) {
    const sourceCategoryCode = normalizeCategory(source.source_category_code);
    let sourceAllocationSection = source.source_allocation_section;
    if (sourceCategoryCode === "MI") {
      const reconciliation = minorityByRank.get(
        minorityReconciliationKey({
          instituteCode: source.institute_code,
          choiceCode: source.choice_code,
          rank: source.closing_rank,
          percentile: source.closing_percentile,
        }),
      );
      if (!reconciliation) {
        throw new Error(
          `minority cutoff has no exact allotment reconciliation: ${source.institute_code}/${source.choice_code}`,
        );
      }
      sourceAllocationSection = reconciliation.seat_allocation_section;
    }
    const baseKey = cutoffKey({
      institute_code: source.institute_code,
      choice_code: source.choice_code,
      source_category_code: sourceCategoryCode,
      source_allocation_section: sourceAllocationSection,
    });
    const reconciliation = reconciliationByKey.get(baseKey);
    if (!reconciliation) {
      throw new Error(
        `official cutoff has no allotment reconciliation: ${baseKey}`,
      );
    }
    // Multi-stage cells can carry distinct cutoffs. The independently
    // derived allotment cutoff must match at least one stage for the key.
    const matchesReconciliation =
      reconciliation.last_rank === source.closing_rank &&
      reconciliation.cutoff_score === source.closing_percentile;
    if (matchesReconciliation) {
      reconciledBaseKeys.add(baseKey);
    }
    const pool = options.poolByCode.get(sourceCategoryCode);
    if (!pool || (pool.observed_years && !pool.observed_years.includes(YEAR))) {
      throw new Error(`unknown 2026 seat pool ${sourceCategoryCode}`);
    }
    const stageRule = mhtCetStageRuleBySourceLabel(
      stageRegistry,
      source.source_stage_label,
    );
    if (stageRule.semantics_id !== source.stage_semantics_id) {
      throw new Error(
        `stage semantics mismatch for ${source.source_stage_label}`,
      );
    }
    const stagePoolError = validateMhtCetStagePoolCombination(stageRule, pool);
    if (stagePoolError) throw new Error(stagePoolError);
    if (!pool.predictable) {
      throw new Error(
        `2026 source contains excluded pool ${sourceCategoryCode}`,
      );
    }
    const institute = instituteByCode.get(source.institute_code);
    if (!institute) {
      throw new Error(`missing 2026 institute ${source.institute_code}`);
    }
    const programId =
      options.programByChoiceCode.get(source.choice_code) ??
      options.programByName.get(normalizeProgramName(source.program_name)) ??
      slugify(source.program_name);
    const row = MhtCetCutoffRowSchema.parse({
      schema_version: 3,
      exam_id: "mht-cet",
      counselling_id: "maharashtra-cap",
      year: YEAR,
      round: ROUND,
      institute_id: institute.institute_id,
      institute_code: source.institute_code,
      source_institute_name: source.institute_name,
      offering_id: `mht-choice-${source.choice_code.toLowerCase()}`,
      choice_code: source.choice_code,
      program_id: programId,
      program_name: source.program_name,
      source_program_name: source.program_name,
      seat_pool_id: pool.id,
      source_category_code: sourceCategoryCode,
      source_stage_label: source.source_stage_label,
      source_stage_sequence: source.source_stage_sequence,
      stage_semantics_id: source.stage_semantics_id,
      source_seat_scope_id: sourceSeatScope(sourceAllocationSection),
      effective_allocation_scope_id: effectiveAllocationScope(
        sourceAllocationSection,
      ),
      source_allocation_section: sourceAllocationSection,
      closing_rank: source.closing_rank,
      closing_percentile: source.closing_percentile,
      total_admitted: null,
      source_id: source.source_id,
      source_locator: source.source_locator,
      source_table: "cutoffs-year=2026-round=1.jsonl",
      source_row_id: stableOfficialRowId({
        ...source,
        source_category_code: sourceCategoryCode,
        source_allocation_section: sourceAllocationSection,
      }),
      snapshot_sha256: options.snapshotSha256,
    });
    const stageKey = [
      baseKey,
      row.source_stage_label,
      row.source_stage_sequence,
      row.stage_semantics_id,
    ].join(":");
    const existingIndex = stageRowIndexes.get(stageKey);
    if (existingIndex !== undefined) {
      const existing = normalized[existingIndex];
      const existingMatchesReconciliation =
        existing.closing_rank === reconciliation.last_rank &&
        existing.closing_percentile === reconciliation.cutoff_score;
      if (existingMatchesReconciliation === matchesReconciliation) {
        throw new Error(
          `ambiguous normalized official stage-cell collision ${stageKey}`,
        );
      }
      if (matchesReconciliation) normalized[existingIndex] = row;
      continue;
    }
    stageRowIndexes.set(stageKey, normalized.length);
    baseKeys.add(baseKey);
    baseKeyCounts.set(baseKey, (baseKeyCounts.get(baseKey) ?? 0) + 1);
    const stageCountKey = `${row.source_stage_label}:${row.stage_semantics_id}`;
    stageCounts.set(stageCountKey, (stageCounts.get(stageCountKey) ?? 0) + 1);
    normalized.push(row);
  }

  if (
    normalized.length !== EXPECTED_PUBLISHED_ROWS ||
    baseKeys.size !== EXPECTED_BASE_KEYS
  ) {
    throw new Error(
      `2026 accounting mismatch: ${normalized.length} stage rows/${baseKeys.size} base keys`,
    );
  }
  const multiStageKeys = Array.from(baseKeyCounts.values()).filter(
    (count) => count > 1,
  ).length;
  if (multiStageKeys !== EXPECTED_MULTI_STAGE_KEYS) {
    throw new Error(
      `expected ${EXPECTED_MULTI_STAGE_KEYS} multi-stage keys, found ${multiStageKeys}`,
    );
  }
  for (const [stage, expected] of EXPECTED_STAGE_COUNTS) {
    if (stageCounts.get(stage) !== expected) {
      throw new Error(
        `expected ${expected} ${stage} rows, found ${stageCounts.get(stage) ?? 0}`,
      );
    }
  }
  if (stageCounts.size !== EXPECTED_STAGE_COUNTS.size) {
    throw new Error(
      `unexpected 2026 stage semantics: ${Array.from(stageCounts.keys()).join(", ")}`,
    );
  }
  const reconciliationKeys = new Set(reconciliationByKey.keys());
  if (
    baseKeys.size !== reconciliationKeys.size ||
    Array.from(baseKeys).some((key) => !reconciliationKeys.has(key))
  ) {
    throw new Error(
      "official cutoff base keys do not exactly match allotment-derived cutoffs",
    );
  }
  if (
    reconciledBaseKeys.size !== baseKeys.size ||
    Array.from(baseKeys).some((key) => !reconciledBaseKeys.has(key))
  ) {
    throw new Error(
      "one or more official cutoff groups do not match any allotment-derived stage value",
    );
  }
  return normalized.sort((left, right) =>
    [
      left.institute_code,
      left.choice_code,
      left.seat_pool_id,
      left.source_allocation_section,
      left.source_stage_sequence,
      left.source_stage_label,
    ]
      .join(":")
      .localeCompare(
        [
          right.institute_code,
          right.choice_code,
          right.seat_pool_id,
          right.source_allocation_section,
          right.source_stage_sequence,
          right.source_stage_label,
        ].join(":"),
      ),
  );
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "official-jsonl": { type: "string", default: DEFAULT_OFFICIAL_JSONL },
      "reconciliation-json": {
        type: "string",
        default: DEFAULT_RECONCILIATION_JSON,
      },
      "source-pdf": { type: "string", default: DEFAULT_SOURCE_PDF },
      publish: { type: "boolean", default: false },
    },
  });
  const officialJsonlPath = resolve(values["official-jsonl"]);
  const reconciliationJsonPath = resolve(values["reconciliation-json"]);
  const sourcePdfPath = resolve(values["source-pdf"]);
  const officialRows = await readJsonLines(officialJsonlPath, OfficialCutoff);
  const reconciliation = ReconciliationPayload.parse(
    JSON.parse(await readFile(reconciliationJsonPath, "utf-8")),
  );
  if (officialRows.length !== EXPECTED_EXTRACTED_ROWS) {
    throw new Error(
      `expected ${EXPECTED_EXTRACTED_ROWS} extracted official rows, found ${officialRows.length}`,
    );
  }
  const choiceCodes = new Set(officialRows.map((row) => row.choice_code));
  if (choiceCodes.size !== EXPECTED_CHOICE_CODES) {
    throw new Error(
      `expected ${EXPECTED_CHOICE_CODES} choice codes, found ${choiceCodes.size}`,
    );
  }
  const institutes = await instituteReferences(reconciliation.records);
  const programs = await historicalProgramMaps();
  const seatPools = loadMhtCetSeatPoolRegistry();
  const rows = normalizeOfficialRows({
    officialRows,
    reconciliationRows: reconciliation.records,
    institutes,
    poolByCode: new Map(
      seatPools.entries.map((entry) => [entry.source_code, entry]),
    ),
    programByChoiceCode: programs.byChoiceCode,
    programByName: programs.byProgramName,
    snapshotSha256: await sha256File(officialJsonlPath),
  });
  const sourcePdfSha256 = await sha256File(sourcePdfPath);
  if (
    sourcePdfSha256 !==
    "c8e0b040da945bf58a28b22221946b2b1b0cbc5065d30b0f6867919c552fe1f3"
  ) {
    throw new Error(
      `unexpected 2026 CAP Round I PDF SHA-256 ${sourcePdfSha256}`,
    );
  }
  console.log(
    `2026 CAP Round I audit: ${rows.length} official stage cells, ${EXPECTED_BASE_KEYS} reconciled cutoff groups, ${institutes.length} institutes`,
  );
  if (!values.publish) {
    console.log("Dry run complete; pass --publish to write eJAM data outputs");
    return;
  }

  const auditRoot = resolve(
    DATA_DIR,
    "_scratch",
    "mht-cet",
    "normalization",
    "official-2026-round-1",
  );
  const normalizedJsonlPath = join(
    auditRoot,
    "cutoffs-year=2026-round=1.jsonl",
  );
  await mkdir(dirname(normalizedJsonlPath), { recursive: true });
  await writeFile(
    normalizedJsonlPath,
    `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`,
  );
  const outputPath = resolve(
    DATA_DIR,
    "datasets",
    "engineering",
    "mht-cet",
    "maharashtra-cap",
    "cutoffs",
    "year=2026",
    "round=1",
    "cutoffs.parquet",
  );
  await parquetFromJsonLines(normalizedJsonlPath, outputPath);
  await writeFile(
    resolve(
      DATA_DIR,
      "reference",
      "engineering",
      "mht-cet",
      "institutes-2026.json",
    ),
    `${JSON.stringify(institutes, null, 2)}\n`,
  );
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
  await writeFile(
    resolve(
      DATA_DIR,
      "reference",
      "engineering",
      "mht-cet",
      "official-extraction-2026.json",
    ),
    `${JSON.stringify(
      {
        schema_version: 1,
        source: {
          source_id: "mht-cet.2026.cap1",
          url: "https://cappublicdocs2026.blob.core.windows.net/documents/2026ENGG_CAP1_MH_CutOff_V1.pdf",
          local_path: "cutoffs/2026-cap1.pdf",
          sha256: sourcePdfSha256,
        },
        parser: {
          id: "mht-cet-cutoff-extractor-v2",
          sha256: await sha256File(parserPath),
        },
        reconciliation: {
          source: "380 official institute-wise CAP Round I allotment PDFs",
          source_index_url:
            "https://fe2026.mahacet.org/StaticPages/frmInstituteWiseAllotmentList?did=2021",
          normalized_cutoffs_sha256: await sha256File(reconciliationJsonPath),
          extracted_official_stage_rows: officialRows.length,
          published_stage_rows: rows.length,
          reconciled_base_keys: EXPECTED_BASE_KEYS,
          multi_stage_keys: EXPECTED_MULTI_STAGE_KEYS,
          institute_count: institutes.length,
          choice_code_count: choiceCodes.size,
        },
        normalizations: [
          "ORPHANI and ORPHANN are normalized to ORPHAN",
          "Minority seat allocation scope is reconciled to the parent section retained by institute allotment PDFs",
        ],
        predictor_training_policy:
          "The target-2026 predictor index remains trained on 2024-2025 only; actual 2026 rows are published as observed evidence without target leakage.",
      },
      null,
      2,
    )}\n`,
  );
  console.log(`Published ${rows.length} rows to ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
