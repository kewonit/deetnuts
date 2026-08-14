import type {
  MhtCetCutoffRow,
  MhtCetModelConfiguration,
  MhtCetSeatPoolDefinition,
} from "./schema";
import type { MhtCetStageSemanticsId } from "./stage-schema";

type EvaluationPoint = {
  instituteCode: string;
  choiceCode: string;
  seatPoolId: string;
  sourceSeatScopeId: string;
  allocationScopeId: string;
  stageSemanticsId: MhtCetStageSemanticsId;
  round: 1 | 2 | 3;
  rank: number;
};

type EvaluationResidual = EvaluationPoint & {
  categoryFamily: string;
  allocationScope: string;
  residual: number;
};

export type MhtCetEvaluationReport = {
  label: "mht-cet-2026-honest-evaluation";
  temporal_point_test: {
    label: "2024-point-forecast-to-2025";
    matched_records: number;
    mae: number;
    median_absolute_error: number;
    within_10_percent: number;
    within_20_percent: number;
  };
  grouped_uncertainty_calibration: {
    label: "institute-grouped-2024-to-2025";
    folds: number;
    evaluated_records: number;
    interval_50_coverage: number;
    interval_80_coverage: number;
    interval_95_coverage: number;
  };
  band_monotonicity: {
    checks: number;
    violations: number;
  };
  band_outcomes_monotonic: boolean;
  release_gates: {
    point_within_20_passed: boolean;
    interval_80_passed: boolean;
    interval_95_passed: boolean;
    monotonic_passed: boolean;
    passed: boolean;
  };
};

function key(point: EvaluationPoint): string {
  return [
    point.instituteCode,
    point.choiceCode,
    point.seatPoolId,
    point.sourceSeatScopeId,
    point.allocationScopeId,
    point.stageSemanticsId,
    point.round,
  ].join(":");
}

function aggregate(rows: MhtCetCutoffRow[], year: number): EvaluationPoint[] {
  const points = new Map<string, EvaluationPoint>();
  for (const row of rows) {
    if (row.year !== year || row.round > 3 || row.closing_rank === null) {
      continue;
    }
    const point: EvaluationPoint = {
      instituteCode: row.institute_code,
      choiceCode: row.choice_code,
      seatPoolId: row.seat_pool_id,
      sourceSeatScopeId: row.source_seat_scope_id,
      allocationScopeId: row.effective_allocation_scope_id,
      stageSemanticsId: row.stage_semantics_id,
      round: row.round as 1 | 2 | 3,
      rank: row.closing_rank,
    };
    const identity = key(point);
    if (points.has(identity)) {
      throw new Error(
        `duplicate MHT-CET evaluation stage channel ${year}:${identity}`,
      );
    }
    points.set(identity, point);
  }
  return Array.from(points.values());
}

function quantile(values: number[], probability: number): number {
  const sorted = values.slice().sort((left, right) => left - right);
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const fraction = position - lower;
  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

function rounded(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function instituteFold(instituteCode: string, folds: number): number {
  let hash = 0;
  for (const character of instituteCode) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash % folds;
}

type ResidualDistributions = {
  exact: Map<string, number[]>;
  stageCategoryRound: Map<string, number[]>;
  stageRound: Map<string, number[]>;
  round: Map<number, number[]>;
  global: number[];
};

function addResidual<Key>(
  distributions: Map<Key, number[]>,
  key: Key,
  residual: number,
): void {
  const values = distributions.get(key);
  if (values) {
    values.push(residual);
  } else {
    distributions.set(key, [residual]);
  }
}

function buildResidualDistributions(
  training: EvaluationResidual[],
): ResidualDistributions {
  const exact = new Map<string, number[]>();
  const stageCategoryRound = new Map<string, number[]>();
  const stageRound = new Map<string, number[]>();
  const round = new Map<number, number[]>();
  const global: number[] = [];
  for (const sample of training) {
    addResidual(
      exact,
      `${sample.round}:${sample.stageSemanticsId}:${sample.categoryFamily}:${sample.allocationScope}`,
      sample.residual,
    );
    addResidual(
      stageCategoryRound,
      `${sample.round}:${sample.stageSemanticsId}:${sample.categoryFamily}`,
      sample.residual,
    );
    addResidual(
      stageRound,
      `${sample.round}:${sample.stageSemanticsId}`,
      sample.residual,
    );
    addResidual(round, sample.round, sample.residual);
    global.push(sample.residual);
  }
  for (const values of [
    ...exact.values(),
    ...stageCategoryRound.values(),
    ...stageRound.values(),
    ...round.values(),
    global,
  ]) {
    values.sort((left, right) => left - right);
  }
  return { exact, stageCategoryRound, stageRound, round, global };
}

function selectResiduals(options: {
  distributions: ResidualDistributions;
  target: EvaluationResidual;
  minimumSize: number;
}): number[] {
  const candidates = [
    options.distributions.exact.get(
      `${options.target.round}:${options.target.stageSemanticsId}:${options.target.categoryFamily}:${options.target.allocationScope}`,
    ),
    options.distributions.stageCategoryRound.get(
      `${options.target.round}:${options.target.stageSemanticsId}:${options.target.categoryFamily}`,
    ),
    options.distributions.stageRound.get(
      `${options.target.round}:${options.target.stageSemanticsId}`,
    ),
    options.distributions.round.get(options.target.round),
  ];
  for (const candidate of candidates) {
    if (candidate && candidate.length >= options.minimumSize) {
      return candidate;
    }
  }
  return options.distributions.global;
}

function sortedQuantile(values: number[], probability: number): number {
  if (values.length === 1) return values[0];
  const position = (values.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const fraction = position - lower;
  return values[lower] * (1 - fraction) + values[upper] * fraction;
}

function bandOrder(probability: number): number {
  if (probability >= 0.85) return 0;
  if (probability >= 0.4) return 1;
  if (probability >= 0.1) return 2;
  return 3;
}

function monotonicityCheck(residuals: number[]): {
  checks: number;
  violations: number;
} {
  const futureClosingRanks = residuals
    .map((residual) => 1 + residual)
    .filter((rank) => Number.isFinite(rank) && rank > 0)
    .sort((left, right) => left - right);
  const candidateRanks = Array.from(new Set(futureClosingRanks));
  let previousProbability = 1;
  let previousBand = 0;
  let violations = 0;
  let belowCandidate = 0;
  for (const rank of candidateRanks) {
    while (
      belowCandidate < futureClosingRanks.length &&
      futureClosingRanks[belowCandidate] < rank
    ) {
      belowCandidate += 1;
    }
    const probability =
      (futureClosingRanks.length - belowCandidate) / futureClosingRanks.length;
    const band = bandOrder(probability);
    if (probability > previousProbability || band < previousBand) {
      violations += 1;
    }
    previousProbability = probability;
    previousBand = band;
  }
  return { checks: candidateRanks.length, violations };
}

export function evaluateMhtCetModel(options: {
  cutoffRows: MhtCetCutoffRow[];
  seatPools: MhtCetSeatPoolDefinition[];
  config: MhtCetModelConfiguration;
  folds?: number;
}): MhtCetEvaluationReport {
  const [earlierYear, latestYear] = options.config.source_years;
  const earlier = new Map(
    aggregate(options.cutoffRows, earlierYear).map((point) => [
      key(point),
      point,
    ]),
  );
  const latest = aggregate(options.cutoffRows, latestYear);
  const pools = new Map(options.seatPools.map((pool) => [pool.id, pool]));
  const residuals: EvaluationResidual[] = [];
  const absoluteErrors: number[] = [];
  let within10 = 0;
  let within20 = 0;

  for (const point of latest) {
    const previous = earlier.get(key(point));
    const pool = pools.get(point.seatPoolId);
    if (!previous || !pool?.predictable) continue;
    const absoluteError = Math.abs(point.rank - previous.rank);
    const relativeError = absoluteError / point.rank;
    absoluteErrors.push(absoluteError);
    if (relativeError <= 0.1) within10++;
    if (relativeError <= 0.2) within20++;
    residuals.push({
      ...point,
      categoryFamily: pool.category_id ?? `special-${pool.special_eligibility}`,
      allocationScope: point.allocationScopeId,
      residual: (point.rank - previous.rank) / previous.rank,
    });
  }
  if (residuals.length === 0) {
    throw new Error(
      "MHT-CET evaluation found no matching 2024→2025 round 1–3 records",
    );
  }

  const folds = options.folds ?? 5;
  const coverage = { 50: 0, 80: 0, 95: 0 };
  let evaluated = 0;
  let monotonicityChecks = 0;
  let monotonicityViolations = 0;
  const monotonicityByDistribution = new Map<
    number[],
    { checks: number; violations: number }
  >();
  for (let fold = 0; fold < folds; fold++) {
    const training = residuals.filter(
      (sample) => instituteFold(sample.instituteCode, folds) !== fold,
    );
    const holdout = residuals.filter(
      (sample) => instituteFold(sample.instituteCode, folds) === fold,
    );
    if (training.length === 0) continue;
    const distributions = buildResidualDistributions(training);
    for (const target of holdout) {
      const distribution = selectResiduals({
        distributions,
        target,
        minimumSize: options.config.minimum_stratum_size,
      });
      if (distribution.length === 0) continue;
      const previous = earlier.get(key(target));
      if (!previous) continue;
      if (!monotonicityByDistribution.has(distribution)) {
        monotonicityByDistribution.set(
          distribution,
          monotonicityCheck(distribution),
        );
      }
      for (const interval of [50, 80, 95] as const) {
        const tail = (1 - interval / 100) / 2;
        const lower = previous.rank * (1 + sortedQuantile(distribution, tail));
        const upper =
          previous.rank * (1 + sortedQuantile(distribution, 1 - tail));
        if (target.rank >= lower && target.rank <= upper) {
          coverage[interval]++;
        }
      }
      evaluated++;
    }
  }
  for (const monotonicity of monotonicityByDistribution.values()) {
    monotonicityChecks += monotonicity.checks;
    monotonicityViolations += monotonicity.violations;
  }
  if (evaluated === 0) {
    throw new Error("MHT-CET grouped calibration produced no holdout rows");
  }

  const pointWithin20 = within20 / absoluteErrors.length;
  const interval80 = coverage[80] / evaluated;
  const interval95 = coverage[95] / evaluated;
  const monotonicPassed =
    monotonicityChecks > 0 && monotonicityViolations === 0;
  const gates = {
    point_within_20_passed:
      pointWithin20 >= options.config.release_gates.within_20_percent_minimum,
    interval_80_passed:
      interval80 >= options.config.release_gates.interval_80_coverage_minimum &&
      interval80 <= options.config.release_gates.interval_80_coverage_maximum,
    interval_95_passed:
      interval95 >= options.config.release_gates.interval_95_coverage_minimum,
    monotonic_passed: monotonicPassed,
  };

  return {
    label: "mht-cet-2026-honest-evaluation",
    temporal_point_test: {
      label: "2024-point-forecast-to-2025",
      matched_records: absoluteErrors.length,
      mae: rounded(
        absoluteErrors.reduce((sum, error) => sum + error, 0) /
          absoluteErrors.length,
      ),
      median_absolute_error: rounded(quantile(absoluteErrors, 0.5)),
      within_10_percent: rounded(within10 / absoluteErrors.length),
      within_20_percent: rounded(pointWithin20),
    },
    grouped_uncertainty_calibration: {
      label: "institute-grouped-2024-to-2025",
      folds,
      evaluated_records: evaluated,
      interval_50_coverage: rounded(coverage[50] / evaluated),
      interval_80_coverage: rounded(interval80),
      interval_95_coverage: rounded(interval95),
    },
    band_monotonicity: {
      checks: monotonicityChecks,
      violations: monotonicityViolations,
    },
    band_outcomes_monotonic: monotonicPassed,
    release_gates: {
      ...gates,
      passed:
        gates.point_within_20_passed &&
        gates.interval_80_passed &&
        gates.interval_95_passed &&
        gates.monotonic_passed,
    },
  };
}
