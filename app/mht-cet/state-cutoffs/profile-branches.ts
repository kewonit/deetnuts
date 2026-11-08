import type { AlternativeSeatPool, CutoffRecord } from "./types";

export type ProfileScoreMode = "percentile" | "rank";

type PoolRow = Pick<
  CutoffRecord,
  | "id"
  | "college_code"
  | "course_name"
  | "course_code"
  | "category"
  | "seat_allocation_section"
  | "last_rank"
  | "cutoff_score"
>;

const numeric = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
};

/**
 * A college offers one branch through several seat pools: each category the
 * candidate is eligible for, plus separate intakes with their own choice codes
 * (TFWS "T", and from 2026 the "E" intake). Same key as the bot's dedupe.
 */
export function profileBranchKey(row: Pick<PoolRow, "college_code" | "course_name">): string {
  return `${String(row.college_code).trim()}::${String(row.course_name).trim().toLowerCase()}`;
}

/** The profile list order: closest to the candidate first (matches the PocketBase sort). */
export function compareProfileRows(mode: ProfileScoreMode) {
  return (left: PoolRow, right: PoolRow): number => {
    const primary =
      mode === "rank"
        ? numeric(left.last_rank) - numeric(right.last_rank)
        : numeric(right.cutoff_score) - numeric(left.cutoff_score);
    if (primary !== 0 && !Number.isNaN(primary)) return primary;
    return String(left.id).localeCompare(String(right.id));
  };
}

/** True when `candidate` is an easier way in than `current` for this candidate. */
function isBetterRoute(mode: ProfileScoreMode, candidate: PoolRow, current: PoolRow): boolean {
  return mode === "rank"
    ? numeric(candidate.last_rank) > numeric(current.last_rank)
    : numeric(candidate.cutoff_score) < numeric(current.cutoff_score);
}

function toAlternative(row: PoolRow): AlternativeSeatPool {
  return {
    course_code: row.course_code,
    category: row.category,
    seat_allocation_section: row.seat_allocation_section,
    last_rank: numeric(row.last_rank),
    cutoff_score: numeric(row.cutoff_score),
  };
}

/**
 * Collapse every seat pool that matched a candidate profile into one row per
 * college branch. The kept row is the candidate's best route into the branch
 * (largest closing rank, or lowest cutoff percentile); the other pools ride
 * along as `alternative_pools`. Rows come back in the profile list order.
 */
export function collapseProfileRowsToBranches<T extends PoolRow>(
  rows: T[],
  mode: ProfileScoreMode,
): { rows: Array<T & { alternative_pools: AlternativeSeatPool[] }>; collapsedSeatPools: number } {
  const compare = compareProfileRows(mode);
  const groups = new Map<string, T[]>();
  for (const row of [...rows].sort(compare)) {
    const key = profileBranchKey(row);
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  const collapsed: Array<T & { alternative_pools: AlternativeSeatPool[] }> = [];
  for (const group of groups.values()) {
    let best = group[0];
    for (const row of group) {
      if (isBetterRoute(mode, row, best)) best = row;
    }
    collapsed.push({
      ...best,
      alternative_pools: group.filter((row) => row !== best).map(toAlternative),
    });
  }
  collapsed.sort(compare);
  return { rows: collapsed, collapsedSeatPools: rows.length - collapsed.length };
}
