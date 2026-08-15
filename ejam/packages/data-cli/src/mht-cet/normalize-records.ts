import {
  type MhtCetCutoffRow,
  MhtCetCutoffRow as MhtCetCutoffRowSchema,
  type MhtCetInstituteReference,
  type MhtCetSeatPoolDefinition,
  type MhtCetStageRule,
  type MhtCetStageRuleRegistry,
  mhtCetStageRuleBySourceLabel,
  validateMhtCetStagePoolCombination,
} from "@ejam/data/mht-cet";
import {
  cutoffKey,
  cutoffStageKey,
  decimal,
  effectiveAllocationScope,
  integer,
  type OfficialCutoffRow,
  type OfficialProgram,
  type RawCutoff,
  sourceSeatScope,
  stableOfficialRowId,
  stableSourceRowId,
  text,
  twoDecimalAgreement,
} from "./normalize-support.js";
import {
  canonicalRowsSha256,
  type MhtCetCutoffSourceSpec,
} from "./source-spec.js";

export type Classification = "published" | "excluded-by-scope" | "quarantined";

export type AuditReason = {
  table: string;
  classification: Classification;
  reason: string;
  stable_row_id: string;
  matched_official_stage_ids?: string[];
};

type SharedOptions = {
  source: MhtCetCutoffSourceSpec;
  poolByCode: Map<string, MhtCetSeatPoolDefinition>;
  stageRegistry: MhtCetStageRuleRegistry;
};

function poolObservedInYear(
  pool: MhtCetSeatPoolDefinition,
  year: number,
): boolean {
  return !pool.observed_years || pool.observed_years.includes(year);
}

export function normalizeOfficialRows(
  options: SharedOptions & {
    officialRows: OfficialCutoffRow[];
    instituteReferences: Map<string, MhtCetInstituteReference>;
    programs: Map<string, OfficialProgram>;
  },
): {
  rows: MhtCetCutoffRow[];
  audit: AuditReason[];
  canonicalSha256: string;
} {
  const canonicalSha256 = canonicalRowsSha256(
    options.officialRows as Array<Record<string, unknown>>,
  );
  const seen = new Set<string>();
  const rows: MhtCetCutoffRow[] = [];
  const audit: AuditReason[] = [];

  for (const official of options.officialRows) {
    const key = cutoffStageKey(official);
    const stableRowId = stableOfficialRowId(official);
    const classify = (
      reason: string,
      classification: Classification = "quarantined",
    ) => {
      audit.push({
        table: official.source_id,
        classification,
        reason,
        stable_row_id: stableRowId,
      });
    };
    if (seen.has(key)) {
      classify(`duplicate official cutoff key ${key}`);
      continue;
    }
    seen.add(key);
    const pool = options.poolByCode.get(official.source_category_code);
    if (!pool || !poolObservedInYear(pool, official.year)) {
      classify(`unknown seat-pool code ${official.source_category_code}`);
      continue;
    }
    let stageRule: MhtCetStageRule;
    try {
      stageRule = mhtCetStageRuleBySourceLabel(
        options.stageRegistry,
        official.source_stage_label,
      );
    } catch (error) {
      classify(error instanceof Error ? error.message : String(error));
      continue;
    }
    if (stageRule.semantics_id !== official.stage_semantics_id) {
      classify(
        `stage semantics mismatch for ${official.source_stage_label}: extractor=${official.stage_semantics_id}, registry=${stageRule.semantics_id}`,
      );
      continue;
    }
    const stagePoolError = validateMhtCetStagePoolCombination(stageRule, pool);
    if (stagePoolError) {
      classify(stagePoolError);
      continue;
    }
    if (!pool.predictable) {
      classify(
        pool.exclusion_reason ?? "excluded seat pool",
        "excluded-by-scope",
      );
      continue;
    }
    const institute = options.instituteReferences.get(
      `${official.year}:${official.institute_code}`,
    );
    const program = options.programs.get(
      `${official.year}:${official.institute_code}:${official.choice_code}`,
    );
    if (!institute || !program) {
      classify(
        `missing official code-based institute/program reference ${official.year}:${official.institute_code}:${official.choice_code}`,
      );
      continue;
    }
    if (
      program.home_university_id !== institute.home_university_id ||
      program.minority_community_id !== institute.minority_community_id
    ) {
      classify(
        `official program metadata disagrees with institute reference ${official.year}:${official.institute_code}:${official.choice_code}`,
      );
      continue;
    }
    rows.push(
      MhtCetCutoffRowSchema.parse({
        schema_version: 3,
        exam_id: "mht-cet",
        counselling_id: "maharashtra-cap",
        year: official.year,
        round: official.round,
        institute_id: institute.institute_id,
        institute_code: official.institute_code,
        source_institute_name: official.institute_name,
        offering_id: program.offering_id,
        choice_code: official.choice_code,
        program_id: program.program_id,
        program_name: program.program_name,
        source_program_name: official.program_name,
        seat_pool_id: pool.id,
        source_category_code: official.source_category_code,
        source_stage_label: official.source_stage_label,
        source_stage_sequence: official.source_stage_sequence,
        stage_semantics_id: official.stage_semantics_id,
        source_seat_scope_id: sourceSeatScope(
          official.source_allocation_section,
        ),
        effective_allocation_scope_id: effectiveAllocationScope(
          official.source_allocation_section,
        ),
        source_allocation_section: official.source_allocation_section,
        closing_rank:
          official.closing_rank === 0 ? null : official.closing_rank,
        closing_percentile: official.closing_percentile,
        total_admitted: null,
        source_id: official.source_id,
        source_locator: official.source_locator,
        source_table: `cutoffs-year=${official.year}-round=${official.round}.jsonl`,
        source_row_id: stableRowId,
        snapshot_sha256: canonicalSha256,
      }),
    );
    classify("official row validated", "published");
  }
  return { rows, audit, canonicalSha256 };
}

const ALLOCATION_SECTIONS = new Set([
  "HOME_TO_HOME",
  "HOME_TO_OTHER",
  "OTHER_TO_HOME",
  "OTHER_TO_OTHER",
  "STATE_LEVEL",
  "MAHARASHTRA_STATE",
]);

export function classifyStagingRows(
  options: SharedOptions & {
    rawRows: RawCutoff[];
    officialRows: OfficialCutoffRow[];
  },
): AuditReason[] {
  const officialByKey = new Map<string, OfficialCutoffRow[]>();
  for (const row of options.officialRows) {
    const key = cutoffKey(row);
    const existing = officialByKey.get(key);
    if (existing) existing.push(row);
    else officialByKey.set(key, [row]);
  }
  const seen = new Set<string>();
  const audit: AuditReason[] = [];

  for (const row of options.rawRows) {
    const stableRowId = stableSourceRowId(row);
    const sourceCategoryCode = text(row.category);
    const pool = options.poolByCode.get(sourceCategoryCode);
    const classify = (
      reason: string,
      classification: Classification = "quarantined",
    ) => {
      audit.push({
        table: options.source.table,
        classification,
        reason,
        stable_row_id: stableRowId,
      });
    };
    if (!pool || !poolObservedInYear(pool, options.source.year)) {
      classify(`unknown seat-pool code ${sourceCategoryCode}`);
      continue;
    }
    if (!pool.predictable) {
      classify(
        pool.exclusion_reason ?? "excluded seat pool",
        "excluded-by-scope",
      );
      continue;
    }
    const instituteCode = text(row.college_code).padStart(5, "0");
    const choiceCode = text(row.course_code);
    const allocationSection = text(row.seat_allocation_section);
    const rank = integer(row.last_rank);
    const percentile = decimal(row.cutoff_score);
    if (
      !/^\d{5}$/.test(instituteCode) ||
      !/^\d{10}[A-Z]{0,2}$/.test(choiceCode) ||
      !ALLOCATION_SECTIONS.has(allocationSection) ||
      rank === null ||
      rank < 0 ||
      percentile === null ||
      percentile < 0 ||
      percentile > 100
    ) {
      classify("invalid code, allocation, rank, or percentile");
      continue;
    }
    const key = cutoffKey({
      year: options.source.year,
      round: options.source.round,
      institute_code: instituteCode,
      choice_code: choiceCode,
      source_category_code: sourceCategoryCode,
      source_allocation_section: allocationSection,
    });
    if (seen.has(key)) {
      classify(`duplicate staging cutoff key ${key}`);
      continue;
    }
    seen.add(key);
    const officialCandidates = officialByKey.get(key);
    if (!officialCandidates) {
      classify(`missing official cutoff key ${key}`);
      continue;
    }
    const metricMatches = officialCandidates.filter(
      (official) =>
        official.closing_rank === rank &&
        twoDecimalAgreement(percentile, official.closing_percentile),
    );
    if (metricMatches.length === 0) {
      const officialMetrics = officialCandidates
        .map(
          (official) =>
            `${official.source_stage_label}@${official.source_stage_sequence}=${official.closing_rank}/${official.closing_percentile}`,
        )
        .join(", ");
      classify(
        `official metric mismatch ${key}: staging=${rank}/${percentile}, official stages=[${officialMetrics}]`,
      );
      continue;
    }
    audit.push({
      table: options.source.table,
      classification: "published",
      reason: "official key and metrics agree",
      stable_row_id: stableRowId,
      matched_official_stage_ids: metricMatches.map(stableOfficialRowId).sort(),
    });
  }
  return audit;
}
