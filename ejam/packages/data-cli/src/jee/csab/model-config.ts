/**
 * jam-csab-v2 hyperparams and DuckDB SQL for index build and backtest
 * CFI uses higher median blend and wider trend caps — CSAB CFI cutoffs are noisier than NIT/IIIT
 * production rank is an equal-weight average of best-split and cap-cfi10 instype profiles
 **/

export const JAM_CSAB_V2 = "jam-csab-v2";

export const CSAB_TUNED = {
  windowSize: 2 as const,
  yearWeights: [0.7, 0.3, 0, 0, 0] as const,
  trendCapPct: 0.06,
  trendGapMultiplier: 1.0,
  sigmaFloorPct: 0.03,
  sigmaInflation: 1.5,
  outlierGuardMultiplier: 2.5,
  medianBlend: 0.35,
  sparseYearsThreshold: 3,
};

export type CsabInstype = "NIT" | "CFI" | "IIIT";

export type CsabInstypeProfile = Partial<
  Record<CsabInstype, { medianBlend?: number; trendCapPct?: number }>
>;

export const CSAB_PROFILE_BEST_SPLIT: CsabInstypeProfile = {
  NIT: { medianBlend: 0.35 },
  CFI: { medianBlend: 0.6 },
  IIIT: { medianBlend: 0.4 },
};

export const CSAB_PROFILE_CAP_CFI10: CsabInstypeProfile = {
  NIT: { medianBlend: 0.35 },
  CFI: { medianBlend: 0.55, trendCapPct: 0.1 },
  IIIT: { medianBlend: 0.45, trendCapPct: 0.06 },
};

export const CSAB_PRODUCTION = {
  ensemble: [
    { label: "best-split", profile: CSAB_PROFILE_BEST_SPLIT, weight: 0.5 },
    { label: "cap-cfi10", profile: CSAB_PROFILE_CAP_CFI10, weight: 0.5 },
  ] as const,
};

function blendedMeanForProfileSql(
  profile: CsabInstypeProfile,
  alias: string,
): string {
  const defaultBlend = CSAB_TUNED.medianBlend;
  const defaultExpr = `(1-${defaultBlend})*${alias}.weighted_mean + ${defaultBlend}*${alias}.median_mean`;
  const cases: string[] = [];
  for (const instype of ["NIT", "CFI", "IIIT"] as const) {
    const blend = profile[instype]?.medianBlend;
    if (blend === undefined) continue;
    cases.push(
      `WHEN '${instype}' THEN (1-${blend})*${alias}.weighted_mean + ${blend}*${alias}.median_mean`,
    );
  }
  if (cases.length === 0) return defaultExpr;
  return `CASE ${alias}.instype ${cases.join(" ")} ELSE ${defaultExpr} END`;
}

function trendDeltaForProfileSql(
  profile: CsabInstypeProfile,
  predictionYear: number,
  alias: string,
): string {
  const { trendCapPct, trendGapMultiplier } = CSAB_TUNED;
  const defaultTrend = `GREATEST(LEAST(COALESCE(${alias}.trend_slope,0), ${alias}.weighted_mean*${trendCapPct}), -${alias}.weighted_mean*${trendCapPct}) * ${trendGapMultiplier} * (${predictionYear} - ${alias}.last_data_year)`;
  const cases: string[] = [];
  for (const instype of ["NIT", "CFI", "IIIT"] as const) {
    const cap = profile[instype]?.trendCapPct;
    if (cap === undefined) continue;
    cases.push(
      `WHEN '${instype}' THEN GREATEST(LEAST(COALESCE(${alias}.trend_slope,0), ${alias}.weighted_mean*${cap}), -${alias}.weighted_mean*${cap}) * ${trendGapMultiplier} * (${predictionYear} - ${alias}.last_data_year)`,
    );
  }
  if (cases.length === 0) return defaultTrend;
  return `CASE ${alias}.instype ${cases.join(" ")} ELSE ${defaultTrend} END`;
}

export function csabPredictedRankForProfileSql(
  profile: CsabInstypeProfile,
  predictionYear: number,
  alias = "s",
): string {
  const mean = blendedMeanForProfileSql(profile, alias);
  const trend = trendDeltaForProfileSql(profile, predictionYear, alias);
  return `ROUND(${mean} + ${trend})`;
}

export function csabEnsemblePredictedRankSql(
  predictionYear: number,
  alias = "s",
): string {
  const members = CSAB_PRODUCTION.ensemble;
  const totalWeight = members.reduce((sum, member) => sum + member.weight, 0);
  const weighted = members.map(
    (member) =>
      `(${csabPredictedRankForProfileSql(member.profile, predictionYear, alias)}) * ${member.weight}`,
  );
  return `ROUND((${weighted.join(" + ")}) / ${totalWeight}.0)`;
}
