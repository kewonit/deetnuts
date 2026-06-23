import type { BotCutoffCategoryGroup } from "./categories";

type BotCutoffSubcategoryDefinition = {
  id: string;
  label: string;
  aliases: readonly string[];
  matches: (categoryCode: string) => boolean;
};

function normalizedCode(value: string) {
  return value.trim().toUpperCase();
}

function hasPrefix(prefix: "G" | "L") {
  return (categoryCode: string) =>
    normalizedCode(categoryCode).startsWith(prefix);
}

function hasSuffix(suffix: "H" | "O" | "S") {
  return (categoryCode: string) =>
    normalizedCode(categoryCode).endsWith(suffix);
}

function and(
  ...predicates: Array<(categoryCode: string) => boolean>
): (categoryCode: string) => boolean {
  return (categoryCode) =>
    predicates.every((predicate) => predicate(categoryCode));
}

export const BOT_CUTOFF_SUBCATEGORY_GROUPS = [
  {
    id: "all",
    label: "All subcategories",
    aliases: ["all", "any", "default", "all seats", "all subcategories"],
    matches: () => true,
  },
  {
    id: "gender_neutral",
    label: "Gender-neutral seats (G)",
    aliases: [
      "g",
      "general seats",
      "gender neutral",
      "gender-neutral",
      "gender neutral seats",
      "neutral",
    ],
    matches: hasPrefix("G"),
  },
  {
    id: "ladies",
    label: "Ladies seats (L)",
    aliases: ["l", "ladies", "lady", "female", "girls", "women"],
    matches: hasPrefix("L"),
  },
  {
    id: "home_university",
    label: "Home University (H)",
    aliases: ["h", "home", "home university", "home-university", "hu"],
    matches: hasSuffix("H"),
  },
  {
    id: "other_university",
    label: "Other University (O)",
    aliases: [
      "o",
      "other",
      "other university",
      "other than home",
      "other than home university",
      "outside home university",
      "ohu",
    ],
    matches: hasSuffix("O"),
  },
  {
    id: "state_level",
    label: "State Level (S)",
    aliases: ["s", "state", "state level", "state-level", "state seats"],
    matches: hasSuffix("S"),
  },
  {
    id: "gender_neutral_home",
    label: "Gender-neutral + Home University",
    aliases: [
      "gh",
      "g h",
      "gender neutral home",
      "gender-neutral home",
      "gender neutral home university",
    ],
    matches: and(hasPrefix("G"), hasSuffix("H")),
  },
  {
    id: "gender_neutral_other",
    label: "Gender-neutral + Other University",
    aliases: [
      "go",
      "g o",
      "gender neutral other",
      "gender-neutral other",
      "gender neutral other university",
    ],
    matches: and(hasPrefix("G"), hasSuffix("O")),
  },
  {
    id: "gender_neutral_state",
    label: "Gender-neutral + State Level",
    aliases: [
      "gs",
      "g s",
      "gender neutral state",
      "gender-neutral state",
      "gender neutral state level",
    ],
    matches: and(hasPrefix("G"), hasSuffix("S")),
  },
  {
    id: "ladies_home",
    label: "Ladies + Home University",
    aliases: ["lh", "l h", "ladies home", "ladies home university"],
    matches: and(hasPrefix("L"), hasSuffix("H")),
  },
  {
    id: "ladies_other",
    label: "Ladies + Other University",
    aliases: ["lo", "l o", "ladies other", "ladies other university"],
    matches: and(hasPrefix("L"), hasSuffix("O")),
  },
  {
    id: "ladies_state",
    label: "Ladies + State Level",
    aliases: ["ls", "l s", "ladies state", "ladies state level"],
    matches: and(hasPrefix("L"), hasSuffix("S")),
  },
] as const satisfies readonly BotCutoffSubcategoryDefinition[];

export type BotCutoffSubcategoryGroup =
  (typeof BOT_CUTOFF_SUBCATEGORY_GROUPS)[number];
export type BotCutoffSubcategoryId = BotCutoffSubcategoryGroup["id"];

export const DEFAULT_BOT_CUTOFF_SUBCATEGORY_ID: BotCutoffSubcategoryId = "all";

function normalizeSubcategoryToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[()+]/g, " ")
    .replace(/[_/-]+/g, " ")
    .replace(/[.,;:!?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SUBCATEGORY_BY_TOKEN = new Map<string, BotCutoffSubcategoryGroup>();

for (const group of BOT_CUTOFF_SUBCATEGORY_GROUPS) {
  SUBCATEGORY_BY_TOKEN.set(normalizeSubcategoryToken(group.id), group);
  SUBCATEGORY_BY_TOKEN.set(normalizeSubcategoryToken(group.label), group);
  for (const alias of group.aliases) {
    SUBCATEGORY_BY_TOKEN.set(normalizeSubcategoryToken(alias), group);
  }
}

export function resolveBotCutoffSubcategoryGroup(
  value: string | null | undefined,
) {
  if (!value) {
    return BOT_CUTOFF_SUBCATEGORY_GROUPS.find(
      (group) => group.id === DEFAULT_BOT_CUTOFF_SUBCATEGORY_ID,
    )!;
  }

  const normalized = normalizeSubcategoryToken(value);
  const exactMatch = SUBCATEGORY_BY_TOKEN.get(normalized);
  if (exactMatch) return exactMatch;

  for (const [token, group] of SUBCATEGORY_BY_TOKEN) {
    if (normalized.startsWith(`${token} `)) {
      return group;
    }
  }

  return null;
}

export function filterBotCategoryCodesBySubcategory(
  categoryGroup: BotCutoffCategoryGroup,
  subcategoryGroup: BotCutoffSubcategoryGroup,
) {
  return categoryGroup.codes.filter((code) => subcategoryGroup.matches(code));
}

export function getSupportedBotSubcategoryLabels() {
  return BOT_CUTOFF_SUBCATEGORY_GROUPS.map((group) => group.label).join(", ");
}
