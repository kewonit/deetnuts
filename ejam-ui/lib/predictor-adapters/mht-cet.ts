import {
  decodeMhtCetPredictionResult,
  type MhtCetHomeUniversityId,
  type MhtCetMinorityCommunityId,
  type MhtCetPredictionInput,
  type MhtCetPwdCategoryId,
} from "@ejam/data/mht-cet/browser";
import type { PredictorDisplayResult } from "./types";

export function buildMhtCetPredictionRequest(options: {
  rank: string;
  candidatureTypeId: MhtCetPredictionInput["candidature_type_id"];
  categoryId: MhtCetPredictionInput["category_id"];
  ladiesSeatEligible: boolean;
  homeUniversityId: MhtCetHomeUniversityId | "";
  ewsCertificate: boolean;
  tfwsEligible: boolean;
  pwdCategoryId: MhtCetPwdCategoryId | "";
  orphanCertificate: boolean;
  minorityCommunityId: MhtCetMinorityCommunityId | "";
  includeAll: boolean;
}): MhtCetPredictionInput {
  return {
    rank: Number.parseInt(options.rank, 10),
    candidature_type_id: options.candidatureTypeId,
    category_id: options.categoryId,
    ladies_seat_eligible: options.ladiesSeatEligible,
    ...(options.homeUniversityId
      ? { home_university_id: options.homeUniversityId }
      : {}),
    eligibilities: {
      ews_certificate: options.ewsCertificate,
      tfws_eligible: options.tfwsEligible,
      ...(options.pwdCategoryId
        ? { pwd_category_id: options.pwdCategoryId }
        : {}),
      orphan_certificate: options.orphanCertificate,
      ...(options.minorityCommunityId
        ? { minority_community_id: options.minorityCommunityId }
        : {}),
    },
    include_all: options.includeAll,
  };
}

export function decodeMhtResult(
  result: unknown,
): PredictorDisplayResult | null {
  const parsed = decodeMhtCetPredictionResult(result);
  if (!parsed) return null;
  return {
    exam: "mht-cet",
    resultMode:
      parsed.metadata.pagination.limit === null ? "client" : "server-paged",
    programs: parsed.programs.map((program) => ({
      key: `${program.institute_code}::${program.choice_code}`,
      exam: "mht-cet",
      instituteId: program.institute_id,
      instituteCode: program.institute_code,
      instituteName: program.institute_name,
      instituteType: program.institute_type,
      programId: program.program_id,
      programName: program.program_name,
      choiceCode: program.choice_code,
      band: program.band,
      overallProbability: program.overall_probability,
      predictedClosingRank: program.predicted_closing_rank,
      roundProbabilities: [
        program.round_probabilities["1"],
        program.round_probabilities["2"],
        program.round_probabilities["3"],
        program.round_probabilities["4"],
      ],
      roundCount: 4,
      seatPoolLabel: program.best_eligible_seat_pool.source_code,
      dataQuality: program.data_quality,
      yearsOfData: program.data_quality === "inferred" ? 2 : 1,
      latestYear: parsed.metadata.source_years.at(-1) ?? 2025,
      latestHistoricalPercentile: program.latest_historical_percentile,
      bestRound: program.best_round,
      roundDetails: [
        program.round_matches["1"],
        program.round_matches["2"],
        program.round_matches["3"],
        program.round_matches["4"],
      ].map((match) =>
        match
          ? {
              probability: match.probability,
              predictedClosingRank: match.predicted_closing_rank,
              latestHistoricalPercentile: match.latest_historical_percentile,
              seatPoolId: match.seat_pool_id,
              sourceCode: match.source_code,
              sourceSeatScopeId: match.source_seat_scope_id,
              effectiveAllocationScopeId: match.effective_allocation_scope_id,
              allocationScopeId: match.allocation_scope_id,
              stageSourceLabel: match.stage.source_label,
              stageSourceYear: match.stage.source_year,
              stageSemanticsId: match.stage.semantics_id,
              activeRuleYear: match.stage.active_rule.rules_year,
              activeRuleId: match.stage.active_rule.stage_id,
              activeRuleLabel: match.stage.active_rule.stage_label,
              conversionApplied: match.stage.conversion_applied,
              conversionDescription: match.stage.description,
              effectiveEligibilityDescription:
                match.effective_eligibility_description,
              dataQuality: match.data_quality,
            }
          : null,
      ),
      roundAvailability: [
        program.round_availability["1"],
        program.round_availability["2"],
        program.round_availability["3"],
        program.round_availability["4"],
      ],
      seatPoolsConsidered: program.seat_pools_considered,
    })),
    metadata: {
      totalMatching: parsed.metadata.total_matching_offerings,
      displayedPrograms: parsed.metadata.displayed_offerings,
      hiddenPrograms: parsed.metadata.hidden_offerings,
      warnings: parsed.metadata.warnings,
      pagination: {
        returned: parsed.metadata.pagination.returned,
        limit: parsed.metadata.pagination.limit,
        nextCursor: parsed.metadata.pagination.next_cursor,
        hasMore: parsed.metadata.pagination.has_more,
      },
      facets: {
        instituteTypes: parsed.metadata.facets.institute_types,
        bands: parsed.metadata.facets.bands,
      },
    },
  };
}
