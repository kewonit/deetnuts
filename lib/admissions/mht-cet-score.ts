export type MhtCetScoreMode = "percentile" | "rank";

export interface MhtCetScore {
  mode: MhtCetScoreMode;
  value: number;
}

export type MhtCetVerdictStatus = "cleared" | "close" | "short";

export interface MhtCetVerdict {
  status: MhtCetVerdictStatus;
  // Positive when the score beats the closing cutoff, in percentile points or ranks.
  margin: number;
}

export const MHT_CET_SCORE_STORAGE_KEY = "deetnuts:mht-cet-score:v1";

// "Close" is a reading aid, not a prediction: within one percentile point, or
// a rank no more than 20% behind the closing rank.
const CLOSE_PERCENTILE_POINTS = 1;
const CLOSE_RANK_RATIO = 1.2;

export function parseMhtCetScore(mode: MhtCetScoreMode, raw: string): MhtCetScore | null {
  if (!raw.trim()) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  if (mode === "percentile" && (value < 0 || value > 100)) return null;
  if (mode === "rank" && (value < 1 || value > 1_000_000 || !Number.isInteger(value))) return null;
  return { mode, value };
}

export function readStoredMhtCetScore(raw: string | null): { mode: MhtCetScoreMode; text: string } | null {
  if (!raw || raw.length > 200) return null;
  try {
    const parsed = JSON.parse(raw) as { mode?: unknown; text?: unknown };
    if (parsed.mode !== "percentile" && parsed.mode !== "rank") return null;
    if (typeof parsed.text !== "string" || parsed.text.length > 20) return null;
    return { mode: parsed.mode, text: parsed.text };
  } catch {
    return null;
  }
}

export function compareMhtCetScore(
  row: { percentileValue?: number | null; rankValue?: number | null } | null,
  score: MhtCetScore | null,
): MhtCetVerdict | null {
  if (!row || !score) return null;
  if (score.mode === "percentile") {
    const closing = row.percentileValue;
    if (closing === null || closing === undefined || !Number.isFinite(closing)) return null;
    const margin = score.value - closing;
    return {
      margin,
      status: margin >= 0 ? "cleared" : -margin <= CLOSE_PERCENTILE_POINTS ? "close" : "short",
    };
  }
  const closing = row.rankValue;
  if (closing === null || closing === undefined || !Number.isFinite(closing) || closing <= 0) return null;
  const margin = closing - score.value;
  return {
    margin,
    status: margin >= 0 ? "cleared" : score.value <= closing * CLOSE_RANK_RATIO ? "close" : "short",
  };
}

export function formatMhtCetMargin(verdict: MhtCetVerdict, mode: MhtCetScoreMode): string {
  const amount = Math.abs(verdict.margin);
  const text =
    mode === "percentile"
      ? (Math.trunc(amount * 100) / 100).toFixed(2)
      : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
  return `${verdict.margin >= 0 ? "+" : "−"}${text}`;
}

export function describeMhtCetMargin(verdict: MhtCetVerdict, mode: MhtCetScoreMode): string {
  const unit = mode === "percentile" ? "percentile points" : "ranks";
  const amount = formatMhtCetMargin(verdict, mode).slice(1);
  return verdict.margin >= 0 ? `Cleared by ${amount} ${unit}` : `Short by ${amount} ${unit}`;
}

export interface PercentileScale {
  lo: number;
  hi: number;
}

// A shared axis for every row, so bars and the reader's marker line up.
export function percentileScale(values: Array<number | null | undefined>, extra?: number | null): PercentileScale {
  const finite = [...values, extra].filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  if (finite.length === 0) return { lo: 0, hi: 100 };
  const min = Math.min(...finite);
  const spread = 100 - min;
  const step = spread > 20 ? 10 : spread > 5 ? 5 : spread > 1 ? 1 : 0.5;
  const lo = Math.max(0, Math.floor((min - spread * 0.08) / step) * step);
  return { lo: Math.min(lo, 99.5), hi: 100 };
}

export function scalePosition(value: number, scale: PercentileScale): number {
  const position = (value - scale.lo) / (scale.hi - scale.lo);
  return Math.min(1, Math.max(0, position));
}

// Percentiles bunch up near 100, so tinting by closing rank on a log scale
// separates "hard" from "very hard" seats far better.
export function rankHeat(rank: number | null | undefined, ranks: Array<number | null | undefined>): number | null {
  if (rank === null || rank === undefined || !Number.isFinite(rank) || rank <= 0) return null;
  const finite = ranks.filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0);
  if (finite.length < 2) return 0.5;
  const lo = Math.log(Math.min(...finite));
  const hi = Math.log(Math.max(...finite));
  if (hi === lo) return 0.5;
  return 1 - (Math.log(rank) - lo) / (hi - lo);
}
