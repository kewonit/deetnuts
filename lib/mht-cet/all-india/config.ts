// All India (MHT-CET CAP) cutoff collections by year and round.
export const ALL_INDIA_COLLECTIONS: Record<number, Record<number, string>> = {
  2026: {
    1: "2026_all_india_rounds_one",
    2: "2026_all_india_rounds_two",
    3: "2026_all_india_rounds_three",
    4: "2026_all_india_rounds_four",
  },
  2024: {
    1: "2024_all_india_rounds_one",
    2: "2024_all_india_rounds_two",
    3: "2024_all_india_rounds_three",
  },
};

export const ALL_INDIA_YEARS = Object.keys(ALL_INDIA_COLLECTIONS)
  .map(Number)
  .sort((a, b) => b - a);

export const ALL_INDIA_ROUNDS_BY_YEAR: Record<number, number[]> = Object.fromEntries(
  Object.entries(ALL_INDIA_COLLECTIONS).map(([year, rounds]) => [
    Number(year),
    Object.keys(rounds)
      .map(Number)
      .sort((a, b) => a - b),
  ]),
);

export const DEFAULT_ALL_INDIA_YEAR = ALL_INDIA_YEARS[0];
export const DEFAULT_ALL_INDIA_ROUND = 1;

export type AllIndiaSelection = { year: number; round: number; collection: string };

/** Valid year/round from untrusted input, falling back to the defaults. */
export function resolveAllIndiaSelection(year: unknown, round: unknown): AllIndiaSelection {
  const requestedYear = Number(year);
  const selectedYear = ALL_INDIA_COLLECTIONS[requestedYear] ? requestedYear : DEFAULT_ALL_INDIA_YEAR;
  const rounds = ALL_INDIA_COLLECTIONS[selectedYear];
  const requestedRound = Number(round);
  const selectedRound = rounds[requestedRound]
    ? requestedRound
    : rounds[DEFAULT_ALL_INDIA_ROUND]
      ? DEFAULT_ALL_INDIA_ROUND
      : Number(Object.keys(rounds)[0]);
  return { year: selectedYear, round: selectedRound, collection: rounds[selectedRound] };
}
