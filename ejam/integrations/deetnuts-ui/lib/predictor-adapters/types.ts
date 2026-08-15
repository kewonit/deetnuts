import type {
  CollegePredictionResult,
  ProbabilityBand,
  ProgramPrediction,
} from "@ejam/data/college-predictor";
import type {
  MhtCetAllocationScope,
  MhtCetRoundAvailabilityStatus,
  MhtCetStageSemanticsId,
} from "@ejam/data/mht-cet/browser";

export type PredictorExamId = "jee-main" | "jee-advanced" | "csab" | "mht-cet";

export type PredictorDisplayProgram = {
  key: string;
  exam: "jee" | "mht-cet";
  instituteId: string;
  instituteCode?: string;
  instituteName: string;
  instituteType: string;
  programId: string;
  programName: string;
  choiceCode?: string;
  band: ProbabilityBand;
  overallProbability: number;
  predictedClosingRank: number;
  roundProbabilities: Array<number | null>;
  roundCount: 4 | 6;
  seatPoolLabel: string;
  dataQuality: "sufficient" | "inferred" | "pooled";
  yearsOfData: number;
  latestYear: number;
  degree?: string;
  durationYears?: number;
  weightedMean?: number;
  sigmaEffective?: number;
  homeState?: string;
  gender?: string;
  fillRound?: number;
  latestHistoricalPercentile?: number | null;
  bestRound?: 1 | 2 | 3 | 4;
  roundDetails?: Array<{
    probability: number;
    predictedClosingRank: number;
    latestHistoricalPercentile: number | null;
    seatPoolId: string;
    sourceCode: string;
    sourceSeatScopeId: MhtCetAllocationScope;
    effectiveAllocationScopeId: MhtCetAllocationScope;
    allocationScopeId: MhtCetAllocationScope;
    stageSourceLabel: string;
    stageSourceYear: number;
    stageSemanticsId: MhtCetStageSemanticsId;
    activeRuleYear: number;
    activeRuleId: string;
    activeRuleLabel: string;
    conversionApplied: boolean;
    conversionDescription: string;
    effectiveEligibilityDescription: string;
    dataQuality: "inferred" | "pooled";
  } | null>;
  roundAvailability?: Array<{
    status: MhtCetRoundAvailabilityStatus;
    reason: string;
  }>;
  seatPoolsConsidered?: Array<{
    id: string;
    source_code: string;
    source_stage_label: string;
    stage_semantics_id: MhtCetStageSemanticsId;
    source_seat_scope_id: MhtCetAllocationScope;
    effective_allocation_scope_id: MhtCetAllocationScope;
    allocation_scope_id: MhtCetAllocationScope;
    eligible: boolean;
    rounds: Array<1 | 2 | 3 | 4>;
  }>;
  jeeProgram?: ProgramPrediction;
};

export type PredictorDisplayResult = {
  exam: "jee" | "mht-cet";
  resultMode: "client" | "server-paged";
  programs: PredictorDisplayProgram[];
  metadata: {
    totalMatching: number;
    displayedPrograms: number;
    hiddenPrograms: number;
    warnings: string[];
    pagination?: {
      returned: number;
      limit: number | null;
      nextCursor: string | null;
      hasMore: boolean;
    };
    facets?: {
      instituteTypes: Array<{ value: string; count: number }>;
      bands: Record<ProbabilityBand, number>;
    };
  };
  jeeResult?: CollegePredictionResult;
};
