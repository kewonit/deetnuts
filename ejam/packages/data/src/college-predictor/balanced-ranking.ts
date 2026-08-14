/**
 * Balanced ranking — institute quality × branch desirability × chance.
 * See CONTEXT.md for product definitions.
 */

import type { CollegePredictorFilters, ProgramPrediction } from "./engine";

export interface InstituteRankingMeta {
  nirf_rank?: number | null;
}

export interface BalancedRankingOptions {
  instituteMeta: Map<string, InstituteRankingMeta>;
  branchFilterActive?: boolean;
}

const INSTYPE_BASE: Record<string, number> = {
  IIT: 95,
  NIT: 75,
  IIIT: 65,
  GFTI: 50,
  CFI: 55,
};

const BRANCH_TIERS: Array<{ test: (value: string) => boolean; score: number }> =
  [
    {
      test: (v) =>
        /\b(cse|cs|computer-science|computer science|computer)\b/i.test(v),
      score: 100,
    },
    {
      test: (v) =>
        /\b(ai|aiml|artificial intelligence|data-science|data science|machine-learning|machine learning)\b/i.test(
          v,
        ),
      score: 92,
    },
    {
      test: (v) => /\b(ece|electronics|electronic|communication)\b/i.test(v),
      score: 85,
    },
    {
      test: (v) => /\b(ee|electrical)\b/i.test(v),
      score: 80,
    },
    {
      test: (v) => /\b(me|mech|mechanical)\b/i.test(v),
      score: 72,
    },
    {
      test: (v) => /\b(ce|civil)\b/i.test(v),
      score: 68,
    },
    {
      test: (v) => /\b(chemical|chem)\b/i.test(v),
      score: 65,
    },
  ];

export function instituteMetaFromPrograms(
  programs: ProgramPrediction[],
): Map<string, InstituteRankingMeta> {
  const meta = new Map<string, InstituteRankingMeta>();
  for (const program of programs) {
    if (!meta.has(program.institute_id)) {
      meta.set(program.institute_id, {
        nirf_rank: program.nirf_rank ?? null,
      });
    }
  }
  return meta;
}

function compareBalancedRank(
  a: ProgramPrediction,
  b: ProgramPrediction,
): number {
  const scoreDiff = (b.balanced_score ?? 0) - (a.balanced_score ?? 0);
  if (scoreDiff !== 0) return scoreDiff;

  const instituteDiff = (b.institute_score ?? 0) - (a.institute_score ?? 0);
  if (instituteDiff !== 0) return instituteDiff;

  const branchDiff = (b.branch_score ?? 0) - (a.branch_score ?? 0);
  if (branchDiff !== 0) return branchDiff;

  const probDiff = b.cumulative_probability - a.cumulative_probability;
  if (probDiff !== 0) return probDiff;

  return a.predicted_closing_rank - b.predicted_closing_rank;
}

export function branchFilterActive(
  filters: CollegePredictorFilters | undefined,
): boolean {
  const branch = filters?.branch_name;
  if (!branch) return false;
  if (Array.isArray(branch)) return branch.some((b) => b.trim().length > 0);
  return branch.trim().length > 0;
}

export function computeBranchScore(
  programId: string,
  programName?: string,
): number {
  const haystack = `${programId} ${programName ?? ""}`.toLowerCase();
  for (const tier of BRANCH_TIERS) {
    if (tier.test(haystack)) return tier.score;
  }
  return 50;
}

export function computeInstituteScore(
  instype: string,
  nirfRank: number | null | undefined,
  predictedClosingRank: number,
  closingRankCeiling: number,
): number {
  let score = INSTYPE_BASE[instype] ?? 40;

  if (nirfRank != null && nirfRank > 0) {
    // lower NIRF rank is better — rank 1 ≈ +5, rank 200+ ≈ +0
    const nirfBonus = Math.max(0, 5 * (1 - (nirfRank - 1) / 199));
    score = Math.min(100, score + nirfBonus);
  } else if (closingRankCeiling > 0) {
    // tighter cutoffs (lower rank) imply stronger demand
    const competitiveness = 1 - predictedClosingRank / closingRankCeiling;
    score = Math.min(
      100,
      score * 0.7 + Math.max(0, competitiveness) * 100 * 0.3,
    );
  }

  return Math.round(score * 100) / 100;
}

export function computeBalancedScore(
  instituteScore: number,
  branchScore: number,
  chance: number,
  branchNeutral: boolean,
): number {
  const branchFactor = branchNeutral ? 100 : branchScore;
  const raw = (instituteScore / 100) * (branchFactor / 100) * chance;
  return Math.round(raw * 10000) / 10000;
}

export function applyBalancedRanking(
  programs: ProgramPrediction[],
  options: BalancedRankingOptions,
): ProgramPrediction[] {
  if (programs.length === 0) return [];

  const branchNeutral = options.branchFilterActive ?? false;
  const closingRankCeiling = Math.max(
    ...programs.map((p) => p.predicted_closing_rank),
  );

  const scored = programs.map((program) => {
    const nirf = options.instituteMeta.get(program.institute_id)?.nirf_rank;
    const instituteScore = computeInstituteScore(
      program.instype,
      nirf,
      program.predicted_closing_rank,
      closingRankCeiling,
    );
    const branchScore = computeBranchScore(
      program.program_id,
      program.program_name,
    );
    const balancedScore = computeBalancedScore(
      instituteScore,
      branchScore,
      program.cumulative_probability,
      branchNeutral,
    );

    return {
      ...program,
      nirf_rank: nirf ?? program.nirf_rank ?? null,
      institute_score: instituteScore,
      branch_score: branchScore,
      balanced_score: balancedScore,
    };
  });

  scored.sort(compareBalancedRank);
  return scored;
}

export function sortByBalancedScore(
  programs: ProgramPrediction[],
): ProgramPrediction[] {
  return [...programs].sort(compareBalancedRank);
}
