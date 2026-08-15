#!/usr/bin/env tsx
/**
 * builds the JoSAA college predictor index from cutoff parquets (jam-josaa-v3)
 * prediction_year from EJAM_PREDICTION_YEAR, pool shift from nta-pool-stats or EJAM_POOL_SHIFT_PCT
 **/

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  resolveManifestVersionForBuild,
  writeIndexLineageSidecar,
} from "../../lib/index-lineage.js";
import { REPO_ROOT as ROOT } from "../../repo-root.js";
import {
  JAM_JOSAA_V3,
  JAM_TUNED,
  resolvePoolShiftPct,
  roundWeightCaseSql,
  yearWeightsCaseSql,
} from "./model-config.js";

const JOSAA_CUTOFFS = path.join(
  ROOT,
  "data",
  "datasets",
  "engineering",
  "jee",
  "josaa",
  "cutoffs",
);
const OUTPUT_DIR = path.join(
  ROOT,
  "data",
  "tools",
  "college-predictor",
  "josaa",
);
const OUTPUT_FILE = path.join(OUTPUT_DIR, "predictor-index.parquet");

function resolvePredictionYear(): number {
  const raw = process.env.EJAM_PREDICTION_YEAR;
  if (!raw) return new Date().getFullYear();
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 2000 || parsed > 2100) {
    throw new Error(`EJAM_PREDICTION_YEAR must be a 4-digit year, got: ${raw}`);
  }
  return parsed;
}

function findAllCutoffParquets(): string[] {
  const files: string[] = [];
  const years = fs
    .readdirSync(JOSAA_CUTOFFS)
    .filter((d) => d.startsWith("year="));
  for (const yearDir of years) {
    const rounds = fs
      .readdirSync(path.join(JOSAA_CUTOFFS, yearDir))
      .filter((d) => d.startsWith("round="));
    for (const roundDir of rounds) {
      const parquetPath = path.join(
        JOSAA_CUTOFFS,
        yearDir,
        roundDir,
        "cutoffs.parquet",
      );
      if (fs.existsSync(parquetPath)) files.push(parquetPath);
    }
  }
  return files;
}

function buildSQL(
  parquetFiles: string[],
  predictionYear: number,
  poolShiftPct: number,
): string {
  const unionParts = parquetFiles.map(
    (f) => `SELECT * FROM read_parquet('${f}')`,
  );
  const unionAll = unionParts.join("\nUNION ALL\n");
  const roundW = roundWeightCaseSql();
  const yearWeightCase = yearWeightsCaseSql();
  const {
    outlierGuardMultiplier,
    trendGapMultiplier,
    sigmaFloorPct,
    trendCapPct,
    windowSize,
    sparseYearsThreshold,
    sigmaInflation,
  } = JAM_TUNED;

  return `
CREATE TEMP TABLE raw_cutoffs AS
${unionAll};

-- normalize rounds (some years have 7, fold 7 into 6) and instype
-- the raw JoSAA PDFs encode IIITs as '3IT' — rewrite to canonical 'IIIT'
-- so no downstream code ever sees the raw artifact; CFI stays as-is
CREATE TEMP TABLE normalized AS
SELECT
  institute_id, program_id, seat_type, quota, gender,
  CASE WHEN instype = '3IT' THEN 'IIIT' ELSE instype END AS instype,
  degree, duration_years,
  year,
  LEAST(round, 6) AS round,
  closing_rank
FROM raw_cutoffs;

-- keep only the max closing_rank per (program, year, round) after normalization
CREATE TEMP TABLE deduped AS
SELECT
  institute_id, program_id, seat_type, quota, gender,
  instype, degree, duration_years,
  year, round,
  MAX(closing_rank) AS closing_rank
FROM normalized
GROUP BY institute_id, program_id, seat_type, quota, gender,
         instype, degree, duration_years, year, round;

-- jam-josaa-v3 anchor: per-year round-weighted closing rank (r1=1% … r6=60%)
CREATE TEMP TABLE anchor_round AS
SELECT
  institute_id, program_id, seat_type, quota, gender,
  ANY_VALUE(instype) AS instype,
  ANY_VALUE(degree) AS degree,
  ANY_VALUE(duration_years) AS duration_years,
  year,
  MAX(round) AS round,
  ROUND(
    SUM(closing_rank * ${roundW}) / SUM(${roundW})
  )::INTEGER AS closing_rank
FROM deduped
GROUP BY institute_id, program_id, seat_type, quota, gender, year;

-- last-round closing rank per year — used only for per-round trajectory columns
CREATE TEMP TABLE last_round AS
WITH ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY institute_id, program_id, seat_type, quota, gender, year
      ORDER BY round DESC
    ) AS rn
  FROM deduped
)
SELECT * FROM ranked WHERE rn = 1;

-- year weights from JAM_TUNED — COVID outlier guard collapses anomalous years to 0.01 weight
CREATE TEMP TABLE year_weights AS
WITH windowed AS (
  SELECT
    institute_id, program_id, seat_type, quota, gender, year, closing_rank,
    ROW_NUMBER() OVER (
      PARTITION BY institute_id, program_id, seat_type, quota, gender
      ORDER BY year DESC
    ) AS yr
  FROM anchor_round
  QUALIFY yr <= ${windowSize}
),
group_std AS (
  SELECT
    institute_id, program_id, seat_type, quota, gender,
    STDDEV_POP(closing_rank) AS inter_year_std
  FROM windowed
  GROUP BY institute_id, program_id, seat_type, quota, gender
),
median_others AS (
  SELECT
    a.institute_id, a.program_id, a.seat_type, a.quota, a.gender, a.year,
    MEDIAN(b.closing_rank) AS med_others
  FROM windowed a
  JOIN windowed b
    ON a.institute_id = b.institute_id
    AND a.program_id = b.program_id
    AND a.seat_type = b.seat_type
    AND a.quota = b.quota
    AND a.gender = b.gender
    AND a.year != b.year
  GROUP BY a.institute_id, a.program_id, a.seat_type, a.quota, a.gender, a.year
)
SELECT
  w.institute_id, w.program_id, w.seat_type, w.quota, w.gender,
  w.year, w.yr,
  CASE
    WHEN gs.inter_year_std IS NOT NULL
      AND gs.inter_year_std > 0
      AND mo.med_others IS NOT NULL
      AND ABS(w.closing_rank - mo.med_others) > ${outlierGuardMultiplier} * gs.inter_year_std
    THEN 0.01
    ELSE CASE w.yr ${yearWeightCase} END
  END AS w
FROM windowed w
LEFT JOIN group_std gs USING (institute_id, program_id, seat_type, quota, gender)
LEFT JOIN median_others mo USING (institute_id, program_id, seat_type, quota, gender, year);

-- per-round weighted means (for the round-by-round probability trajectory)
CREATE TEMP TABLE round_stats AS
SELECT
  d.institute_id, d.program_id, d.seat_type, d.quota, d.gender,
  d.round,
  ROUND(SUM(d.closing_rank * yw.w) / SUM(yw.w))::INTEGER AS round_weighted_mean
FROM deduped d
JOIN year_weights yw
  ON d.institute_id = yw.institute_id
  AND d.program_id = yw.program_id
  AND d.seat_type = yw.seat_type
  AND d.quota = yw.quota
  AND d.gender = yw.gender
  AND d.year = yw.year
GROUP BY d.institute_id, d.program_id, d.seat_type, d.quota, d.gender, d.round;

-- pivot per-round means into columns
CREATE TEMP TABLE round_pivot AS
SELECT
  institute_id, program_id, seat_type, quota, gender,
  MAX(CASE WHEN round = 1 THEN round_weighted_mean END) AS round1_mean,
  MAX(CASE WHEN round = 2 THEN round_weighted_mean END) AS round2_mean,
  MAX(CASE WHEN round = 3 THEN round_weighted_mean END) AS round3_mean,
  MAX(CASE WHEN round = 4 THEN round_weighted_mean END) AS round4_mean,
  MAX(CASE WHEN round = 5 THEN round_weighted_mean END) AS round5_mean,
  MAX(CASE WHEN round = 6 THEN round_weighted_mean END) AS round6_mean
FROM round_stats
GROUP BY institute_id, program_id, seat_type, quota, gender;

-- fill_round: weighted median of last-round-with-data per year
CREATE TEMP TABLE fill_rounds AS
WITH last_rounds AS (
  SELECT
    institute_id, program_id, seat_type, quota, gender, year,
    MAX(round) AS last_round
  FROM deduped
  GROUP BY institute_id, program_id, seat_type, quota, gender, year
)
SELECT
  lr.institute_id, lr.program_id, lr.seat_type, lr.quota, lr.gender,
  ROUND(SUM(lr.last_round * yw.w) / SUM(yw.w))::INTEGER AS fill_round
FROM last_rounds lr
JOIN year_weights yw
  ON lr.institute_id = yw.institute_id
  AND lr.program_id = yw.program_id
  AND lr.seat_type = yw.seat_type
  AND lr.quota = yw.quota
  AND lr.gender = yw.gender
  AND lr.year = yw.year
GROUP BY lr.institute_id, lr.program_id, lr.seat_type, lr.quota, lr.gender;

-- weighted overall stats using round-weighted anchor data
CREATE TEMP TABLE weighted AS
SELECT
  ar.institute_id, ar.program_id, ar.seat_type, ar.quota, ar.gender,
  ar.instype, ar.degree, ar.duration_years,
  ar.year, ar.closing_rank,
  yw.w, yw.yr
FROM anchor_round ar
JOIN year_weights yw
  ON ar.institute_id = yw.institute_id
  AND ar.program_id = yw.program_id
  AND ar.seat_type = yw.seat_type
  AND ar.quota = yw.quota
  AND ar.gender = yw.gender
  AND ar.year = yw.year;

CREATE TEMP TABLE wmean AS
SELECT
  institute_id, program_id, seat_type, quota, gender,
  SUM(closing_rank * w) / SUM(w) AS wm
FROM weighted
GROUP BY institute_id, program_id, seat_type, quota, gender;

CREATE TEMP TABLE stats AS
SELECT
  d.institute_id, d.program_id, d.seat_type, d.quota, d.gender,
  ANY_VALUE(d.instype) AS instype,
  ANY_VALUE(d.degree) AS degree,
  ANY_VALUE(d.duration_years) AS duration_years,
  ROUND(ANY_VALUE(m.wm))::INTEGER AS weighted_mean,
  ROUND(SQRT(SUM(d.w * POWER(d.closing_rank - m.wm, 2)) / SUM(d.w)))::INTEGER AS weighted_std,
  CASE
    WHEN (SUM(d.w * d.year * d.year) - POWER(SUM(d.w * d.year), 2) / SUM(d.w)) = 0 THEN 0
    ELSE ROUND(
      (SUM(d.w * d.year * d.closing_rank) - SUM(d.w * d.year) * SUM(d.w * d.closing_rank) / SUM(d.w))
      / (SUM(d.w * d.year * d.year) - POWER(SUM(d.w * d.year), 2) / SUM(d.w))
    )::INTEGER
  END AS trend_slope,
  COUNT(*)::INTEGER AS years_of_data,
  MAX(d.year)::INTEGER AS last_data_year,
  MIN(d.closing_rank)::INTEGER AS min_closing_rank,
  MAX(d.closing_rank)::INTEGER AS max_closing_rank
FROM weighted d
JOIN wmean m
  ON d.institute_id = m.institute_id
  AND d.program_id = m.program_id
  AND d.seat_type = m.seat_type
  AND d.quota = m.quota
  AND d.gender = m.gender
GROUP BY d.institute_id, d.program_id, d.seat_type, d.quota, d.gender;

-- final index
-- sigma_base: relative floor (3% of weighted_mean) so uncertainty scales with
-- the program's typical rank range rather than using a flat ±50 for everyone
-- trend_capped: clamp trend_slope to ±3% of weighted_mean per year — backtesting
-- showed uncapped trend overshoots on volatile programs and hurts accuracy
-- predicted_closing_rank: gap-aware projection using the capped trend
COPY (
  SELECT
    s.institute_id, s.program_id, s.seat_type, s.quota, s.gender,
    s.instype, s.degree, s.duration_years,
    s.weighted_mean,
    s.weighted_std,
    s.trend_slope,
    GREATEST(s.weighted_std, ROUND(s.weighted_mean * ${sigmaFloorPct}))::INTEGER AS sigma_base,
    CASE
      WHEN s.years_of_data < ${sparseYearsThreshold}
        THEN ROUND(GREATEST(s.weighted_std, s.weighted_mean * ${sigmaFloorPct}) * ${sigmaInflation})::INTEGER
      ELSE GREATEST(s.weighted_std, ROUND(s.weighted_mean * ${sigmaFloorPct}))::INTEGER
    END AS sigma_effective,
    ROUND(
      (
        s.weighted_mean
        + GREATEST(
            LEAST(COALESCE(s.trend_slope, 0), s.weighted_mean * ${trendCapPct}),
            -s.weighted_mean * ${trendCapPct}
          ) * ${trendGapMultiplier} * (${predictionYear} - s.last_data_year)
      ) * POWER(1 + ${poolShiftPct}, ${predictionYear} - s.last_data_year)
    )::INTEGER AS predicted_closing_rank,
    CASE
      WHEN s.years_of_data = 1 THEN 'pooled'
      WHEN s.years_of_data = 2 THEN 'inferred'
      WHEN s.years_of_data >= ${sparseYearsThreshold} THEN 'sufficient'
    END AS data_quality,
    s.years_of_data,
    s.last_data_year,
    s.min_closing_rank,
    s.max_closing_rank,
    rp.round1_mean,
    rp.round2_mean,
    rp.round3_mean,
    rp.round4_mean,
    rp.round5_mean,
    rp.round6_mean,
    COALESCE(fr.fill_round, 6)::INTEGER AS fill_round
  FROM stats s
  LEFT JOIN round_pivot rp
    ON s.institute_id = rp.institute_id
    AND s.program_id = rp.program_id
    AND s.seat_type = rp.seat_type
    AND s.quota = rp.quota
    AND s.gender = rp.gender
  LEFT JOIN fill_rounds fr
    ON s.institute_id = fr.institute_id
    AND s.program_id = fr.program_id
    AND s.seat_type = fr.seat_type
    AND s.quota = fr.quota
    AND s.gender = fr.gender
  ORDER BY s.instype, s.institute_id, s.program_id, s.seat_type, s.quota, s.gender
) TO '${OUTPUT_FILE}' (FORMAT PARQUET, COMPRESSION ZSTD);
  `;
}

async function main(): Promise<void> {
  const predictionYear = resolvePredictionYear();
  const poolShiftPct = resolvePoolShiftPct();
  console.log("Building college predictor index...");
  console.log(
    `algorithm=${JAM_JOSAA_V3}  prediction_year=${predictionYear}  pool_shift=${(poolShiftPct * 100).toFixed(2)}%`,
  );

  const parquetFiles = findAllCutoffParquets();
  console.log(`Found ${parquetFiles.length} cutoff parquet files`);

  if (parquetFiles.length === 0) {
    console.error("No cutoff parquet files found");
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const sql = buildSQL(parquetFiles, predictionYear, poolShiftPct);
  const sqlFile = path.join(OUTPUT_DIR, "_build_index.sql");
  fs.writeFileSync(sqlFile, sql, "utf-8");

  console.log("Running DuckDB...");
  try {
    execSync(`duckdb < "${sqlFile}"`, { cwd: ROOT, stdio: "inherit" });
  } catch (err) {
    console.error("DuckDB build failed:", err);
    process.exit(1);
  }

  if (fs.existsSync(OUTPUT_FILE)) {
    const stat = fs.statSync(OUTPUT_FILE);
    const manifestVersion = await resolveManifestVersionForBuild();
    const sidecar = writeIndexLineageSidecar({
      indexParquetPath: OUTPUT_FILE,
      indexDataset: "predictor_index",
      sourceCutoffPaths: parquetFiles,
      manifestVersion,
    });
    console.log(
      `Index built: ${OUTPUT_FILE} (${(stat.size / 1024).toFixed(1)} KB)`,
    );
    console.log(`Lineage sidecar: ${sidecar} (${parquetFiles.length} cutoffs)`);
  } else {
    console.error("Output file not created");
    process.exit(1);
  }

  fs.unlinkSync(sqlFile);
  console.log("Done");
}

main();
