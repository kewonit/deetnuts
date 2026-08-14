import { PredictionInputError } from "../predictor-interface";
import {
  isMhtCetSeatPoolEligible,
  seatPoolMap,
  validateMhtCetEligibilityInput,
} from "./eligibility";
import { buildMhtCetPredictionMetadata } from "./engine-metadata";
import {
  apiMhtCetRoundMatch,
  type MhtCetRoundCandidate as RoundCandidate,
  type MhtCetRoundNumber as RoundNumber,
} from "./engine-round-match";
import type {
  MhtCetPredictionResult,
  MhtCetRoundAvailability,
  MhtCetRoundMatches,
  MhtCetRoundProbabilities,
} from "./result-schema";
import { mhtCetRoundAvailabilityEntry } from "./round-availability";
import type {
  MhtCetPredictionInput,
  MhtCetPredictorIndexRow,
  MhtCetProbabilityBand,
  MhtCetRoundDataStatus,
  MhtCetSeatPoolRegistry,
} from "./schema";
import { mhtCetEffectiveEligibilityDescription } from "./stage-descriptions";

const DISPLAY_THRESHOLD = 0.1;
const ROUNDS = [1, 2, 3, 4] as const;
type DataQuality = "inferred" | "pooled";

const BAND_ORDER: Record<MhtCetProbabilityBand, number> = {
  safe: 0,
  iffy: 1,
  delulu: 2,
  "doesnt-matter": 3,
};

export function classifyMhtCetBand(probability: number): MhtCetProbabilityBand {
  if (probability >= 0.85) return "safe";
  if (probability >= 0.4) return "iffy";
  if (probability >= DISPLAY_THRESHOLD) return "delulu";
  return "doesnt-matter";
}

export function empiricalClosingRankProbability(
  studentRank: number,
  latestClosingRank: number,
  relativeResiduals: number[],
): number {
  if (relativeResiduals.length === 0) return 0;
  let successfulSamples = 0;
  for (const residual of relativeResiduals) {
    if (latestClosingRank * (1 + residual) >= studentRank) {
      successfulSamples += 1;
    }
  }
  return (
    Math.round((successfulSamples / relativeResiduals.length) * 10_000) / 10_000
  );
}

function roundProbability(
  studentRank: number,
  closingRank: number | null,
  residuals: number[] | null,
): number | null {
  if (closingRank === null || residuals === null) return null;
  return empiricalClosingRankProbability(studentRank, closingRank, residuals);
}

export function computeMhtCetRoundProbabilities(
  studentRank: number,
  row: MhtCetPredictorIndexRow,
): MhtCetRoundProbabilities {
  return {
    "1": roundProbability(
      studentRank,
      row.round1_rank,
      row.round1_relative_residuals,
    ),
    "2": roundProbability(
      studentRank,
      row.round2_rank,
      row.round2_relative_residuals,
    ),
    "3": roundProbability(
      studentRank,
      row.round3_rank,
      row.round3_relative_residuals,
    ),
    "4": roundProbability(
      studentRank,
      row.round4_rank,
      row.round4_relative_residuals,
    ),
  };
}

export function maxSupportedRoundProbability(
  probabilities: MhtCetRoundProbabilities,
): number {
  const supported = Object.values(probabilities).filter(
    (value): value is number => value !== null,
  );
  return supported.length === 0 ? 0 : Math.max(...supported);
}

function matchesFilters(
  row: MhtCetPredictorIndexRow,
  filters: MhtCetPredictionInput["filters"],
): boolean {
  if (!filters) return true;
  if (
    filters.institute_type?.length &&
    !filters.institute_type.includes(row.institute_type)
  ) {
    return false;
  }
  if (filters.district?.length && !filters.district.includes(row.district)) {
    return false;
  }
  return !(
    filters.program_id?.length && !filters.program_id.includes(row.program_id)
  );
}

type RoundValues = {
  rank: number | null;
  percentile: number | null;
  quality: DataQuality | null;
  status: MhtCetRoundDataStatus;
};

function roundValues(
  row: MhtCetPredictorIndexRow,
  round: RoundNumber,
): RoundValues {
  return {
    rank: row[`round${round}_rank`],
    percentile: row[`round${round}_percentile`],
    quality: row[`round${round}_data_quality`],
    status: row[`round${round}_status`],
  };
}

function roundCandidate(
  row: MhtCetPredictorIndexRow,
  probabilities: MhtCetRoundProbabilities,
  round: RoundNumber,
): RoundCandidate | null {
  const probability = probabilities[String(round) as "1" | "2" | "3" | "4"];
  const values = roundValues(row, round);
  if (values.status !== "rank") {
    if (probability !== null) {
      throw new Error(
        `MHT-CET ${values.status} round ${round} unexpectedly has a probability`,
      );
    }
    return null;
  }
  if (probability === null || values.rank === null || values.quality === null) {
    throw new Error(
      `MHT-CET index has incomplete rank data for round ${round}: ${row.offering_id}/${row.seat_pool_id}/${row.stage_semantics_id}`,
    );
  }
  return {
    row,
    round,
    probability,
    predictedClosingRank: values.rank,
    latestHistoricalPercentile: values.percentile,
    dataQuality: values.quality,
  };
}

function compareRoundCandidate(
  left: RoundCandidate,
  right: RoundCandidate,
): number {
  return (
    right.probability - left.probability ||
    right.predictedClosingRank - left.predictedClosingRank ||
    left.row.seat_pool_id.localeCompare(right.row.seat_pool_id) ||
    left.row.stage_semantics_id.localeCompare(right.row.stage_semantics_id) ||
    left.row.allocation_scope_id.localeCompare(right.row.allocation_scope_id) ||
    left.row.source_seat_scope_id.localeCompare(
      right.row.source_seat_scope_id,
    ) ||
    left.row.offering_id.localeCompare(right.row.offering_id)
  );
}

function compareOverallCandidate(
  left: RoundCandidate,
  right: RoundCandidate,
): number {
  return compareRoundCandidate(left, right) || right.round - left.round;
}

type ConsideredStage = {
  id: string;
  source_code: string;
  source_stage_label: string;
  stage_semantics_id: MhtCetPredictorIndexRow["stage_semantics_id"];
  source_seat_scope_id: MhtCetPredictorIndexRow["source_seat_scope_id"];
  effective_allocation_scope_id: MhtCetPredictorIndexRow["allocation_scope_id"];
  allocation_scope_id: MhtCetPredictorIndexRow["allocation_scope_id"];
  eligible: boolean;
  rounds: RoundNumber[];
};

type RoundInventory = {
  published: boolean;
  eligibleRank: boolean;
  eligiblePercentileOnly: boolean;
};

type RoundWinners = Record<"1" | "2" | "3" | "4", RoundCandidate | null>;

type OfferingCandidates = {
  considered: Map<string, ConsideredStage>;
  inventory: Record<"1" | "2" | "3" | "4", RoundInventory>;
  winners: RoundWinners;
};

function availabilityFor(
  offering: OfferingCandidates,
): MhtCetRoundAvailability {
  return Object.fromEntries(
    ROUNDS.map((round) => {
      const key = String(round) as "1" | "2" | "3" | "4";
      const inventory = offering.inventory[key];
      const eligibleStatuses: MhtCetRoundDataStatus[] = [];
      if (inventory.eligibleRank) eligibleStatuses.push("rank");
      if (inventory.eligiblePercentileOnly) {
        eligibleStatuses.push("percentile-only");
      }
      return [
        key,
        mhtCetRoundAvailabilityEntry({
          round,
          hasWinner: offering.winners[key] !== null,
          publishedStatuses: inventory.published ? ["rank"] : [],
          eligibleStatuses,
        }),
      ];
    }),
  ) as MhtCetRoundAvailability;
}

function consideredKey(row: MhtCetPredictorIndexRow): string {
  return [
    row.seat_pool_id,
    row.source_stage_label,
    row.stage_semantics_id,
    row.source_seat_scope_id,
    row.allocation_scope_id,
  ].join(":");
}

function emptyOfferingCandidates(): OfferingCandidates {
  const inventory = () => ({
    published: false,
    eligibleRank: false,
    eligiblePercentileOnly: false,
  });
  return {
    considered: new Map<string, ConsideredStage>(),
    inventory: {
      "1": inventory(),
      "2": inventory(),
      "3": inventory(),
      "4": inventory(),
    },
    winners: {
      "1": null,
      "2": null,
      "3": null,
      "4": null,
    },
  };
}

export function predictMhtCetPrograms(options: {
  input: MhtCetPredictionInput;
  indexRows: MhtCetPredictorIndexRow[];
  seatPoolRegistry: MhtCetSeatPoolRegistry;
}): MhtCetPredictionResult {
  const inputErrors = validateMhtCetEligibilityInput(options.input);
  if (Object.keys(inputErrors).length > 0) {
    throw new PredictionInputError(
      "MHT-CET eligibility input is invalid",
      inputErrors,
    );
  }
  const metadata = options.indexRows[0];
  if (!metadata) throw new Error("MHT-CET predictor index is empty");
  if (options.seatPoolRegistry.rules_year !== metadata.rules_year) {
    throw new Error(
      `MHT-CET rules mismatch: registry=${options.seatPoolRegistry.rules_year}, index=${metadata.rules_year}`,
    );
  }

  const pools = seatPoolMap(options.seatPoolRegistry);
  const byOffering = new Map<string, OfferingCandidates>();
  for (const row of options.indexRows) {
    if (!matchesFilters(row, options.input.filters)) continue;
    const pool = pools.get(row.seat_pool_id);
    if (!pool) {
      throw new Error(
        `MHT-CET index references unknown seat pool: ${row.seat_pool_id}`,
      );
    }
    const key = `${row.institute_id}:${row.offering_id}`;
    const offering = byOffering.get(key) ?? emptyOfferingCandidates();
    const eligible = isMhtCetSeatPoolEligible(options.input, row, pool);
    const probabilities = eligible
      ? computeMhtCetRoundProbabilities(options.input.rank, row)
      : null;
    const rounds: RoundNumber[] = [];
    for (const round of ROUNDS) {
      const roundKey = String(round) as "1" | "2" | "3" | "4";
      const status = roundValues(row, round).status;
      if (status === "not-published") continue;
      rounds.push(round);
      offering.inventory[roundKey].published = true;
      if (!eligible || !probabilities) continue;
      if (status === "rank") {
        offering.inventory[roundKey].eligibleRank = true;
      } else {
        offering.inventory[roundKey].eligiblePercentileOnly = true;
      }
      const candidate = roundCandidate(row, probabilities, round);
      const winner = offering.winners[roundKey];
      if (
        candidate &&
        (!winner || compareRoundCandidate(candidate, winner) < 0)
      ) {
        offering.winners[roundKey] = candidate;
      }
    }
    if (rounds.length === 0) {
      throw new Error(`MHT-CET index channel has no published rounds: ${key}`);
    }
    offering.considered.set(consideredKey(row), {
      id: pool.id,
      source_code: pool.source_code,
      source_stage_label: row.source_stage_label,
      stage_semantics_id: row.stage_semantics_id,
      source_seat_scope_id: row.source_seat_scope_id,
      effective_allocation_scope_id: row.allocation_scope_id,
      allocation_scope_id: row.allocation_scope_id,
      eligible,
      rounds,
    });
    byOffering.set(key, offering);
  }

  const allPrograms = Array.from(byOffering.values()).flatMap((offering) => {
    let overall: RoundCandidate | null = null;
    for (const candidate of Object.values(offering.winners)) {
      if (
        candidate &&
        (!overall || compareOverallCandidate(candidate, overall) < 0)
      ) {
        overall = candidate;
      }
    }
    if (!overall) return [];
    const bestPool = pools.get(overall.row.seat_pool_id);
    if (!bestPool) throw new Error("MHT-CET selected an unknown seat pool");
    const roundMatches: MhtCetRoundMatches = {
      "1": apiMhtCetRoundMatch(offering.winners["1"], pools),
      "2": apiMhtCetRoundMatch(offering.winners["2"], pools),
      "3": apiMhtCetRoundMatch(offering.winners["3"], pools),
      "4": apiMhtCetRoundMatch(offering.winners["4"], pools),
    };
    const roundProbabilities: MhtCetRoundProbabilities = {
      "1": roundMatches["1"]?.probability ?? null,
      "2": roundMatches["2"]?.probability ?? null,
      "3": roundMatches["3"]?.probability ?? null,
      "4": roundMatches["4"]?.probability ?? null,
    };
    return [
      {
        institute_id: overall.row.institute_id,
        institute_code: overall.row.institute_code,
        institute_name: overall.row.institute_name,
        institute_type: overall.row.institute_type,
        district: overall.row.district,
        offering_id: overall.row.offering_id,
        choice_code: overall.row.choice_code,
        program_id: overall.row.program_id,
        program_name: overall.row.program_name,
        best_round: overall.round,
        best_eligible_seat_pool: {
          id: bestPool.id,
          source_code: bestPool.source_code,
          label: bestPool.label,
          source_stage_label: overall.row.source_stage_label,
          stage_semantics_id: overall.row.stage_semantics_id,
          source_seat_scope_id: overall.row.source_seat_scope_id,
          effective_allocation_scope_id: overall.row.allocation_scope_id,
          allocation_scope_id: overall.row.allocation_scope_id,
          effective_eligibility_description:
            mhtCetEffectiveEligibilityDescription(
              overall.row.stage_semantics_id,
              overall.row.allocation_scope_id,
            ),
          round: overall.round,
        },
        seat_pools_considered: Array.from(offering.considered.values()).sort(
          (left, right) =>
            [
              left.id,
              left.stage_semantics_id,
              left.source_seat_scope_id,
              left.effective_allocation_scope_id,
            ]
              .join(":")
              .localeCompare(
                [
                  right.id,
                  right.stage_semantics_id,
                  right.source_seat_scope_id,
                  right.effective_allocation_scope_id,
                ].join(":"),
              ),
        ),
        round_probabilities: roundProbabilities,
        round_matches: roundMatches,
        round_availability: availabilityFor(offering),
        overall_probability: overall.probability,
        band: classifyMhtCetBand(overall.probability),
        predicted_closing_rank: overall.predictedClosingRank,
        latest_historical_percentile: overall.latestHistoricalPercentile,
        data_quality: overall.dataQuality,
      },
    ];
  });

  const bandFiltered = options.input.filters?.band?.length
    ? allPrograms.filter((program) =>
        options.input.filters?.band?.includes(program.band),
      )
    : allPrograms;
  const displayed = options.input.include_all
    ? bandFiltered
    : bandFiltered.filter(
        (program) => program.overall_probability >= DISPLAY_THRESHOLD,
      );
  displayed.sort(
    (left, right) =>
      BAND_ORDER[left.band] - BAND_ORDER[right.band] ||
      right.overall_probability - left.overall_probability ||
      left.predicted_closing_rank - right.predicted_closing_rank ||
      left.offering_id.localeCompare(right.offering_id),
  );

  return {
    programs: displayed,
    metadata: buildMhtCetPredictionMetadata({
      indexRows: options.indexRows,
      programs: displayed,
      totalMatching: bandFiltered.length,
    }),
  };
}
