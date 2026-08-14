import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveRegistryRoot } from "../data-root";
import { isMhtCetMinorityCommunityEligible2026 } from "./eligibility-rules";
import {
  type MhtCetPredictionInput,
  type MhtCetPredictorIndexRow,
  type MhtCetSeatPoolDefinition,
  MhtCetSeatPoolRegistry,
  MhtCetSeatPoolRegistryFile,
  type MhtCetSeatPoolRegistry as MhtCetSeatPoolRegistryType,
} from "./schema";
import {
  loadMhtCetAllocationRuleRegistry,
  loadMhtCetStageRuleRegistry,
  mhtCetAllocationRuleBySemantics,
  mhtCetStageRuleBySemantics,
  validateMhtCetStagePoolCombination,
} from "./stage-rules";

let _registryCache: MhtCetSeatPoolRegistryType | null = null;

export function loadMhtCetSeatPoolRegistry(): MhtCetSeatPoolRegistryType {
  if (_registryCache) return _registryCache;
  const path = resolve(
    resolveRegistryRoot(),
    "engineering",
    "mht-cet",
    "seat-pools-2026.json",
  );
  const file = MhtCetSeatPoolRegistryFile.safeParse(
    JSON.parse(readFileSync(path, "utf-8")),
  );
  if (!file.success) {
    throw new Error(
      `MHT-CET seat-pool registry failed validation: ${file.error.message}`,
    );
  }
  const parsed = MhtCetSeatPoolRegistry.safeParse({
    schema_version: file.data.schema_version,
    rules_year: file.data.rules_year,
    source_id: file.data.source_id,
    entries: [
      ...file.data.groups.flatMap((group) =>
        Object.entries(group.codes).flatMap(([allocationScope, codes]) =>
          codes.map((sourceCode) => ({
            id: `mht-${sourceCode.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`,
            source_code: sourceCode,
            label: sourceCode,
            category_id: group.category_id,
            ladies_seat: group.ladies_seat,
            allocation_scope: allocationScope,
            special_eligibility: group.special_eligibility,
            predictable: group.predictable,
            ...(group.exclusion_reason
              ? { exclusion_reason: group.exclusion_reason }
              : {}),
          })),
        ),
      ),
      ...file.data.historical_aliases.map((alias) => ({
        id: `mht-${alias.source_code.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`,
        source_code: alias.source_code,
        label: alias.source_code,
        category_id: alias.category_id,
        ladies_seat: alias.ladies_seat,
        allocation_scope: alias.allocation_scope,
        special_eligibility: alias.special_eligibility,
        predictable: alias.predictable,
        observed_years: alias.observed_years,
      })),
    ],
  });
  if (!parsed.success) {
    throw new Error(
      `Expanded MHT-CET seat-pool registry failed validation: ${parsed.error.message}`,
    );
  }
  const codes = new Set<string>();
  const ids = new Set<string>();
  for (const entry of parsed.data.entries) {
    if (codes.has(entry.source_code)) {
      throw new Error(
        `MHT-CET seat-pool registry contains duplicate source code: ${entry.source_code}`,
      );
    }
    if (ids.has(entry.id)) {
      throw new Error(
        `MHT-CET seat-pool registry contains duplicate id: ${entry.id}`,
      );
    }
    codes.add(entry.source_code);
    ids.add(entry.id);
  }
  _registryCache = parsed.data;
  return parsed.data;
}

export function _resetMhtCetSeatPoolRegistryCache(): void {
  _registryCache = null;
}

export function seatPoolMap(
  registry: MhtCetSeatPoolRegistryType,
): Map<string, MhtCetSeatPoolDefinition> {
  return new Map(registry.entries.map((entry) => [entry.id, entry]));
}

function categoryEligible(
  candidate: MhtCetPredictionInput,
  pool: MhtCetSeatPoolDefinition,
): boolean {
  if (pool.category_id === null) return true;
  if (pool.category_id === "open") return true;
  return pool.category_id === candidate.category_id;
}

function specialEligibilitySatisfied(
  candidate: MhtCetPredictionInput,
  row: MhtCetPredictorIndexRow,
  pool: MhtCetSeatPoolDefinition,
): boolean {
  switch (pool.special_eligibility) {
    case "none":
      return true;
    case "ews":
      return candidate.eligibilities.ews_certificate;
    case "tfws":
      return candidate.eligibilities.tfws_eligible;
    case "pwd":
      return (
        candidate.candidature_type_id !== "type-e" &&
        candidate.eligibilities.pwd_category_id !== undefined &&
        (pool.category_id === "open" ||
          pool.category_id === candidate.category_id)
      );
    case "defence":
      return false;
    case "orphan":
      return candidate.eligibilities.orphan_certificate;
    case "minority":
      return (
        (candidate.candidature_type_id === "type-a" ||
          candidate.candidature_type_id === "type-b") &&
        isMhtCetMinorityCommunityEligible2026(
          row.minority_community_id,
          candidate.eligibilities.minority_community_id,
        )
      );
  }
}

function allocationScopeEligible(
  candidate: MhtCetPredictionInput,
  row: MhtCetPredictorIndexRow,
): boolean {
  if (
    row.allocation_scope_id === "state-level" ||
    row.allocation_scope_id === "maharashtra-state"
  ) {
    return true;
  }

  if (candidate.candidature_type_id === "type-e") {
    return row.allocation_scope_id === "other-university";
  }
  if (!candidate.home_university_id) return false;
  if (row.allocation_scope_id === "home-university") {
    return candidate.home_university_id === row.home_university_id;
  }
  return candidate.home_university_id !== row.home_university_id;
}

export function validateMhtCetEligibilityInput(
  input: MhtCetPredictionInput,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (input.candidature_type_id !== "type-e" && !input.home_university_id) {
    errors.home_university_id =
      "home university is required for Maharashtra candidature types A-D";
  }
  if (input.eligibilities.ews_certificate && input.category_id !== "open") {
    errors["eligibilities.ews_certificate"] =
      "EWS eligibility can only be combined with the open base category";
  }
  if (input.candidature_type_id === "type-e") {
    if (input.home_university_id) {
      errors.home_university_id =
        "type E candidature does not use a home university";
    }
    if (input.eligibilities.pwd_category_id) {
      errors["eligibilities.pwd_category_id"] =
        "PwD reservation requires Maharashtra domicile and is unavailable to type E candidature";
    }
  }
  if (
    input.eligibilities.minority_community_id &&
    input.candidature_type_id !== "type-a" &&
    input.candidature_type_id !== "type-b"
  ) {
    errors["eligibilities.minority_community_id"] =
      "Minority reservation requires Type A or Type B Maharashtra candidature";
  }

  return errors;
}

export function isMhtCetSeatPoolEligible(
  candidate: MhtCetPredictionInput,
  row: MhtCetPredictorIndexRow,
  pool: MhtCetSeatPoolDefinition,
): boolean {
  if (!pool.predictable) return false;
  const historicalRegistry = loadMhtCetStageRuleRegistry(row.latest_year);
  const rule = mhtCetStageRuleBySemantics(
    historicalRegistry,
    row.stage_semantics_id,
  );
  if (rule.source_label !== row.source_stage_label) {
    throw new Error(
      `MHT-CET index stage mismatch: ${row.source_stage_label}/${row.stage_semantics_id}`,
    );
  }
  mhtCetAllocationRuleBySemantics(
    loadMhtCetAllocationRuleRegistry(row.rules_year),
    row.stage_semantics_id,
  );
  const stagePoolError = validateMhtCetStagePoolCombination(rule, pool);
  if (stagePoolError) {
    throw new Error(
      `MHT-CET index has impossible stage/pool row: ${stagePoolError}`,
    );
  }
  if (
    rule.effect.ladies_policy === "source" &&
    pool.ladies_seat &&
    !candidate.ladies_seat_eligible
  ) {
    return false;
  }
  if (
    rule.effect.ladies_policy === "non-ladies-only" &&
    candidate.ladies_seat_eligible
  ) {
    return false;
  }
  if (
    rule.effect.category_policy === "source" &&
    !categoryEligible(candidate, pool)
  ) {
    return false;
  }
  if (
    rule.effect.special_policy === "source" &&
    !specialEligibilitySatisfied(candidate, row, pool)
  ) {
    return false;
  }
  return allocationScopeEligible(candidate, row);
}
