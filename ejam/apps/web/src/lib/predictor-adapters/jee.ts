import type {
  CollegePredictionResult,
  ProgramPrediction,
} from "@ejam/data/college-predictor";
import { uiQuotaToApi } from "@ejam/predictors/shared/quota-input";
import { z } from "zod";
import type { PredictorDisplayProgram, PredictorDisplayResult } from "./types";

const JeeProgramResult = z.looseObject({
  institute_id: z.string(),
  program_id: z.string(),
  program_name: z.string().optional(),
  seat_type: z.string(),
  quota: z.string(),
  gender: z.string(),
  state: z.string().optional(),
  instype: z.string(),
  degree: z.string(),
  duration_years: z.number(),
  weighted_mean: z.number(),
  predicted_closing_rank: z.number(),
  sigma_effective: z.number(),
  cumulative_probability: z.number().min(0).max(1),
  band: z.enum(["safe", "iffy", "delulu", "doesnt-matter"]),
  data_quality: z.enum(["sufficient", "inferred", "pooled"]),
  years_of_data: z.number().int(),
  last_data_year: z.number().int(),
  fill_round: z.number().int(),
  round_probs: z.array(z.number().min(0).max(1)),
});

const JeePredictionResult = z.looseObject({
  programs: z.array(JeeProgramResult),
  metadata: z.looseObject({
    total_matching: z.number().int(),
    total_above_threshold: z.number().int(),
    threshold_used: z.number(),
    hidden_count: z.number().int(),
    total_matching_programs: z.number().int(),
    displayed_programs: z.number().int(),
    hidden_programs: z.number().int(),
    active_filters: z.looseObject({
      institute_type: z.array(z.string()).optional(),
      state: z.array(z.string()).optional(),
      branch_name: z.union([z.string(), z.array(z.string())]).optional(),
      band: z
        .array(z.enum(["safe", "iffy", "delulu", "doesnt-matter"]))
        .optional(),
    }),
  }),
  grouped_by_band: z.object({
    safe: z.array(JeeProgramResult),
    iffy: z.array(JeeProgramResult),
    delulu: z.array(JeeProgramResult),
    "doesnt-matter": z.array(JeeProgramResult),
  }),
});

export type JeeRequestOptions = {
  rank: string;
  apiSeatType: string;
  apiGender: string;
  quota: string;
  homeState: string;
  hasEwsCertificate: boolean;
  usesQuotaHomeState: boolean;
};

export function buildJeePredictionRequest(
  options: JeeRequestOptions,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    rank: Number.parseInt(options.rank, 10),
    seat_type: options.apiSeatType,
    gender: options.apiGender,
    has_ews_certificate: options.hasEwsCertificate,
    include_all: true,
  };
  if (options.usesQuotaHomeState) {
    body.quota = uiQuotaToApi(options.quota);
    body.state = options.homeState;
  }
  return body;
}

export function jeeProgramKey(
  program: Pick<
    ProgramPrediction,
    "institute_id" | "program_id" | "seat_type" | "quota" | "gender"
  >,
): string {
  return [
    program.institute_id,
    program.program_id,
    program.seat_type,
    program.quota,
    program.gender,
  ].join("::");
}

function jeeDisplayProgram(
  program: ProgramPrediction,
): PredictorDisplayProgram {
  return {
    key: jeeProgramKey(program),
    exam: "jee",
    instituteId: program.institute_id,
    instituteName: program.institute_id,
    instituteType: program.instype,
    programId: program.program_id,
    programName: program.program_name ?? program.program_id,
    band: program.band,
    overallProbability: program.cumulative_probability,
    predictedClosingRank: program.predicted_closing_rank,
    roundProbabilities: program.round_probs,
    roundCount: 6,
    seatPoolLabel: `${program.seat_type} · ${program.quota.toUpperCase()}`,
    dataQuality: program.data_quality,
    yearsOfData: program.years_of_data,
    latestYear: program.last_data_year,
    degree: program.degree,
    durationYears: program.duration_years,
    weightedMean: program.weighted_mean,
    sigmaEffective: program.sigma_effective,
    homeState: program.state,
    gender: program.gender,
    fillRound: program.fill_round,
    jeeProgram: program,
  };
}

export function decodeJeeResult(
  result: unknown,
): PredictorDisplayResult | null {
  const parsed = JeePredictionResult.safeParse(result);
  if (!parsed.success) return null;
  const jeeResult: CollegePredictionResult = parsed.data;
  return {
    exam: "jee",
    resultMode: "client",
    programs: jeeResult.programs.map(jeeDisplayProgram),
    metadata: {
      totalMatching: jeeResult.metadata.total_matching,
      displayedPrograms: jeeResult.metadata.displayed_programs,
      hiddenPrograms: jeeResult.metadata.hidden_programs,
      warnings: [],
    },
    jeeResult,
  };
}
