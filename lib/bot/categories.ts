import { OPEN_GENERAL_CATEGORY_CODES } from "@/lib/mht-cet/state-cutoffs/config";

export const BOT_CUTOFF_CATEGORY_GROUPS = [
  {
    id: "open",
    label: "Open Category (General)",
    aliases: [
      "open",
      "general",
      "open general",
      "open category",
      "open category general",
      "gopen",
      "lopen",
    ],
    codes: [...OPEN_GENERAL_CATEGORY_CODES],
  },
  {
    id: "obc",
    label: "OBC (Other Backward Classes)",
    aliases: ["obc", "other backward class", "other backward classes"],
    codes: ["GOBCH", "GOBCO", "GOBCS", "LOBCH", "LOBCO", "LOBCS"],
  },
  {
    id: "sc_st",
    label: "SC/ST (Scheduled Castes/Tribes)",
    aliases: [
      "sc/st",
      "sc st",
      "sc and st",
      "scst",
      "scheduled caste",
      "scheduled caste tribe",
      "scheduled castes tribes",
      "scheduled castes scheduled tribes",
      "scheduled castes/tribes",
    ],
    codes: [
      "GSCH",
      "GSCO",
      "GSCS",
      "LSCH",
      "LSCO",
      "LSCS",
      "GSTH",
      "GSTO",
      "GSTS",
      "LSTH",
      "LSTO",
      "LSTS",
    ],
  },
  {
    id: "sc",
    label: "SC (Scheduled Caste)",
    aliases: ["sc", "scheduled caste", "scheduled castes"],
    codes: ["GSCH", "GSCO", "GSCS", "LSCH", "LSCO", "LSCS"],
  },
  {
    id: "st",
    label: "ST (Scheduled Tribe)",
    aliases: ["st", "scheduled tribe", "scheduled tribes"],
    codes: ["GSTH", "GSTO", "GSTS", "LSTH", "LSTO", "LSTS"],
  },
  {
    id: "ews",
    label: "EWS (Economically Weaker Section)",
    aliases: ["ews", "economically weaker section"],
    codes: ["EWS"],
  },
  {
    id: "sebc",
    label: "SEBC",
    aliases: ["sebc", "socially educationally backward class"],
    codes: ["GSEBCH", "GSEBCO", "GSEBCS", "LSEBCH", "LSEBCO", "LSEBCS"],
  },
  {
    id: "vj_dt",
    label: "VJ/DT",
    aliases: ["vj", "vj/dt", "vj dt", "vimukta jati", "dt"],
    codes: ["GVJH", "GVJO", "GVJS", "LVJH", "LVJO", "LVJS"],
  },
  {
    id: "nt",
    label: "NT (All NT groups)",
    aliases: ["nt", "all nt", "nt all", "nomadic tribes"],
    codes: [
      "GNT1H",
      "GNT1O",
      "GNT1S",
      "LNT1H",
      "LNT1O",
      "LNT1S",
      "GNT2H",
      "GNT2O",
      "GNT2S",
      "LNT2H",
      "LNT2O",
      "LNT2S",
      "GNT3H",
      "GNT3O",
      "GNT3S",
      "LNT3H",
      "LNT3O",
      "LNT3S",
    ],
  },
  {
    id: "nt1",
    label: "NT1",
    aliases: ["nt1", "nt 1", "nomadic tribe 1"],
    codes: ["GNT1H", "GNT1O", "GNT1S", "LNT1H", "LNT1O", "LNT1S"],
  },
  {
    id: "nt2",
    label: "NT2",
    aliases: ["nt2", "nt 2", "nomadic tribe 2"],
    codes: ["GNT2H", "GNT2O", "GNT2S", "LNT2H", "LNT2O", "LNT2S"],
  },
  {
    id: "nt3",
    label: "NT3",
    aliases: ["nt3", "nt 3", "nomadic tribe 3"],
    codes: ["GNT3H", "GNT3O", "GNT3S", "LNT3H", "LNT3O", "LNT3S"],
  },
  {
    id: "tfws",
    label: "TFWS",
    aliases: ["tfws", "tuition fee waiver", "tuition fee waiver scheme"],
    codes: ["TFWS"],
  },
  {
    id: "orphan",
    label: "Orphan",
    aliases: ["orphan", "orphan category"],
    codes: ["ORPHAN"],
  },
  {
    id: "minority",
    label: "Minority",
    aliases: ["minority", "mi"],
    codes: ["MI"],
  },
] as const;

export type BotCutoffCategoryGroup =
  (typeof BOT_CUTOFF_CATEGORY_GROUPS)[number];
export type BotCutoffCategoryId = BotCutoffCategoryGroup["id"];

export const DEFAULT_BOT_CUTOFF_CATEGORY_ID: BotCutoffCategoryId = "open";

function normalizeCategoryToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[()]/g, " ")
    .replace(/[_/-]+/g, " ")
    .replace(/[.,;:!?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CATEGORY_BY_TOKEN = new Map<string, BotCutoffCategoryGroup>();

for (const group of BOT_CUTOFF_CATEGORY_GROUPS) {
  CATEGORY_BY_TOKEN.set(normalizeCategoryToken(group.id), group);
  CATEGORY_BY_TOKEN.set(normalizeCategoryToken(group.label), group);
  for (const alias of group.aliases) {
    CATEGORY_BY_TOKEN.set(normalizeCategoryToken(alias), group);
  }
}

export function resolveBotCutoffCategoryGroup(
  value: string | null | undefined,
) {
  if (!value) {
    return BOT_CUTOFF_CATEGORY_GROUPS.find(
      (group) => group.id === DEFAULT_BOT_CUTOFF_CATEGORY_ID,
    )!;
  }

  const normalized = normalizeCategoryToken(value);
  const exactMatch = CATEGORY_BY_TOKEN.get(normalized);
  if (exactMatch) return exactMatch;

  for (const [token, group] of CATEGORY_BY_TOKEN) {
    if (normalized.startsWith(`${token} `)) {
      return group;
    }
  }

  return null;
}

export function getSupportedBotCategoryLabels() {
  return BOT_CUTOFF_CATEGORY_GROUPS.map((group) => group.label).join(", ");
}
