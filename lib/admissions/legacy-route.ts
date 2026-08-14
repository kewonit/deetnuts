import { isRoundAvailableForYear, ROUNDS_BY_YEAR } from "@/lib/mht-cet/state-cutoffs/config";

const ROUND_ALIASES: Record<string, number> = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "round-1": 1,
  "round-2": 2,
  "round-3": 3,
  "round-4": 4,
  "round-one": 1,
  "round-two": 2,
  "round-three": 3,
  "round-four": 4,
};

export function parseLegacyMhtCetCutoffRoute(
  yearSegment: string,
  roundSegment: string,
): { year: number; round: number } | null {
  if (!/^\d{4}$/.test(yearSegment)) return null;
  const year = Number(yearSegment);
  if (!Object.hasOwn(ROUNDS_BY_YEAR, year)) return null;

  const round = ROUND_ALIASES[roundSegment.toLowerCase()];
  if (!round || !isRoundAvailableForYear(round, year)) return null;

  return { year, round };
}
