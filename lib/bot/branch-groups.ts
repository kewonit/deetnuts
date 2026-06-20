import {
  COURSE_GROUPS,
  type CourseGroupLabel,
} from "@/lib/mht-cet/state-cutoffs/course-groups";

type BotBranchDefinition = {
  id: string;
  label: string;
  aliases: readonly string[];
  courseGroupLabels: readonly CourseGroupLabel[];
};

const BOT_BRANCH_GROUP_DEFINITIONS = [
  {
    id: "all",
    label: "All Branches",
    aliases: ["all", "any", "all branches", "all courses", "any branch"],
    courseGroupLabels: [],
  },
  {
    id: "cs_it",
    label: "Computer Science & IT",
    aliases: [
      "cs",
      "cse",
      "cs it",
      "cs and it",
      "cs-it",
      "computer",
      "computer science",
      "computer engineering",
      "information technology",
      "it",
      "software",
    ],
    courseGroupLabels: ["Computer Science & IT"],
  },
  {
    id: "ai_ds",
    label: "AI & Data Science",
    aliases: [
      "ai",
      "ai ds",
      "ai and ds",
      "ai-ds",
      "aids",
      "aiml",
      "ai ml",
      "ai and ml",
      "artificial intelligence",
      "data science",
      "machine learning",
      "ml",
    ],
    courseGroupLabels: ["AI & Data Science"],
  },
  {
    id: "cyber_iot",
    label: "Cybersecurity & IoT",
    aliases: [
      "cyber",
      "cybersecurity",
      "cyber security",
      "iot",
      "internet of things",
      "industrial iot",
      "blockchain",
      "security",
    ],
    courseGroupLabels: ["Cybersecurity & IoT"],
  },
  {
    id: "electronics_comm",
    label: "Electronics & Communication",
    aliases: [
      "ece",
      "etc",
      "entc",
      "extc",
      "electronics",
      "electronics communication",
      "electronics and communication",
      "telecommunication",
      "vlsi",
    ],
    courseGroupLabels: ["Electronics & Communication"],
  },
  {
    id: "electrical",
    label: "Electrical Engineering",
    aliases: [
      "electrical",
      "ee",
      "electrical electronics",
      "electrical and electronics",
      "power",
    ],
    courseGroupLabels: ["Electrical Engineering"],
  },
  {
    id: "mechanical",
    label: "Mechanical Engineering",
    aliases: [
      "mechanical",
      "mech",
      "production",
      "manufacturing",
      "automobile",
      "automation",
      "mechatronics",
    ],
    courseGroupLabels: ["Mechanical Engineering"],
  },
  {
    id: "civil_environmental",
    label: "Civil & Environmental",
    aliases: [
      "civil",
      "civil engineering",
      "environmental",
      "infrastructure",
      "structural",
    ],
    courseGroupLabels: ["Civil & Environmental"],
  },
  {
    id: "chemical_process",
    label: "Chemical & Process",
    aliases: ["chemical", "process", "petrochemical", "oil", "pharma"],
    courseGroupLabels: ["Chemical & Process"],
  },
  {
    id: "bio_food",
    label: "Biotechnology & Food",
    aliases: [
      "biotech",
      "biotechnology",
      "biomedical",
      "food",
      "food technology",
    ],
    courseGroupLabels: ["Biotechnology & Food"],
  },
  {
    id: "textile_materials",
    label: "Textile & Materials",
    aliases: [
      "textile",
      "textiles",
      "materials",
      "metallurgy",
      "polymer",
      "plastic",
      "fashion",
    ],
    courseGroupLabels: ["Textile & Materials"],
  },
  {
    id: "automation_robotics",
    label: "Automation & Robotics",
    aliases: [
      "robotics",
      "automation robotics",
      "automation and robotics",
      "instrumentation",
      "control",
    ],
    courseGroupLabels: ["Automation & Robotics"],
  },
  {
    id: "specialized",
    label: "Specialized Engineering",
    aliases: [
      "specialized",
      "specialised",
      "aeronautical",
      "agricultural",
      "mining",
      "fire",
      "printing",
      "architecture",
    ],
    courseGroupLabels: ["Specialized Engineering"],
  },
  {
    id: "emerging",
    label: "Emerging Technologies",
    aliases: ["emerging", "5g"],
    courseGroupLabels: ["Emerging Technologies"],
  },
] as const satisfies readonly BotBranchDefinition[];

export type BotBranchGroup = Omit<BotBranchDefinition, "courseGroupLabels"> & {
  courses: readonly string[];
};

export type BotBranchGroupId =
  (typeof BOT_BRANCH_GROUP_DEFINITIONS)[number]["id"];

export const DEFAULT_BOT_BRANCH_GROUP_ID: BotBranchGroupId = "all";

export const BOT_BRANCH_GROUPS: readonly BotBranchGroup[] =
  BOT_BRANCH_GROUP_DEFINITIONS.map((group) => ({
    id: group.id,
    label: group.label,
    aliases: group.aliases,
    courses: group.courseGroupLabels.flatMap((label) => COURSE_GROUPS[label]),
  }));

function normalizeBranchToken(value: string) {
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

const BRANCH_BY_TOKEN = new Map<string, BotBranchGroup>();

for (const group of BOT_BRANCH_GROUPS) {
  BRANCH_BY_TOKEN.set(normalizeBranchToken(group.id), group);
  BRANCH_BY_TOKEN.set(normalizeBranchToken(group.label), group);
  for (const alias of group.aliases) {
    BRANCH_BY_TOKEN.set(normalizeBranchToken(alias), group);
  }
}

export function resolveBotBranchGroup(value: string | null | undefined) {
  if (!value) {
    return BOT_BRANCH_GROUPS.find(
      (group) => group.id === DEFAULT_BOT_BRANCH_GROUP_ID,
    )!;
  }

  const normalized = normalizeBranchToken(value);
  const exactMatch = BRANCH_BY_TOKEN.get(normalized);
  if (exactMatch) return exactMatch;

  for (const [token, group] of BRANCH_BY_TOKEN) {
    if (normalized.startsWith(`${token} `)) {
      return group;
    }
  }

  return null;
}

export function matchesBotBranchGroup(
  courseName: string,
  group: BotBranchGroup,
) {
  if (group.id === DEFAULT_BOT_BRANCH_GROUP_ID) return true;

  const courseNameToken = normalizeBranchToken(courseName);
  return group.courses.some(
    (course) => normalizeBranchToken(course) === courseNameToken,
  );
}

export function getSupportedBotBranchLabels() {
  return BOT_BRANCH_GROUPS.map((group) => group.label).join(", ");
}
