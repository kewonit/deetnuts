import type { MhtCetCollegeDetailModel } from "@/lib/admissions/types";
import { groupMhtCetPrograms } from "@/lib/admissions/mht-cet-seat-pool";
import {
  DEFAULT_MHT_CET_SEAT_VIEW,
  matchProgramSeat,
} from "@/lib/admissions/mht-cet-seat-view";
import { MHT_CET_HOME_UNIVERSITIES } from "@/lib/mht-cet/state-cutoffs/candidate-profile";

export interface MhtCetProgramHeadline {
  name: string;
  anchor: string;
  percentile: number | null;
  rank: number | null;
  pool: string;
}

export interface MhtCetCollegeSummary {
  programCount: number;
  ranked: MhtCetProgramHeadline[];
  top: MhtCetProgramHeadline | null;
  bottom: MhtCetProgramHeadline | null;
  homeSplit: boolean;
  seatPoolCount: number;
}

// Quoted percentiles are truncated so prose never overstates an official cutoff.
export function formatPercentile(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return (Math.trunc(value * 100) / 100).toFixed(2);
}

export function formatRank(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

export function headlineFigure(headline: MhtCetProgramHeadline): string {
  const percentile = `${formatPercentile(headline.percentile)} percentile`;
  return headline.rank ? `${percentile} (rank ${formatRank(headline.rank)})` : percentile;
}

// CET Cell lists put placeholders such as "Autonomous Institute" in the home
// university column; the normalized id still names the real university.
export function homeUniversityLabel(
  college: Pick<MhtCetCollegeDetailModel["college"], "homeUniversity" | "homeUniversityId">,
): string | null {
  const known = MHT_CET_HOME_UNIVERSITIES.find((option) => option.id === college.homeUniversityId);
  if (known) return known.label;
  const raw = college.homeUniversity?.trim();
  return raw && !/autonomous|state level|deemed/i.test(raw) ? raw : null;
}

export function summarizeMhtCetCollege(
  model: Pick<MhtCetCollegeDetailModel, "observations" | "college">,
): MhtCetCollegeSummary {
  const groups = groupMhtCetPrograms(model.observations);
  const headlines = groups.map((group): MhtCetProgramHeadline => {
    const row = matchProgramSeat(
      group.rows,
      DEFAULT_MHT_CET_SEAT_VIEW,
      model.college.homeUniversityId ?? null,
    );
    return {
      name: group.name,
      anchor: group.anchor,
      percentile: row?.percentileValue ?? null,
      rank: row?.rankValue ?? null,
      pool: row ? [row.poolLabel, row.poolScope].filter(Boolean).join(", ") : "",
    };
  });
  const ranked = headlines
    .filter((headline) => headline.percentile !== null)
    .sort((a, b) => (b.percentile ?? 0) - (a.percentile ?? 0));
  const top = ranked[0] ?? null;
  const bottom = ranked.length > 1 ? ranked[ranked.length - 1] : null;

  return {
    programCount: groups.length,
    ranked,
    top,
    bottom,
    homeSplit: model.observations.some(
      (row) => row.poolScope === "Home university" || row.poolScope === "Other university",
    ),
    seatPoolCount: new Set(model.observations.map((row) => row.category)).size,
  };
}
