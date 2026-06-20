import { OPEN_GENERAL_CATEGORY_CODES } from "@/lib/mht-cet/state-cutoffs/config";

export {
  DEFAULT_ROUND,
  DEFAULT_YEAR,
  OPEN_GENERAL_CATEGORY_CODES,
  OPEN_GENERAL_CATEGORY_GROUP_NAME,
  ROUND_CONFIG,
  ROUND_CONFIG_2025,
  ROUND_OPTIONS,
  ROUNDS_BY_YEAR,
  VALID_ROUNDS,
  YEAR_OPTIONS,
  getCollectionForRound,
  getDisplayNameForRound,
  isRoundAvailableForYear,
  isSupportedYear,
  isValidRound,
  type ValidRound,
} from "@/lib/mht-cet/state-cutoffs/config";
export { COURSE_GROUPS } from "@/lib/mht-cet/state-cutoffs/course-groups";

// Constants
export const CATEGORY_GROUPS: Record<string, string[]> = {
  "All India (JEE Rank)": ["AI"],
  "Open Category (General)": [...OPEN_GENERAL_CATEGORY_CODES],
  "OBC (Other Backward Classes)": [
    "GOBCS",
    "GOBCH",
    "GOBCO",
    "LOBCS",
    "LOBCH",
    "LOBCO",
  ],
  "SC/ST (Scheduled Castes/Tribes)": [
    "GSCS",
    "GSCH",
    "GSCO",
    "GSTS",
    "GSTH",
    "GSTO",
    "LSCS",
    "LSCH",
    "LSCO",
    "LSTS",
    "LSTH",
    "LSTO",
  ],
  "SEBC (Socially and Educationally Backward Classes)": [
    "GSEBCS",
    "GSEBCH",
    "GSEBCO",
    "LSEBCS",
    "LSEBCH",
    "LSEBCO",
  ],
  "VJ/DT (Vimukta Jati/Denotified Tribes)": [
    "GVJS",
    "GVJH",
    "GVJO",
    "LVJS",
    "LVJH",
    "LVJO",
  ],
  "Defence Personnel": [
    "DEFOPENS",
    "DEFOBCS",
    "DEFSCS",
    "DEFSTS",
    "DEFSEBCS",
    "DEFRVJS",
    "DEFRSC",
    "DEFRSCS",
    "DEFRSEBCS",
    "DEFRSTS",
    "DEFRNT1S",
    "DEFRNT2S",
    "DEFRNT3S",
  ],
  "Persons with Disabilities (PWD)": [
    "PWDOPENS",
    "PWDOPENH",
    "PWDOBCS",
    "PWDOBCH",
    "PWDSCS",
    "PWDSCH",
    "PWDRSTS",
    "PWDRSTH",
    "PWDRSCS",
    "PWDRSCH",
    "PWDRSEBCS",
    "PWDRSEBCH",
    "PWDRVJS",
    "PWDROBCS",
    "PWDROBCH",
    "PWDRNT1S",
    "PWDRNT2S",
    "PWDRNT3S",
  ],
  "Economically Weaker Sections (EWS)": ["EWS"],
  "Special Categories": ["ORPHAN", "TFWS", "MI"],
  "NRI/Foreign Nationals": [
    "GNT1H",
    "GNT1O",
    "GNT1S",
    "GNT2H",
    "GNT2O",
    "GNT2S",
    "GNT3H",
    "GNT3O",
    "GNT3S",
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
};

export const STATUS_OPTIONS = [
  {
    value: "Deemed University Autonomous",
    label: "Deemed University Autonomous",
  },
  { value: "Government", label: "Government" },
  { value: "Government Autonomous", label: "Government Autonomous" },
  {
    value: "Government-Aided Autonomous",
    label: "Government-Aided Autonomous",
  },
  { value: "Un-Aided", label: "Un-Aided" },
  { value: "Un-Aided Autonomous", label: "Un-Aided Autonomous" },
  {
    value: "Un-Aided Autonomous Linguistic Minority - Gujarathi",
    label: "Un-Aided Autonomous Linguistic Minority - Gujarathi",
  },
  {
    value: "Un-Aided Autonomous Linguistic Minority - Gujarathi(Jain)",
    label: "Un-Aided Autonomous Linguistic Minority - Gujarathi(Jain)",
  },
  {
    value: "Un-Aided Autonomous Linguistic Minority - Hindi",
    label: "Un-Aided Autonomous Linguistic Minority - Hindi",
  },
  {
    value: "Un-Aided Autonomous Linguistic Minority - Malyalam",
    label: "Un-Aided Autonomous Linguistic Minority - Malyalam",
  },
  {
    value: "Un-Aided Autonomous Linguistic Minority - Sindhi",
    label: "Un-Aided Autonomous Linguistic Minority - Sindhi",
  },
  {
    value: "Un-Aided Autonomous Linguistic Minority - Tamil",
    label: "Un-Aided Autonomous Linguistic Minority - Tamil",
  },
  {
    value: "Un-Aided Autonomous Religious Minority - Christian",
    label: "Un-Aided Autonomous Religious Minority - Christian",
  },
  {
    value: "Un-Aided Autonomous Religious Minority - Jain",
    label: "Un-Aided Autonomous Religious Minority - Jain",
  },
  {
    value: "Un-Aided Autonomous Religious Minority - Muslim",
    label: "Un-Aided Autonomous Religious Minority - Muslim",
  },
  {
    value: "Un-Aided Autonomous Religious Minority - Roman Catholics",
    label: "Un-Aided Autonomous Religious Minority - Roman Catholics",
  },
  {
    value: "Un-Aided Linguistic Minority - Gujar",
    label: "Un-Aided Linguistic Minority - Gujar",
  },
  {
    value: "Un-Aided Linguistic Minority - Gujarathi",
    label: "Un-Aided Linguistic Minority - Gujarathi",
  },
  {
    value: "Un-Aided Linguistic Minority - Hindi",
    label: "Un-Aided Linguistic Minority - Hindi",
  },
  {
    value: "Un-Aided Linguistic Minority - Malyalam",
    label: "Un-Aided Linguistic Minority - Malyalam",
  },
  {
    value: "Un-Aided Linguistic Minority - Punjabi",
    label: "Un-Aided Linguistic Minority - Punjabi",
  },
  {
    value: "Un-Aided Linguistic Minority - Sindhi",
    label: "Un-Aided Linguistic Minority - Sindhi",
  },
  {
    value: "Un-Aided Religious Minority - Christian",
    label: "Un-Aided Religious Minority - Christian",
  },
  {
    value: "Un-Aided Religious Minority - Jain",
    label: "Un-Aided Religious Minority - Jain",
  },
  {
    value: "Un-Aided Religious Minority - Muslim",
    label: "Un-Aided Religious Minority - Muslim",
  },
  {
    value: "Un-Aided Religious Minority - Roman Catholics",
    label: "Un-Aided Religious Minority - Roman Catholics",
  },
  { value: "University", label: "University" },
  { value: "University Autonomous", label: "University Autonomous" },
  { value: "University Department", label: "University Department" },
  {
    value: "University Managed (Un-Aided)",
    label: "University Managed (Un-Aided)",
  },
  {
    value: "University Managed Autonomous",
    label: "University Managed Autonomous",
  },
];

export const HOME_UNIVERSITY_OPTIONS = [
  { value: "Autonomous Institute", label: "Autonomous Institute" },
  { value: "Deemed to be University", label: "Deemed to be University" },
  {
    value: "Dr. Babasaheb Ambedkar Marathwada University",
    label: "Dr. Babasaheb Ambedkar Marathwada University",
  },
  {
    value: "Dr. Babasaheb Ambedkar Technological University Lonere",
    label: "Dr. Babasaheb Ambedkar Technological University Lonere",
  },
  { value: "Gondwana University", label: "Gondwana University" },
  {
    value: "Kavayitri Bahinabai Chaudhari North Maharashtra University Jalgaon",
    label: "Kavayitri Bahinabai Chaudhari North Maharashtra University Jalgaon",
  },
  { value: "Mumbai University", label: "Mumbai University" },
  {
    value: "Punyashlok Ahilyadevi Holkar Solapur University",
    label: "Punyashlok Ahilyadevi Holkar Solapur University",
  },
  {
    value: "Rashtrasant Tukadoji Maharaj Nagpur University",
    label: "Rashtrasant Tukadoji Maharaj Nagpur University",
  },
  { value: "SNDT Women s University", label: "SNDT Women s University" },
  {
    value: "Sant Gadge Baba Amravati University",
    label: "Sant Gadge Baba Amravati University",
  },
  {
    value: "Savitribai Phule Pune University",
    label: "Savitribai Phule Pune University",
  },
  { value: "Shivaji University", label: "Shivaji University" },
  {
    value: "Swami Ramanand Teerth Marathwada University Nanded",
    label: "Swami Ramanand Teerth Marathwada University Nanded",
  },
];

export const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 200];
