import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveRegistryRoot } from "../data-root";
import type {
  MhtCetSeatPoolDefinition,
  MhtCetSpecialEligibility,
} from "./schema";
import {
  type MhtCetAllocationRule,
  MhtCetAllocationRuleRegistry,
  type MhtCetAllocationRuleRegistry as MhtCetAllocationRuleRegistryType,
  type MhtCetStageRule,
  MhtCetStageRuleRegistry,
  type MhtCetStageRuleRegistry as MhtCetStageRuleRegistryType,
  type MhtCetStageSemanticsId,
} from "./stage-schema";

const registryCache = new Map<number, MhtCetStageRuleRegistryType>();
const allocationRegistryCache = new Map<
  number,
  MhtCetAllocationRuleRegistryType
>();

function validateRegistry(
  registry: MhtCetStageRuleRegistryType,
): MhtCetStageRuleRegistryType {
  const ids = new Set<string>();
  const labels = new Set<string>();
  const semantics = new Set<MhtCetStageSemanticsId>();
  for (const rule of registry.entries) {
    if (ids.has(rule.id)) {
      throw new Error(
        `MHT-CET ${registry.source_year} historical stage registry contains duplicate ID ${rule.id}`,
      );
    }
    if (labels.has(rule.source_label)) {
      throw new Error(
        `MHT-CET ${registry.source_year} historical stage registry contains duplicate source label ${rule.source_label}`,
      );
    }
    if (semantics.has(rule.semantics_id)) {
      throw new Error(
        `MHT-CET ${registry.source_year} historical stage registry contains duplicate semantics ${rule.semantics_id}`,
      );
    }
    ids.add(rule.id);
    labels.add(rule.source_label);
    semantics.add(rule.semantics_id);
  }
  return registry;
}

export function loadMhtCetStageRuleRegistry(
  year: number,
): MhtCetStageRuleRegistryType {
  const cached = registryCache.get(year);
  if (cached) return cached;
  const path = resolve(
    resolveRegistryRoot(),
    "engineering",
    "mht-cet",
    `historical-stage-rules-${year}.json`,
  );
  const parsed = MhtCetStageRuleRegistry.safeParse(
    JSON.parse(readFileSync(path, "utf-8")),
  );
  if (!parsed.success) {
    throw new Error(
      `MHT-CET ${year} stage-rule registry failed validation: ${parsed.error.message}`,
    );
  }
  if (parsed.data.source_year !== year) {
    throw new Error(
      `MHT-CET historical stage registry year mismatch: requested ${year}, received ${parsed.data.source_year}`,
    );
  }
  const registry = validateRegistry(parsed.data);
  registryCache.set(year, registry);
  return registry;
}

export function _resetMhtCetStageRuleRegistryCache(): void {
  registryCache.clear();
  allocationRegistryCache.clear();
}

export function mhtCetStageRuleBySourceLabel(
  registry: MhtCetStageRuleRegistryType,
  sourceLabel: string,
): MhtCetStageRule {
  const rule = registry.entries.find(
    (candidate) => candidate.source_label === sourceLabel,
  );
  if (!rule) {
    throw new Error(
      `MHT-CET ${registry.source_year} historical stage registry does not recognize source label ${sourceLabel}`,
    );
  }
  return rule;
}

export function mhtCetStageRuleBySemantics(
  registry: MhtCetStageRuleRegistryType,
  semanticsId: MhtCetStageSemanticsId,
): MhtCetStageRule {
  const rule = registry.entries.find(
    (candidate) => candidate.semantics_id === semanticsId,
  );
  if (!rule) {
    throw new Error(
      `MHT-CET ${registry.source_year} historical stage registry does not support ${semanticsId}`,
    );
  }
  return rule;
}

export function loadMhtCetAllocationRuleRegistry(
  year: number,
): MhtCetAllocationRuleRegistryType {
  const cached = allocationRegistryCache.get(year);
  if (cached) return cached;
  const path = resolve(
    resolveRegistryRoot(),
    "engineering",
    "mht-cet",
    `allocation-rules-${year}.json`,
  );
  const parsed = MhtCetAllocationRuleRegistry.safeParse(
    JSON.parse(readFileSync(path, "utf-8")),
  );
  if (!parsed.success) {
    throw new Error(
      `MHT-CET ${year} allocation-rule registry failed validation: ${parsed.error.message}`,
    );
  }
  if (parsed.data.rules_year !== year) {
    throw new Error(
      `MHT-CET allocation-rule registry year mismatch: requested ${year}, received ${parsed.data.rules_year}`,
    );
  }
  const semantics = new Set<MhtCetStageSemanticsId>();
  for (const entry of parsed.data.entries) {
    for (const semantic of entry.supported_semantics) {
      if (semantics.has(semantic)) {
        throw new Error(
          `MHT-CET ${year} allocation rules map semantic ${semantic} more than once`,
        );
      }
      semantics.add(semantic);
    }
  }
  allocationRegistryCache.set(year, parsed.data);
  return parsed.data;
}

export function mhtCetAllocationRuleBySemantics(
  registry: MhtCetAllocationRuleRegistryType,
  semanticsId: MhtCetStageSemanticsId,
): MhtCetAllocationRule {
  const rule = registry.entries.find((entry) =>
    entry.supported_semantics.includes(semanticsId),
  );
  if (!rule) {
    throw new Error(
      `MHT-CET ${registry.rules_year} allocation rules do not support ${semanticsId}`,
    );
  }
  return rule;
}

function sourceRequirementSatisfied(
  requirement: MhtCetStageRule["source_ladies_requirement"],
  ladiesSeat: boolean,
): boolean {
  if (requirement === "required") return ladiesSeat;
  if (requirement === "forbidden") return !ladiesSeat;
  return true;
}

export function validateMhtCetStagePoolCombination(
  rule: MhtCetStageRule,
  pool: Pick<
    MhtCetSeatPoolDefinition,
    "source_code" | "ladies_seat" | "special_eligibility"
  >,
): string | null {
  if (
    !sourceRequirementSatisfied(
      rule.source_ladies_requirement,
      pool.ladies_seat,
    )
  ) {
    return `${rule.source_label} cannot be applied to ladies_seat=${pool.ladies_seat} pool ${pool.source_code}`;
  }
  if (
    !rule.allowed_source_special_eligibilities.includes(
      pool.special_eligibility as MhtCetSpecialEligibility,
    )
  ) {
    return `${rule.source_label} cannot be applied to ${pool.special_eligibility} pool ${pool.source_code}`;
  }
  return null;
}
