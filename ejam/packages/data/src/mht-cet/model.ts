import type {
  MhtCetAllocationScope,
  MhtCetCutoffRow,
  MhtCetInstituteReference,
  MhtCetModelConfiguration,
  MhtCetPredictorIndexRow,
  MhtCetRoundDataStatus,
  MhtCetSeatPoolDefinition,
} from "./schema";
import type { MhtCetStageSemanticsId } from "./stage-schema";

type RoundNumber = 1 | 2 | 3 | 4;

type HistoricalPoint = {
  year: number;
  round: RoundNumber;
  institute_code: string;
  institute_id: string;
  choice_code: string;
  offering_id: string;
  program_id: string;
  program_name: string;
  seat_pool_id: string;
  source_stage_label: string;
  stage_semantics_id: MhtCetStageSemanticsId;
  source_seat_scope_id: MhtCetAllocationScope;
  allocation_scope_id: MhtCetAllocationScope;
  closing_rank: number | null;
  closing_percentile: number | null;
};

type ResidualSample = {
  round: 1 | 2 | 3;
  stageSemantics: MhtCetStageSemanticsId;
  categoryFamily: string;
  allocationScope: MhtCetAllocationScope;
  value: number;
};

type DistributionSelection = {
  values: number[];
  source:
    | "round-stage-category-scope"
    | "round-stage-category"
    | "round-stage"
    | "round"
    | "global";
};

type ResidualDistributions = {
  exact: Map<string, number[]>;
  stageCategoryRound: Map<string, number[]>;
  stageRound: Map<string, number[]>;
  round: Map<number, number[]>;
  global: number[];
};

function pointKey(point: {
  institute_code: string;
  choice_code: string;
  seat_pool_id: string;
  source_seat_scope_id: MhtCetAllocationScope;
  allocation_scope_id: MhtCetAllocationScope;
  stage_semantics_id: MhtCetStageSemanticsId;
  round: number;
}): string {
  return [
    point.institute_code,
    point.choice_code,
    point.seat_pool_id,
    point.source_seat_scope_id,
    point.allocation_scope_id,
    point.stage_semantics_id,
    point.round,
  ].join(":");
}

function channelKey(
  point: Omit<Parameters<typeof pointKey>[0], "round">,
): string {
  return [
    point.institute_code,
    point.choice_code,
    point.seat_pool_id,
    point.source_seat_scope_id,
    point.allocation_scope_id,
    point.stage_semantics_id,
  ].join(":");
}

function cutoffPoints(rows: MhtCetCutoffRow[]): HistoricalPoint[] {
  const points = new Map<string, HistoricalPoint>();
  for (const row of rows) {
    if (row.round < 1 || row.round > 4) {
      throw new Error(`invalid MHT-CET CAP round: ${row.round}`);
    }
    const point: HistoricalPoint = {
      year: row.year,
      round: row.round as RoundNumber,
      institute_code: row.institute_code,
      institute_id: row.institute_id,
      choice_code: row.choice_code,
      offering_id: row.offering_id,
      program_id: row.program_id,
      program_name: row.program_name,
      seat_pool_id: row.seat_pool_id,
      source_stage_label: row.source_stage_label,
      stage_semantics_id: row.stage_semantics_id,
      source_seat_scope_id: row.source_seat_scope_id,
      allocation_scope_id: row.effective_allocation_scope_id,
      closing_rank: row.closing_rank,
      closing_percentile: row.closing_percentile,
    };
    const key = `${row.year}:${pointKey(point)}`;
    if (points.has(key)) {
      throw new Error(
        `duplicate MHT-CET stage prediction channel ${key}; source stage sequence must be resolved before index building`,
      );
    }
    points.set(key, point);
  }
  return Array.from(points.values());
}

function categoryFamily(pool: MhtCetSeatPoolDefinition): string {
  return pool.category_id ?? `special-${pool.special_eligibility}`;
}

function compactDistribution(values: number[], maximumSamples = 101): number[] {
  const sorted = values.slice().sort((left, right) => left - right);
  if (sorted.length <= maximumSamples) return sorted;
  return Array.from({ length: maximumSamples }, (_, index) => {
    const position = Math.round(
      (index * (sorted.length - 1)) / (maximumSamples - 1),
    );
    return sorted[position];
  });
}

function addResidual<Key>(
  distributions: Map<Key, number[]>,
  key: Key,
  residual: number,
): void {
  const values = distributions.get(key);
  if (values) values.push(residual);
  else distributions.set(key, [residual]);
}

function compactMap<Key>(values: Map<Key, number[]>): Map<Key, number[]> {
  return new Map(
    Array.from(values, ([key, samples]) => [key, compactDistribution(samples)]),
  );
}

function residualDistributions(
  residuals: ResidualSample[],
): ResidualDistributions {
  const exact = new Map<string, number[]>();
  const stageCategoryRound = new Map<string, number[]>();
  const stageRound = new Map<string, number[]>();
  const round = new Map<number, number[]>();
  const global: number[] = [];
  for (const sample of residuals) {
    addResidual(
      exact,
      `${sample.round}:${sample.stageSemantics}:${sample.categoryFamily}:${sample.allocationScope}`,
      sample.value,
    );
    addResidual(
      stageCategoryRound,
      `${sample.round}:${sample.stageSemantics}:${sample.categoryFamily}`,
      sample.value,
    );
    addResidual(
      stageRound,
      `${sample.round}:${sample.stageSemantics}`,
      sample.value,
    );
    addResidual(round, sample.round, sample.value);
    global.push(sample.value);
  }
  return {
    exact: compactMap(exact),
    stageCategoryRound: compactMap(stageCategoryRound),
    stageRound: compactMap(stageRound),
    round: compactMap(round),
    global: compactDistribution(global),
  };
}

function selectDistribution(options: {
  distributions: ResidualDistributions;
  round: 1 | 2 | 3;
  stageSemantics: MhtCetStageSemanticsId;
  categoryFamily: string;
  allocationScope: MhtCetAllocationScope;
  minimumSize: number;
}): DistributionSelection {
  const candidates: Array<
    [number[] | undefined, DistributionSelection["source"]]
  > = [
    [
      options.distributions.exact.get(
        `${options.round}:${options.stageSemantics}:${options.categoryFamily}:${options.allocationScope}`,
      ),
      "round-stage-category-scope",
    ],
    [
      options.distributions.stageCategoryRound.get(
        `${options.round}:${options.stageSemantics}:${options.categoryFamily}`,
      ),
      "round-stage-category",
    ],
    [
      options.distributions.stageRound.get(
        `${options.round}:${options.stageSemantics}`,
      ),
      "round-stage",
    ],
    [options.distributions.round.get(options.round), "round"],
  ];
  for (const [values, source] of candidates) {
    if (values && values.length >= options.minimumSize) {
      return { values, source };
    }
  }
  if (options.distributions.global.length === 0) {
    throw new Error("MHT-CET model has no matched 2024→2025 residuals");
  }
  return { values: options.distributions.global, source: "global" };
}

function quantile(sorted: number[], probability: number): number {
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const fraction = position - lower;
  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

function distributionWidth(values: number[]): number {
  if (values.length === 0) return -1;
  const sorted = values.slice().sort((left, right) => left - right);
  return quantile(sorted, 0.975) - quantile(sorted, 0.025);
}

function roundFourDistribution(
  residuals: ResidualSample[],
  movements: number[],
): number[] {
  const yearOverYear = residuals.map((sample) => sample.value);
  if (yearOverYear.length === 0 && movements.length === 0) {
    throw new Error("MHT-CET round four has no pooled uncertainty samples");
  }
  return compactDistribution(
    distributionWidth(movements) > distributionWidth(yearOverYear)
      ? movements
      : yearOverYear,
  );
}

function pointStatus(
  point: HistoricalPoint | undefined,
): MhtCetRoundDataStatus {
  if (!point) return "not-published";
  return point.closing_rank === null ? "percentile-only" : "rank";
}

export function buildMhtCetPredictorIndex(options: {
  cutoffRows: MhtCetCutoffRow[];
  instituteReferences: MhtCetInstituteReference[];
  seatPools: MhtCetSeatPoolDefinition[];
  config: MhtCetModelConfiguration;
}): MhtCetPredictorIndexRow[] {
  const [earlierYear, latestYear] = options.config.source_years;
  if (
    earlierYear >= latestYear ||
    options.config.target_year !== latestYear + 1
  ) {
    throw new Error(
      "MHT-CET source years must increase and end immediately before target_year",
    );
  }
  const pools = new Map(options.seatPools.map((pool) => [pool.id, pool]));
  const institutes = new Map(
    options.instituteReferences
      .filter((reference) => reference.year === latestYear)
      .map((reference) => [reference.institute_code, reference]),
  );
  const points = cutoffPoints(options.cutoffRows);
  const earlier = new Map(
    points
      .filter((point) => point.year === earlierYear)
      .map((point) => [pointKey(point), point]),
  );
  const latest = points.filter((point) => point.year === latestYear);
  const residuals: ResidualSample[] = [];
  for (const point of latest) {
    if (point.round === 4 || point.closing_rank === null) continue;
    const previous = earlier.get(pointKey(point));
    const pool = pools.get(point.seat_pool_id);
    if (!previous?.closing_rank || !pool?.predictable) continue;
    residuals.push({
      round: point.round,
      stageSemantics: point.stage_semantics_id,
      categoryFamily: categoryFamily(pool),
      allocationScope: point.allocation_scope_id,
      value:
        (point.closing_rank - previous.closing_rank) / previous.closing_rank,
    });
  }
  const latestByPoint = new Map(
    latest.map((point) => [pointKey(point), point]),
  );
  const movements: number[] = [];
  for (const point of latest) {
    if (point.round !== 4 || point.closing_rank === null) continue;
    const roundThree = latestByPoint.get(pointKey({ ...point, round: 3 }));
    if (!roundThree?.closing_rank) continue;
    movements.push(
      (point.closing_rank - roundThree.closing_rank) / roundThree.closing_rank,
    );
  }
  const pooledRoundFour = roundFourDistribution(residuals, movements);
  const distributions = residualDistributions(residuals);
  const channels = new Map<string, HistoricalPoint[]>();
  for (const point of latest) {
    const key = channelKey(point);
    const values = channels.get(key);
    if (values) values.push(point);
    else channels.set(key, [point]);
  }

  return Array.from(channels.values())
    .map((channel): MhtCetPredictorIndexRow | null => {
      const identity = channel[0];
      const pool = pools.get(identity.seat_pool_id);
      if (!pool) {
        throw new Error(
          `MHT-CET cutoff references unknown pool ${identity.seat_pool_id}`,
        );
      }
      if (!pool.predictable) return null;
      const institute = institutes.get(identity.institute_code);
      if (!institute) {
        throw new Error(
          `MHT-CET latest offering references missing official institute ${identity.institute_code}`,
        );
      }
      const rounds = new Map(channel.map((point) => [point.round, point]));
      const hasEarlierCycle = ([1, 2, 3] as const).some((round) =>
        earlier.has(pointKey({ ...identity, round })),
      );
      const selected = new Map<1 | 2 | 3, DistributionSelection>();
      for (const round of [1, 2, 3] as const) {
        const point = rounds.get(round);
        if (!point?.closing_rank) continue;
        selected.set(
          round,
          selectDistribution({
            distributions,
            round,
            stageSemantics: identity.stage_semantics_id,
            categoryFamily: categoryFamily(pool),
            allocationScope: identity.allocation_scope_id,
            minimumSize: options.config.minimum_stratum_size,
          }),
        );
      }
      const rank = (round: RoundNumber) =>
        rounds.get(round)?.closing_rank ?? null;
      const percentile = (round: RoundNumber) =>
        rounds.get(round)?.closing_percentile ?? null;
      const status = (round: RoundNumber) => pointStatus(rounds.get(round));
      const quality = (round: RoundNumber) => {
        if (status(round) !== "rank") return null;
        if (round === 4) return "pooled" as const;
        return earlier.get(pointKey({ ...identity, round }))?.closing_rank
          ? ("inferred" as const)
          : ("pooled" as const);
      };
      return {
        schema_version: 3,
        model_id: options.config.model_id,
        target_year: options.config.target_year,
        rules_year: options.config.rules_year,
        institute_id: institute.institute_id,
        institute_code: institute.institute_code,
        institute_name: institute.institute_name,
        institute_type: institute.institute_type,
        district: institute.district,
        home_university_id: institute.home_university_id,
        minority_community_id: institute.minority_community_id,
        offering_id: identity.offering_id,
        choice_code: identity.choice_code,
        program_id: identity.program_id,
        program_name: identity.program_name,
        seat_pool_id: identity.seat_pool_id,
        source_stage_label: identity.source_stage_label,
        stage_semantics_id: identity.stage_semantics_id,
        source_seat_scope_id: identity.source_seat_scope_id,
        allocation_scope_id: identity.allocation_scope_id,
        latest_year: latestYear,
        years_of_data: hasEarlierCycle ? 2 : 1,
        data_quality: hasEarlierCycle ? "inferred" : "pooled",
        round1_rank: rank(1),
        round2_rank: rank(2),
        round3_rank: rank(3),
        round4_rank: rank(4),
        round1_status: status(1),
        round2_status: status(2),
        round3_status: status(3),
        round4_status: status(4),
        round1_percentile: percentile(1),
        round2_percentile: percentile(2),
        round3_percentile: percentile(3),
        round4_percentile: percentile(4),
        round1_relative_residuals: selected.get(1)?.values ?? null,
        round2_relative_residuals: selected.get(2)?.values ?? null,
        round3_relative_residuals: selected.get(3)?.values ?? null,
        round4_relative_residuals:
          status(4) === "rank" ? pooledRoundFour : null,
        round1_uncertainty_source: selected.get(1)?.source ?? null,
        round2_uncertainty_source: selected.get(2)?.source ?? null,
        round3_uncertainty_source: selected.get(3)?.source ?? null,
        round4_uncertainty_source:
          status(4) === "rank" ? "round4-pooled" : null,
        round1_data_quality: quality(1),
        round2_data_quality: quality(2),
        round3_data_quality: quality(3),
        round4_data_quality: quality(4),
      };
    })
    .filter((row): row is MhtCetPredictorIndexRow => row !== null)
    .sort((left, right) =>
      [
        left.institute_code,
        left.choice_code,
        left.seat_pool_id,
        left.source_seat_scope_id,
        left.allocation_scope_id,
        left.stage_semantics_id,
      ]
        .join(":")
        .localeCompare(
          [
            right.institute_code,
            right.choice_code,
            right.seat_pool_id,
            right.source_seat_scope_id,
            right.allocation_scope_id,
            right.stage_semantics_id,
          ].join(":"),
        ),
    );
}
