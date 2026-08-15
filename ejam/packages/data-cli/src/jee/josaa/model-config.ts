/**
 * JoSAA index hyperparams for index build and backtest.
 * Production: jam-josaa-v3. jam-josaa-v2 is deprecated (see JAM_V2_*).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const JOSAA_MODEL_DIR = path.dirname(fileURLToPath(import.meta.url));

export const JAM_JOSAA_V3 = "jam-josaa-v3";

/**
 * @deprecated Replaced by jam-josaa-v3 (2026-06). Retained for sandbox baseline
 * and historical comparison only — do not use in index build or backtest.
 */
export const JAM_JOSAA_V2 = "jam-josaa-v2";

/** Active JoSAA algorithm id for index build and backtest. */
export const JAM_JOSAA = JAM_JOSAA_V3;

export const POOL_STATS_PATH = path.join(
  JOSAA_MODEL_DIR,
  "nta-pool-stats.json",
);

/** jam-josaa-v3 production pool shift (+3%/yr). Sandbox walk-forward winner. */
export const JAM_POOL_SHIFT_PCT = 0.03;

/** @deprecated jam-josaa-v2 pool shift (+1%/yr). */
export const JAM_V2_POOL_SHIFT_PCT = 0.01;

export const JAM_TUNED = {
  outlierGuardMultiplier: 2.5,
  sigmaFloorPct: 0.025,
  trendGapMultiplier: 0.7,
  trendCapPct: 0.03,
  windowSize: 4,
  yearWeights: [0.5, 0.3, 0.15, 0.05] as const,
  sigmaInflation: 1.5,
  sparseYearsThreshold: 3,
};

/**
 * jam-josaa-v3 round weights — later rounds dominate (r6=60%).
 * Sandbox phase-3 walk-forward winner: wf-rw-soft-p30.
 */
export const JAM_ROUND_WEIGHTS = {
  1: 0.01,
  2: 0.02,
  3: 0.05,
  4: 0.1,
  5: 0.22,
  6: 0.6,
} as const;

/**
 * @deprecated jam-josaa-v2 round weights (r1=5% … r6=38%).
 */
export const JAM_V2_ROUND_WEIGHTS = {
  1: 0.05,
  2: 0.08,
  3: 0.12,
  4: 0.15,
  5: 0.22,
  6: 0.38,
} as const;

export function loadNtaPoolShiftPct(): number {
  if (!fs.existsSync(POOL_STATS_PATH)) return JAM_POOL_SHIFT_PCT;
  const j = JSON.parse(fs.readFileSync(POOL_STATS_PATH, "utf8")) as {
    pool_calibration?: {
      sandbox_p7_super_a_default?: number;
      unique_appeared_yoy?: { implied_pool_shift_if_literal?: number };
    };
  };
  return (
    j.pool_calibration?.sandbox_p7_super_a_default ??
    j.pool_calibration?.unique_appeared_yoy?.implied_pool_shift_if_literal ??
    JAM_POOL_SHIFT_PCT
  );
}

/** EJAM_POOL_SHIFT_PCT overrides NTA-derived pool shift when set. */
export function resolvePoolShiftPct(): number {
  const raw = process.env.EJAM_POOL_SHIFT_PCT;
  if (raw !== undefined && raw !== "") {
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n) && n >= 0) return n;
    throw new Error(
      `EJAM_POOL_SHIFT_PCT must be a non-negative number, got: ${raw}`,
    );
  }
  return loadNtaPoolShiftPct();
}

/** SQL CASE expression weighting rounds for the anchor_round CTE. */
export function roundWeightCaseSql(
  weights: Record<number, number> = JAM_ROUND_WEIGHTS,
): string {
  return `CASE round
    WHEN 1 THEN ${weights[1]}
    WHEN 2 THEN ${weights[2]}
    WHEN 3 THEN ${weights[3]}
    WHEN 4 THEN ${weights[4]}
    WHEN 5 THEN ${weights[5]}
    WHEN 6 THEN ${weights[6]}
    ELSE 0.1
  END`;
}

/** SQL CASE mapping recency rank (yr=1 is latest year) to JAM_TUNED.yearWeights. */
export function yearWeightsCaseSql(): string {
  return JAM_TUNED.yearWeights
    .map((weight, index) => `WHEN ${index + 1} THEN ${weight}`)
    .join(" ");
}
