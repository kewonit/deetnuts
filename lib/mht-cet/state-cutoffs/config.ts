export const OPEN_GENERAL_CATEGORY_GROUP_NAME = "Open Category (General)";

export const OPEN_GENERAL_CATEGORY_CODES = [
  "GOPENS",
  "GOPENH",
  "GOPENO",
  "LOPENS",
  "LOPENH",
  "LOPENO",
] as const;

export const YEAR_OPTIONS = [
  { value: 2026, label: "2026" },
  { value: 2025, label: "2025" },
  { value: 2024, label: "2024" },
] as const;

// Round Configuration (2024 tables; canonical display names).
export const ROUND_CONFIG: Record<
  number,
  { collection: string; displayName: string }
> = {
  1: {
    collection: "2024_mht_cet_round_one_cutoffs_duplicate",
    displayName: "Round 1",
  },
  2: {
    collection: "2024_mht_cet_round_two_cutoffs",
    displayName: "Round 2",
  },
  3: {
    collection: "2024_mht_cet_round_three_cutoffs",
    displayName: "Round 3",
  },
  4: {
    collection: "2025_mht_cet_round_four_cutoffs",
    displayName: "Round 4",
  },
} as const;

export const ROUND_CONFIG_2025: Record<number, string> = {
  1: "2025_mht_cet_round_one_cutoffs",
  2: "2025_mht_cet_round_two_cutoffs",
  3: "2025_mht_cet_round_three_cutoffs",
  4: "2025_mht_cet_round_four_cutoffs",
} as const;

export const ROUND_CONFIG_2026: Record<number, string> = {
  1: "2026_mht_cet_round_one_cutoffs",
} as const;

export const ROUNDS_BY_YEAR: Record<number, readonly number[]> = {
  2026: [1],
  2024: [1, 2, 3],
  2025: [1, 2, 3, 4],
} as const;

export const ROUND_OPTIONS = [
  {
    value: 1,
    label: "Round 1",
    collection: "2024_mht_cet_round_one_cutoffs_duplicate",
  },
  {
    value: 2,
    label: "Round 2",
    collection: "2024_mht_cet_round_two_cutoffs",
  },
  {
    value: 3,
    label: "Round 3",
    collection: "2024_mht_cet_round_three_cutoffs",
  },
  {
    value: 4,
    label: "Round 4",
    collection: "2025_mht_cet_round_four_cutoffs",
  },
] as const;

export const VALID_ROUNDS = [1, 2, 3, 4] as const;
export type ValidRound = (typeof VALID_ROUNDS)[number];

export const DEFAULT_YEAR = 2026;
export const DEFAULT_ROUND: ValidRound = 1;

export const isValidRound = (round: number): round is ValidRound => {
  return VALID_ROUNDS.includes(round as ValidRound);
};

export const isSupportedYear = (
  year: number,
): year is keyof typeof ROUNDS_BY_YEAR => {
  return Object.hasOwn(ROUNDS_BY_YEAR, year);
};

export const isRoundAvailableForYear = (
  round: number,
  year: number,
): boolean => {
  const allowed = ROUNDS_BY_YEAR[year];
  return Array.isArray(allowed) && allowed.includes(round);
};

export const getCollectionForRound = (round: number, year: number): string => {
  if (!isSupportedYear(year)) {
    console.warn(
      `Invalid year ${year}, falling back to ${DEFAULT_YEAR} Round 1`,
    );
    return ROUND_CONFIG_2026[1];
  }
  const configuredTables: Record<number, string> =
    year === 2026
      ? ROUND_CONFIG_2026
      : year === 2025
        ? ROUND_CONFIG_2025
        : Object.fromEntries(
            Object.entries(ROUND_CONFIG).map(([key, value]) => [
              key,
              value.collection,
            ]),
          );
  const table = configuredTables[round];
  if (!table) {
    console.warn(
      `Invalid round ${round} for year ${year}, falling back to Round 1`,
    );
    return configuredTables[1];
  }
  return table;
};

export const getDisplayNameForRound = (round: number): string => {
  if (!isValidRound(round)) {
    return ROUND_CONFIG[1].displayName;
  }
  return ROUND_CONFIG[round].displayName;
};
