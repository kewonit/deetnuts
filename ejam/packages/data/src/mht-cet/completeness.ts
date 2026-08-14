import { isMhtCetSeatPoolEligible, seatPoolMap } from "./eligibility";
import {
  isMhtCetMinorityCommunityEligible2026,
  MHT_CET_HOME_UNIVERSITIES_2026,
  MHT_CET_MINORITY_COMMUNITIES_2026,
  MHT_CET_PWD_CATEGORIES_2026,
} from "./eligibility-rules";
import type {
  MhtCetCutoffRow,
  MhtCetPredictionInput,
  MhtCetPredictorIndexRow,
  MhtCetSeatPoolDefinition,
  MhtCetSeatPoolRegistry,
} from "./schema";
import {
  loadMhtCetAllocationRuleRegistry,
  loadMhtCetStageRuleRegistry,
  mhtCetAllocationRuleBySemantics,
  mhtCetStageRuleBySemantics,
} from "./stage-rules";

const ROUNDS = [1, 2, 3, 4] as const;

function channelKey(value: {
  institute_code: string;
  choice_code: string;
  seat_pool_id: string;
  source_seat_scope_id: string;
  stage_semantics_id: string;
  allocation_scope_id?: string;
  effective_allocation_scope_id?: string;
}): string {
  return [
    value.institute_code,
    value.choice_code,
    value.seat_pool_id,
    value.source_seat_scope_id,
    value.allocation_scope_id ?? value.effective_allocation_scope_id,
    value.stage_semantics_id,
  ].join(":");
}

function pointKey(
  value: Parameters<typeof channelKey>[0],
  round: number,
): string {
  return `${channelKey(value)}:${round}`;
}

function witnessInput(
  row: MhtCetPredictorIndexRow,
  pool: MhtCetSeatPoolDefinition,
): MhtCetPredictionInput {
  const rule = mhtCetStageRuleBySemantics(
    loadMhtCetStageRuleRegistry(row.latest_year),
    row.stage_semantics_id,
  );
  mhtCetAllocationRuleBySemantics(
    loadMhtCetAllocationRuleRegistry(row.rules_year),
    row.stage_semantics_id,
  );
  const otherHome = MHT_CET_HOME_UNIVERSITIES_2026.find(
    (entry) => entry.id !== row.home_university_id,
  )?.id;
  if (!otherHome)
    throw new Error("MHT-CET completeness needs two universities");
  const category =
    rule.effect.category_policy === "any"
      ? "open"
      : (pool.category_id ?? "open");
  const input: MhtCetPredictionInput = {
    rank: 1,
    candidature_type_id: "type-a",
    category_id: category,
    ladies_seat_eligible:
      rule.effect.ladies_policy === "source" && pool.ladies_seat,
    home_university_id:
      row.allocation_scope_id === "other-university"
        ? otherHome
        : row.home_university_id,
    eligibilities: {
      ews_certificate: false,
      tfws_eligible: false,
      orphan_certificate: false,
    },
    include_all: true,
  };
  if (rule.effect.special_policy === "source") {
    switch (pool.special_eligibility) {
      case "ews":
        input.eligibilities.ews_certificate = true;
        break;
      case "tfws":
        input.eligibilities.tfws_eligible = true;
        break;
      case "pwd":
        input.eligibilities.pwd_category_id = MHT_CET_PWD_CATEGORIES_2026[0].id;
        break;
      case "defence":
        throw new Error(
          "MHT-CET Defence-reserved channels are intentionally unsupported",
        );
      case "orphan":
        input.eligibilities.orphan_certificate = true;
        break;
      case "minority": {
        const community = MHT_CET_MINORITY_COMMUNITIES_2026.find((entry) =>
          isMhtCetMinorityCommunityEligible2026(
            row.minority_community_id,
            entry.id,
          ),
        );
        if (!community) {
          throw new Error(
            `MHT-CET minority channel has no matching candidate witness: ${channelKey(row)}`,
          );
        }
        input.eligibilities.minority_community_id = community.id;
        break;
      }
      case "none":
        break;
    }
  }
  return input;
}

export function assertMhtCetIndexCompleteness(options: {
  cutoffRows: MhtCetCutoffRow[];
  indexRows: MhtCetPredictorIndexRow[];
  seatPoolRegistry: MhtCetSeatPoolRegistry;
  latestYear: number;
}): {
  officialStagePoints: number;
  indexChannels: number;
  eligibilityWitnesses: number;
} {
  const pools = seatPoolMap(options.seatPoolRegistry);
  const officialPoints = new Map<string, MhtCetCutoffRow>();
  for (const cutoff of options.cutoffRows) {
    if (cutoff.year !== options.latestYear) continue;
    const pool = pools.get(cutoff.seat_pool_id);
    if (!pool?.predictable) continue;
    const key = pointKey(cutoff, cutoff.round);
    if (officialPoints.has(key)) {
      throw new Error(`duplicate official MHT-CET stage point ${key}`);
    }
    officialPoints.set(key, cutoff);
  }

  const indexByChannel = new Map<string, MhtCetPredictorIndexRow>();
  for (const row of options.indexRows) {
    const key = channelKey(row);
    if (indexByChannel.has(key)) {
      throw new Error(`duplicate MHT-CET index stage channel ${key}`);
    }
    indexByChannel.set(key, row);
  }

  for (const [key, cutoff] of officialPoints) {
    const row = indexByChannel.get(channelKey(cutoff));
    if (!row) throw new Error(`official MHT-CET stage is unreachable: ${key}`);
    const round = cutoff.round as 1 | 2 | 3 | 4;
    const expectedStatus =
      cutoff.closing_rank === null ? "percentile-only" : "rank";
    if (
      row[`round${round}_status`] !== expectedStatus ||
      row[`round${round}_rank`] !== cutoff.closing_rank ||
      row[`round${round}_percentile`] !== cutoff.closing_percentile
    ) {
      throw new Error(`MHT-CET index disagrees with official stage ${key}`);
    }
  }

  let witnesses = 0;
  for (const row of options.indexRows) {
    const pool = pools.get(row.seat_pool_id);
    if (!pool)
      throw new Error(`MHT-CET index has unknown pool ${row.seat_pool_id}`);
    const historicalRule = mhtCetStageRuleBySemantics(
      loadMhtCetStageRuleRegistry(row.latest_year),
      row.stage_semantics_id,
    );
    const unsupportedDefenceChannel =
      pool.special_eligibility === "defence" &&
      historicalRule.effect.special_policy === "source";
    if (
      !unsupportedDefenceChannel &&
      !isMhtCetSeatPoolEligible(witnessInput(row, pool), row, pool)
    ) {
      throw new Error(
        `MHT-CET stage has no eligible generated profile: ${channelKey(row)}`,
      );
    }
    if (!unsupportedDefenceChannel) witnesses += 1;
    for (const round of ROUNDS) {
      const official = officialPoints.get(pointKey(row, round));
      const status = row[`round${round}_status`];
      if ((status !== "not-published") !== (official !== undefined)) {
        throw new Error(
          `MHT-CET round inventory mismatch: ${pointKey(row, round)}`,
        );
      }
    }
  }
  return {
    officialStagePoints: officialPoints.size,
    indexChannels: indexByChannel.size,
    eligibilityWitnesses: witnesses,
  };
}
