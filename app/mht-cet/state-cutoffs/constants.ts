// Constants
export const CATEGORY_GROUPS = {
  "All India (JEE Rank)": ["AI"],
  "Open Category (General)": [
    "GOPENS",
    "GOPENH",
    "GOPENO",
    "LOPENS",
    "LOPENH",
    "LOPENO",
  ],
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

export const COURSE_GROUPS = {
  "Computer Science & IT": [
    "Computer Engineering",
    "Computer Science",
    "Computer Science and Engineering",
    "Computer Science and Business Systems",
    "Computer Science and Design",
    "Computer Science and Information Technology",
    "Computer Science and Technology",
    "Computer Technology",
    "Information Technology",
    "Electronics and Computer Engineering",
    "Electronics and Computer Science",
    "Computer Engineering (Software Engineering)",
  ],
  "AI & Data Science": [
    "Artificial Intelligence",
    "Artificial Intelligence (AI) and Data Science",
    "Artificial Intelligence and Data Science",
    "Artificial Intelligence and Machine Learning",
    "Computer Science and Engineering (Artificial Intelligence)",
    "Computer Science and Engineering (Artificial Intelligence and Data Science)",
    "Computer Science and Engineering(Artificial Intelligence and Machine Learning)",
    "Computer Science and Engineering(Data Science)",
    "Data Engineering",
    "Data Science",
    "Robotics and Artificial Intelligence",
  ],
  "Cybersecurity & IoT": [
    "Cyber Security",
    "Computer Science and Engineering (Cyber Security)",
    "Computer Science and Engineering (Internet of Things and Cyber Security Including Block Chain Technology)",
    "Computer Science and Engineering (IoT)",
    "Computer Science and Engineering(Cyber Security)",
    "Internet of Things (IoT)",
    "Industrial IoT",
  ],
  "Electronics & Communication": [
    "Electronics Engineering",
    "Electronics Engineering ( VLSI Design and Technology)",
    "Electronics and Biomedical Engineering",
    "Electronics and Communication Engineering",
    "Electronics and Communication (Advanced Communication Technology)",
    "Electronics and Communication(Advanced Communication Technology)",
    "Electronics and Telecommunication Engg",
    "VLSI",
  ],
  "Electrical Engineering": [
    "Electrical Engineering",
    "Electrical Engg[Electronics and Power]",
    "Electrical and Computer Engineering",
    "Electrical and Electronics Engineering",
    "Electrical, Electronics and Power",
  ],
  "Mechanical Engineering": [
    "Mechanical Engineering",
    "Mechanical Engineering Automobile",
    "Mechanical Engineering[Sandwich]",
    "Mechanical & Automation Engineering",
    "Mechanical and Mechatronics Engineering (Additive Manufacturing)",
    "Production Engineering",
    "Production Engineering[Sandwich]",
    "Manufacturing Science and Engineering",
  ],
  "Civil & Environmental": [
    "Civil Engineering",
    "Civil Engineering and Planning",
    "Civil and Environmental Engineering",
    "Civil and infrastructure Engineering",
    "Structural Engineering",
  ],
  "Chemical & Process": [
    "Chemical Engineering",
    "Petro Chemical Engineering",
    "Oil Technology",
    "Oil Fats and Waxes Technology",
    "Oil and Paints Technology",
    "Oil,Oleochemicals and Surfactants Technology",
    "Pharmaceutical and Fine Chemical Technology",
    "Pharmaceuticals Chemistry and Technology",
  ],
  "Biotechnology & Food": [
    "Bio Technology",
    "Bio Medical Engineering",
    "Food Engineering and Technology",
    "Food Technology",
    "Food Technology And Management",
  ],
  "Textile & Materials": [
    "Textile Engineering / Technology",
    "Textile Technology",
    "Textile Chemistry",
    "Technical Textiles",
    "Fibres and Textile Processing Technology",
    "Man Made Textile Technology",
    "Fashion Technology",
    "Plastic Technology",
    "Plastic and Polymer Engineering",
    "Polymer Engineering and Technology",
    "Metallurgy and Material Technology",
  ],
  "Automation & Robotics": [
    "Automation and Robotics",
    "Mechatronics Engineering",
    "Robotics and Automation",
    "Instrumentation Engineering",
    "Instrumentation and Control Engineering",
  ],
  "Specialized Engineering": [
    "Aeronautical Engineering",
    "Agricultural Engineering",
    "Automobile Engineering",
    "Mining Engineering",
    "Fire Engineering",
    "Safety and Fire Engineering",
    "Dyestuff Technology",
    "Paints Technology",
    "Surface Coating Technology",
    "Paper and Pulp Technology",
    "Printing and Packing Technology",
    "Architectural Assistantship",
  ],
  "Emerging Technologies": ["5G"],
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

export const YEAR_OPTIONS = [
  { value: 2025, label: "2025" },
  { value: 2024, label: "2024" },
];

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

// 2025-specific round table map. Added when CAP 2025 rounds 2-4 data landed.
export const ROUND_CONFIG_2025: Record<number, string> = {
  1: "2025_mht_cet_round_one_cutoffs",
  2: "2025_mht_cet_round_two_cutoffs",
  3: "2025_mht_cet_round_three_cutoffs",
  4: "2025_mht_cet_round_four_cutoffs",
} as const;

// Per-year allowed rounds.
export const ROUNDS_BY_YEAR: Record<number, readonly number[]> = {
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

// Valid round numbers (any year).
export const VALID_ROUNDS = [1, 2, 3, 4] as const;
export type ValidRound = (typeof VALID_ROUNDS)[number];

// Default round selection.
export const DEFAULT_ROUND: ValidRound = 1;

// Validate round number.
export const isValidRound = (round: number): round is ValidRound => {
  return VALID_ROUNDS.includes(round as ValidRound);
};

// Is round valid for a given year? (Round 4 only exists for 2025.)
export const isRoundAvailableForYear = (
  round: number,
  year: number,
): boolean => {
  const allowed = ROUNDS_BY_YEAR[year];
  return Array.isArray(allowed) && allowed.includes(round);
};

// Get collection name for round with fallback.
export const getCollectionForRound = (round: number, year: number): string => {
  if (year === 2025) {
    const table = ROUND_CONFIG_2025[round];
    if (table) return table;
    console.warn(
      `Invalid round ${round} for year 2025, falling back to Round 1`,
    );
    return ROUND_CONFIG_2025[1];
  }
  if (!isValidRound(round) || round === 4) {
    console.warn(
      `Invalid round ${round} for year ${year}, falling back to Round 1`,
    );
    return ROUND_CONFIG[1].collection;
  }
  return ROUND_CONFIG[round].collection;
};

// Get display name for round with fallback.
export const getDisplayNameForRound = (round: number): string => {
  if (!isValidRound(round)) {
    return ROUND_CONFIG[1].displayName;
  }
  return ROUND_CONFIG[round].displayName;
};
