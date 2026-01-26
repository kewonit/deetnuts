// Category mappings for MHTCET data with smart grouping
export interface CategoryGroup {
  id: string;
  label: string;
  description: string;
  categories: string[];
}

export const MHTCET_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "general",
    label: "🏛️ General Categories",
    description: "Basic reservation categories",
    categories: [
      "DEFOBCS",
      "DEFOPENS",
      "DEFROBCS",
      "DEFRSCS",
      "DEFRSEBCS",
      "DEFRVJS",
      "DEFSCS",
      "DEFSEBCS",
      "DEFSTS",
    ],
  },
  {
    id: "general_home_other",
    label: "🏠 General (Home/Other/State)",
    description: "General categories with location specifications",
    categories: [
      "GOBCH",
      "GOBCO",
      "GOBCS",
      "GOPENH",
      "GOPENO",
      "GOPENS",
      "GSCH",
      "GSCO",
      "GSCS",
      "GSEBCH",
      "GSEBCO",
      "GSEBCS",
      "GSTH",
      "GSTO",
      "GSTS",
      "GVJH",
      "GVJO",
      "GVJS",
    ],
  },
  {
    id: "local",
    label: "🌍 Local Categories",
    description: "Local reservation categories with location specifications",
    categories: [
      "LOBCH",
      "LOBCO",
      "LOBCS",
      "LOPENH",
      "LOPENO",
      "LOPENS",
      "LSCH",
      "LSCO",
      "LSCS",
      "LSEBCH",
      "LSEBCO",
      "LSEBCS",
      "LSTH",
      "LSTO",
      "LSTS",
      "LVJH",
      "LVJO",
      "LVJS",
    ],
  },
  {
    id: "pwd",
    label: "♿ PWD Categories",
    description: "Person with Disability reservations",
    categories: [
      "PWDOBCH",
      "PWDOBCS",
      "PWDOPENH",
      "PWDOPENS",
      "PWDROBCH",
      "PWDROBCS",
      "PWDRSCH",
      "PWDRSCS",
      "PWDRSEBCH",
      "PWDRSEBCS",
      "PWDRSTH",
      "PWDRSTS",
      "PWDRVJS",
      "PWDSCH",
      "PWDSCS",
      "PWDSEBCS",
    ],
  },
  {
    id: "quota_gnt",
    label: "🎓 GNT Quota",
    description: "Government Non-Teaching quota categories",
    categories: [
      "GNT1H",
      "GNT1O",
      "GNT1S",
      "GNT2H",
      "GNT2O",
      "GNT2S",
      "GNT3H",
      "GNT3O",
      "GNT3S",
    ],
  },
  {
    id: "quota_lnt",
    label: "🏛️ LNT Quota",
    description: "Local Non-Teaching quota categories",
    categories: [
      "LNT1H",
      "LNT1O",
      "LNT1S",
      "LNT2H",
      "LNT2O",
      "LNT2S",
      "LNT3H",
      "LNT3O",
      "LNT3S",
    ],
  },
  {
    id: "special",
    label: "⭐ Special Categories",
    description: "Special reservation categories",
    categories: ["EWS", "ORPHAN", "TFWS", "MI"],
  },
];

// Create a flat list of all categories with their group information
export const ALL_CATEGORIES = MHTCET_CATEGORY_GROUPS.flatMap((group) =>
  group.categories.map((category) => ({
    value: category,
    label: category,
    group: group.label,
    groupId: group.id,
    description: getCategoryDescription(category),
  })),
);

// Helper function to get category description
function getCategoryDescription(category: string): string {
  // Defense categories
  if (category.startsWith("DEF")) {
    if (category.includes("OPEN")) return "Defense - Open Category";
    if (category.includes("OBC")) return "Defense - Other Backward Class";
    if (category.includes("SC")) return "Defense - Scheduled Caste";
    if (category.includes("ST")) return "Defense - Scheduled Tribe";
    if (category.includes("SEBC"))
      return "Defense - Socially & Educationally Backward Class";
    if (category.includes("VJ")) return "Defense - Vimukta Jati";
    return "Defense Category";
  }

  // PWD categories
  if (category.startsWith("PWD")) {
    let desc = "PWD - ";
    if (category.includes("OPEN")) desc += "Open Category";
    else if (category.includes("OBC")) desc += "Other Backward Class";
    else if (category.includes("SC")) desc += "Scheduled Caste";
    else if (category.includes("ST")) desc += "Scheduled Tribe";
    else if (category.includes("SEBC"))
      desc += "Socially & Educationally Backward Class";
    else if (category.includes("VJ")) desc += "Vimukta Jati";
    else desc += "General";
    return desc;
  }

  // General/Local categories with location suffixes
  if (category.includes("H")) return category + " - Home University";
  if (category.includes("O")) return category + " - Other University";
  if (category.includes("S")) return category + " - State Level";

  // GNT/LNT categories
  if (category.startsWith("GNT")) {
    const level = category.charAt(3);
    const suffix = category.slice(4);
    let desc = `Government Non-Teaching ${level} - `;
    if (suffix === "H") desc += "Home University";
    else if (suffix === "O") desc += "Other University";
    else if (suffix === "S") desc += "State Level";
    return desc;
  }

  if (category.startsWith("LNT")) {
    const level = category.charAt(3);
    const suffix = category.slice(4);
    let desc = `Local Non-Teaching ${level} - `;
    if (suffix === "H") desc += "Home University";
    else if (suffix === "O") desc += "Other University";
    else if (suffix === "S") desc += "State Level";
    return desc;
  }

  // Special categories
  switch (category) {
    case "EWS":
      return "Economically Weaker Section";
    case "ORPHAN":
      return "Orphan Category";
    case "TFWS":
      return "Tuition Fee Waiver Scheme";
    case "MI":
      return "Minority";
    default:
      return category;
  }
}

// Helper function to get category group
export function getCategoryGroup(category: string): CategoryGroup | undefined {
  return MHTCET_CATEGORY_GROUPS.find((group) =>
    group.categories.includes(category),
  );
}

// Create options for the multi-select filter
export const CATEGORY_OPTIONS = ALL_CATEGORIES.map((cat) => ({
  label: `${cat.label} - ${cat.description}`,
  value: cat.value,
  group: cat.group,
}));
