import type { MhtCetRoundMatch } from "./result-schema";
import type {
  MhtCetPredictorIndexRow,
  MhtCetSeatPoolDefinition,
} from "./schema";
import {
  mhtCetEffectiveEligibilityDescription,
  mhtCetStageDescription,
} from "./stage-descriptions";
import {
  loadMhtCetAllocationRuleRegistry,
  mhtCetAllocationRuleBySemantics,
} from "./stage-rules";

export type MhtCetRoundNumber = 1 | 2 | 3 | 4;

export type MhtCetRoundCandidate = {
  row: MhtCetPredictorIndexRow;
  round: MhtCetRoundNumber;
  probability: number;
  predictedClosingRank: number;
  latestHistoricalPercentile: number | null;
  dataQuality: "inferred" | "pooled";
};

export function apiMhtCetRoundMatch(
  candidate: MhtCetRoundCandidate | null,
  pools: Map<string, MhtCetSeatPoolDefinition>,
): MhtCetRoundMatch | null {
  if (!candidate) return null;
  const pool = pools.get(candidate.row.seat_pool_id);
  if (!pool) {
    throw new Error(
      `MHT-CET round candidate references unknown pool: ${candidate.row.seat_pool_id}`,
    );
  }
  const activeRule = mhtCetAllocationRuleBySemantics(
    loadMhtCetAllocationRuleRegistry(candidate.row.rules_year),
    candidate.row.stage_semantics_id,
  );
  return {
    probability: candidate.probability,
    predicted_closing_rank: candidate.predictedClosingRank,
    latest_historical_percentile: candidate.latestHistoricalPercentile,
    seat_pool_id: pool.id,
    source_code: pool.source_code,
    source_seat_scope_id: candidate.row.source_seat_scope_id,
    effective_allocation_scope_id: candidate.row.allocation_scope_id,
    allocation_scope_id: candidate.row.allocation_scope_id,
    stage: {
      source_label: candidate.row.source_stage_label,
      source_year: candidate.row.latest_year,
      semantics_id: candidate.row.stage_semantics_id,
      conversion_applied: candidate.row.stage_semantics_id !== "standard",
      description: mhtCetStageDescription(candidate.row.stage_semantics_id),
      active_rule: {
        rules_year: candidate.row.rules_year,
        stage_id: activeRule.id,
        stage_label: activeRule.label,
      },
    },
    effective_eligibility_description: mhtCetEffectiveEligibilityDescription(
      candidate.row.stage_semantics_id,
      candidate.row.allocation_scope_id,
    ),
    data_quality: candidate.dataQuality,
  };
}
