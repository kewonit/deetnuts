import { z } from "zod";

export const MHT_CET_HOME_UNIVERSITIES = [
  {
    id: "dr-babasaheb-ambedkar-marathwada-university",
    label: "Dr. Babasaheb Ambedkar Marathwada University",
  },
  {
    id: "swami-ramanand-teerth-marathwada-university-nanded",
    label: "Swami Ramanand Teerth Marathwada University, Nanded",
  },
  { id: "mumbai-university", label: "University of Mumbai" },
  {
    id: "kavayitri-bahinabai-chaudhari-north-maharashtra-university-jalgaon",
    label:
      "Kavayitri Bahinabai Chaudhari North Maharashtra University, Jalgaon",
  },
  {
    id: "savitribai-phule-pune-university",
    label: "Savitribai Phule Pune University",
  },
  { id: "shivaji-university", label: "Shivaji University, Kolhapur" },
  {
    id: "punyashlok-ahilyadevi-holkar-solapur-university",
    label: "Punyashlok Ahilyadevi Holkar Solapur University",
  },
  {
    id: "sant-gadge-baba-amravati-university",
    label: "Sant Gadge Baba Amravati University",
  },
  {
    id: "rashtrasant-tukadoji-maharaj-nagpur-university",
    label: "Rashtrasant Tukadoji Maharaj Nagpur University",
  },
  { id: "gondwana-university", label: "Gondwana University, Gadchiroli" },
] as const;

export const MHT_CET_CANDIDATURE_OPTIONS = [
  {
    value: "type-a",
    label: "Type A",
    description: "Schooling or birth in Maharashtra",
  },
  {
    value: "type-b",
    label: "Type B",
    description: "Maharashtra domicile",
  },
  {
    value: "type-c",
    label: "Type C",
    description: "Central Government employee parent",
  },
  {
    value: "type-d",
    label: "Type D",
    description: "Maharashtra Government employee parent",
  },
  {
    value: "type-e",
    label: "Type E",
    description: "Maharashtra–Karnataka border-area candidate",
  },
] as const;

export const MHT_CET_CATEGORY_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
  { value: "vj-dt", label: "VJ/DT" },
  { value: "nt-b", label: "NT-B" },
  { value: "nt-c", label: "NT-C" },
  { value: "nt-d", label: "NT-D" },
  { value: "obc", label: "OBC" },
  { value: "sebc", label: "SEBC" },
] as const;

export const MHT_CET_MINORITY_OPTIONS = [
  {
    value: "official-linguistic-minority-gujarathi",
    label: "Linguistic minority — Gujarati",
  },
  {
    value: "official-linguistic-minority-gujarathi-jain",
    label: "Linguistic minority — Gujarati Jain",
  },
  {
    value: "official-linguistic-minority-hindi",
    label: "Linguistic minority — Hindi",
  },
  {
    value: "official-linguistic-minority-malyalam",
    label: "Linguistic minority — Malyalam",
  },
  {
    value: "official-linguistic-minority-punjabi",
    label: "Linguistic minority — Punjabi",
  },
  {
    value: "official-linguistic-minority-sindhi",
    label: "Linguistic minority — Sindhi",
  },
  {
    value: "official-linguistic-minority-tamil",
    label: "Linguistic minority — Tamil",
  },
  {
    value: "official-religious-minority-christian",
    label: "Religious minority — Christian",
  },
  {
    value: "official-religious-minority-roman-catholics",
    label: "Religious minority — Roman Catholic",
  },
  {
    value: "official-religious-minority-jain",
    label: "Religious minority — Jain",
  },
  {
    value: "official-religious-minority-muslim",
    label: "Religious minority — Muslim",
  },
  {
    value: "official-linguistic-minority-gujar",
    label: "Linguistic minority — Gujar",
  },
] as const;

type HomeUniversityId =
  (typeof MHT_CET_HOME_UNIVERSITIES)[number]["id"];
type CandidatureId =
  (typeof MHT_CET_CANDIDATURE_OPTIONS)[number]["value"];
type CategoryId = (typeof MHT_CET_CATEGORY_OPTIONS)[number]["value"];
type MinorityId = (typeof MHT_CET_MINORITY_OPTIONS)[number]["value"];

export const MHT_CET_HOME_UNIVERSITY_IDS = MHT_CET_HOME_UNIVERSITIES.map(
  ({ id }) => id,
) as [HomeUniversityId, ...HomeUniversityId[]];
export const MHT_CET_CANDIDATURE_IDS = MHT_CET_CANDIDATURE_OPTIONS.map(
  ({ value }) => value,
) as [CandidatureId, ...CandidatureId[]];
export const MHT_CET_CATEGORY_IDS = MHT_CET_CATEGORY_OPTIONS.map(
  ({ value }) => value,
) as [CategoryId, ...CategoryId[]];
export const MHT_CET_MINORITY_IDS = MHT_CET_MINORITY_OPTIONS.map(
  ({ value }) => value,
) as [MinorityId, ...MinorityId[]];

export const MhtCetHomeUniversityIdSchema = z.enum(
  MHT_CET_HOME_UNIVERSITY_IDS,
);
export const MhtCetCandidatureTypeSchema = z.enum(
  MHT_CET_CANDIDATURE_IDS,
);
export const MhtCetCategoryIdSchema = z.enum(MHT_CET_CATEGORY_IDS);
export const MhtCetMinorityCommunityIdSchema = z.enum(
  MHT_CET_MINORITY_IDS,
);

export type MhtCetHomeUniversityId = z.infer<
  typeof MhtCetHomeUniversityIdSchema
>;
export type MhtCetCandidatureType = z.infer<
  typeof MhtCetCandidatureTypeSchema
>;
export type MhtCetCategoryId = z.infer<typeof MhtCetCategoryIdSchema>;
export type MhtCetMinorityCommunityId = z.infer<
  typeof MhtCetMinorityCommunityIdSchema
>;

export const MhtCetCandidateProfileSchema = z
  .object({
    candidatureType: MhtCetCandidatureTypeSchema,
    homeUniversityId: MhtCetHomeUniversityIdSchema.optional(),
    categoryId: MhtCetCategoryIdSchema,
    ladiesSeatEligible: z.boolean(),
    eligibilities: z
      .object({
        ewsCertificate: z.boolean(),
        tfwsEligible: z.boolean(),
        pwd: z.boolean(),
        orphanCertificate: z.boolean(),
        minorityCommunityId: MhtCetMinorityCommunityIdSchema.optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((profile, context) => {
    if (
      profile.candidatureType !== "type-e" &&
      !profile.homeUniversityId
    ) {
      context.addIssue({
        code: "custom",
        path: ["homeUniversityId"],
        message: "Home university is required for candidature Types A–D",
      });
    }
    if (profile.candidatureType === "type-e" && profile.homeUniversityId) {
      context.addIssue({
        code: "custom",
        path: ["homeUniversityId"],
        message: "Type E candidature does not use a home university",
      });
    }
    if (
      profile.eligibilities.ewsCertificate &&
      profile.categoryId !== "open"
    ) {
      context.addIssue({
        code: "custom",
        path: ["eligibilities", "ewsCertificate"],
        message: "EWS can only be combined with the Open category",
      });
    }
    if (profile.candidatureType === "type-e" && profile.eligibilities.pwd) {
      context.addIssue({
        code: "custom",
        path: ["eligibilities", "pwd"],
        message: "PwD reservation is unavailable to Type E candidature",
      });
    }
    if (
      profile.eligibilities.minorityCommunityId &&
      profile.candidatureType !== "type-a" &&
      profile.candidatureType !== "type-b"
    ) {
      context.addIssue({
        code: "custom",
        path: ["eligibilities", "minorityCommunityId"],
        message: "Minority reservation requires Type A or Type B candidature",
      });
    }
  });

export type MhtCetCandidateProfile = z.infer<
  typeof MhtCetCandidateProfileSchema
>;

export function isCandidateScoreValid(
  mode: "percentile" | "rank",
  value: string,
): boolean {
  if (!value.trim()) return false;
  const numericScore = Number(value);
  if (!Number.isFinite(numericScore)) return false;
  return mode === "rank"
    ? Number.isInteger(numericScore) &&
        numericScore >= 1 &&
        numericScore <= 1_000_000
    : numericScore >= 0 && numericScore <= 100;
}

const BASE_CATEGORY_CODES: Record<
  MhtCetCategoryId,
  { general: string[]; ladies: string[] }
> = {
  open: {
    general: ["GOPENH", "GOPENO", "GOPENS"],
    ladies: ["LOPENH", "LOPENO", "LOPENS"],
  },
  sc: {
    general: ["GSCH", "GSCO", "GSCS"],
    ladies: ["LSCH", "LSCO", "LSCS"],
  },
  st: {
    general: ["GSTH", "GSTO", "GSTS"],
    ladies: ["LSTH", "LSTO", "LSTS"],
  },
  "vj-dt": {
    general: ["GVJH", "GVJO", "GVJS"],
    ladies: ["LVJH", "LVJO", "LVJS"],
  },
  "nt-b": {
    general: ["GNT1H", "GNT1O", "GNT1S"],
    ladies: ["LNT1H", "LNT1O", "LNT1S"],
  },
  "nt-c": {
    general: ["GNT2H", "GNT2O", "GNT2S"],
    ladies: ["LNT2H", "LNT2O", "LNT2S"],
  },
  "nt-d": {
    general: ["GNT3H", "GNT3O", "GNT3S"],
    ladies: ["LNT3H", "LNT3O", "LNT3S"],
  },
  obc: {
    general: ["GOBCH", "GOBCO", "GOBCS"],
    ladies: ["LOBCH", "LOBCO", "LOBCS"],
  },
  sebc: {
    general: ["GSEBCH", "GSEBCO", "GSEBCS"],
    ladies: ["LSEBCH", "LSEBCO", "LSEBCS"],
  },
};

const PWD_CATEGORY_CODES: Partial<Record<MhtCetCategoryId, string[]>> = {
  open: ["PWDOPENH", "PWDOPENS"],
  obc: ["PWDOBCH", "PWDROBCH", "PWDOBCS", "PWDROBCS"],
  sc: ["PWDSCH", "PWDRSCH", "PWDSCS", "PWDRSCS"],
  st: ["PWDRSTH", "PWDRSTS"],
  "vj-dt": ["PWDRVJS"],
  "nt-b": ["PWDRNT1S"],
  "nt-c": ["PWDRNT2S"],
  "nt-d": ["PWDRNT3S"],
  sebc: ["PWDRSEBCH", "PWDSEBCS", "PWDRSEBCS"],
};

const MINORITY_INSTITUTE_IDS: Record<
  MhtCetMinorityCommunityId,
  string[]
> = {
  "official-linguistic-minority-gujarathi": [
    "official-linguistic-minority-gujarathi",
    "official-linguistic-minority-gujarathi-jain",
  ],
  "official-linguistic-minority-gujarathi-jain": [
    "official-linguistic-minority-gujarathi",
    "official-linguistic-minority-gujarathi-jain",
  ],
  "official-linguistic-minority-hindi": [
    "official-linguistic-minority-hindi",
  ],
  "official-linguistic-minority-malyalam": [
    "official-linguistic-minority-malyalam",
  ],
  "official-linguistic-minority-punjabi": [
    "official-linguistic-minority-punjabi",
  ],
  "official-linguistic-minority-sindhi": [
    "official-linguistic-minority-sindhi",
  ],
  "official-linguistic-minority-tamil": [
    "official-linguistic-minority-tamil",
  ],
  "official-religious-minority-christian": [
    "official-religious-minority-christian",
  ],
  "official-religious-minority-roman-catholics": [
    "official-religious-minority-christian",
    "official-religious-minority-roman-catholics",
  ],
  "official-religious-minority-jain": [
    "official-religious-minority-jain",
  ],
  "official-religious-minority-muslim": [
    "official-religious-minority-muslim",
  ],
  "official-linguistic-minority-gujar": [
    "official-linguistic-minority-gujar",
  ],
};

export interface DerivedSeatPools {
  categoryCodes: string[];
  ignoredRequestedCodes: string[];
  minorityInstituteIds: string[];
}

export function deriveEligibleSeatPools(
  profile: MhtCetCandidateProfile,
  requestedCodes: readonly string[] = [],
): DerivedSeatPools {
  const codes = new Set<string>();
  const addBaseCategory = (category: MhtCetCategoryId) => {
    BASE_CATEGORY_CODES[category].general.forEach((code) => codes.add(code));
    if (profile.ladiesSeatEligible) {
      BASE_CATEGORY_CODES[category].ladies.forEach((code) => codes.add(code));
    }
  };

  addBaseCategory("open");
  if (profile.categoryId !== "open") {
    addBaseCategory(profile.categoryId);
  }

  if (profile.eligibilities.ewsCertificate) codes.add("EWS");
  if (profile.eligibilities.tfwsEligible) codes.add("TFWS");
  if (profile.eligibilities.orphanCertificate) codes.add("ORPHAN");
  if (profile.eligibilities.pwd) {
    PWD_CATEGORY_CODES.open?.forEach((code) => codes.add(code));
    if (profile.categoryId !== "open") {
      PWD_CATEGORY_CODES[profile.categoryId]?.forEach((code) =>
        codes.add(code),
      );
    }
  }
  if (profile.eligibilities.minorityCommunityId) codes.add("MI");

  const allEligibleCodes = [...codes];
  const requested = [...new Set(requestedCodes)];
  const requestedEligibleCodes = requested.filter((code) => codes.has(code));

  return {
    categoryCodes:
      requested.length > 0 ? requestedEligibleCodes : allEligibleCodes,
    ignoredRequestedCodes: requested.filter((code) => !codes.has(code)),
    minorityInstituteIds: profile.eligibilities.minorityCommunityId
      ? MINORITY_INSTITUTE_IDS[
          profile.eligibilities.minorityCommunityId
        ] ?? []
      : [],
  };
}

export function groupEligibleSeatPoolCodes(
  codes: readonly string[],
): Record<string, string[]> {
  const codeSet = new Set(codes);
  const groups: Record<string, string[]> = {};
  const addGroup = (label: string, candidates: readonly string[]) => {
    const available = candidates.filter((code) => codeSet.has(code));
    if (available.length > 0) groups[label] = available;
  };

  for (const category of MHT_CET_CATEGORY_OPTIONS) {
    addGroup(
      `${category.label} · gender-neutral`,
      BASE_CATEGORY_CODES[category.value].general,
    );
    addGroup(
      `${category.label} · ladies`,
      BASE_CATEGORY_CODES[category.value].ladies,
    );
  }
  addGroup("Additional reservations", [
    "EWS",
    "TFWS",
    "ORPHAN",
    "MI",
    ...Object.values(PWD_CATEGORY_CODES).flatMap((value) => value ?? []),
  ]);

  return groups;
}

export function buildAllocationOrFilter(
  profile: MhtCetCandidateProfile,
): string {
  if (profile.candidatureType === "type-e") {
    return [
      "seat_allocation_section.eq.STATE_LEVEL",
      "seat_allocation_section.eq.HOME_TO_OTHER",
      "seat_allocation_section.eq.OTHER_TO_OTHER",
    ].join(",");
  }

  const homeUniversityId = profile.homeUniversityId;
  return [
    "seat_allocation_section.eq.STATE_LEVEL",
    `and(institute_home_university_id.eq.${homeUniversityId},seat_allocation_section.in.(HOME_TO_HOME,OTHER_TO_HOME))`,
    `and(institute_home_university_id.neq.${homeUniversityId},seat_allocation_section.in.(HOME_TO_OTHER,OTHER_TO_OTHER))`,
  ].join(",");
}

export function isAllocationSectionEligible(
  profile: MhtCetCandidateProfile,
  allocationSection: string | null | undefined,
  instituteHomeUniversityId: string | null | undefined,
): boolean {
  if (!allocationSection) return false;

  if (profile.candidatureType === "type-e") {
    return ["STATE_LEVEL", "HOME_TO_OTHER", "OTHER_TO_OTHER"].includes(
      allocationSection,
    );
  }

  if (allocationSection === "STATE_LEVEL") return true;
  if (!profile.homeUniversityId || !instituteHomeUniversityId) return false;

  const isHomeUniversity =
    profile.homeUniversityId === instituteHomeUniversityId;
  return isHomeUniversity
    ? ["HOME_TO_HOME", "OTHER_TO_HOME"].includes(allocationSection)
    : ["HOME_TO_OTHER", "OTHER_TO_OTHER"].includes(allocationSection);
}
