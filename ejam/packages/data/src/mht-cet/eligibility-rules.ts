export const MHT_CET_HOME_UNIVERSITIES_2026 = [
  {
    id: "dr-babasaheb-ambedkar-marathwada-university",
    label: "Dr BAMU",
  },
  {
    id: "swami-ramanand-teerth-marathwada-university-nanded",
    label: "SRTM University, Nanded",
  },
  { id: "mumbai-university", label: "Mumbai University" },
  {
    id: "kavayitri-bahinabai-chaudhari-north-maharashtra-university-jalgaon",
    label: "KBC North Maharashtra University, Jalgaon",
  },
  {
    id: "savitribai-phule-pune-university",
    label: "Savitribai Phule Pune University",
  },
  { id: "shivaji-university", label: "Shivaji University" },
  {
    id: "punyashlok-ahilyadevi-holkar-solapur-university",
    label: "PAH Solapur University",
  },
  {
    id: "sant-gadge-baba-amravati-university",
    label: "SGBAU Amravati",
  },
  {
    id: "rashtrasant-tukadoji-maharaj-nagpur-university",
    label: "RTM Nagpur University",
  },
  { id: "gondwana-university", label: "Gondwana University" },
] as const;
export type MhtCetHomeUniversityId =
  (typeof MHT_CET_HOME_UNIVERSITIES_2026)[number]["id"];

export const MHT_CET_HOME_UNIVERSITY_BY_DISTRICT_2026: Readonly<
  Record<string, MhtCetHomeUniversityId>
> = {
  "Chhatrapati Sambhajinagar": "dr-babasaheb-ambedkar-marathwada-university",
  Beed: "dr-babasaheb-ambedkar-marathwada-university",
  Jalna: "dr-babasaheb-ambedkar-marathwada-university",
  Dharashiv: "dr-babasaheb-ambedkar-marathwada-university",
  Hingoli: "swami-ramanand-teerth-marathwada-university-nanded",
  Latur: "swami-ramanand-teerth-marathwada-university-nanded",
  Nanded: "swami-ramanand-teerth-marathwada-university-nanded",
  Parbhani: "swami-ramanand-teerth-marathwada-university-nanded",
  "Mumbai City": "mumbai-university",
  "Mumbai Suburban": "mumbai-university",
  Ratnagiri: "mumbai-university",
  Raigad: "mumbai-university",
  Palghar: "mumbai-university",
  Sindhudurg: "mumbai-university",
  Thane: "mumbai-university",
  Dhule: "kavayitri-bahinabai-chaudhari-north-maharashtra-university-jalgaon",
  Jalgaon: "kavayitri-bahinabai-chaudhari-north-maharashtra-university-jalgaon",
  Nandurbar:
    "kavayitri-bahinabai-chaudhari-north-maharashtra-university-jalgaon",
  Ahmednagar: "savitribai-phule-pune-university",
  Ahilyanagar: "savitribai-phule-pune-university",
  Nashik: "savitribai-phule-pune-university",
  Pune: "savitribai-phule-pune-university",
  Kolhapur: "shivaji-university",
  Sangli: "shivaji-university",
  Satara: "shivaji-university",
  Solapur: "punyashlok-ahilyadevi-holkar-solapur-university",
  Akola: "sant-gadge-baba-amravati-university",
  Amravati: "sant-gadge-baba-amravati-university",
  Buldhana: "sant-gadge-baba-amravati-university",
  Washim: "sant-gadge-baba-amravati-university",
  Yavatmal: "sant-gadge-baba-amravati-university",
  Bhandara: "rashtrasant-tukadoji-maharaj-nagpur-university",
  Gondia: "rashtrasant-tukadoji-maharaj-nagpur-university",
  Nagpur: "rashtrasant-tukadoji-maharaj-nagpur-university",
  Wardha: "rashtrasant-tukadoji-maharaj-nagpur-university",
  Chandrapur: "gondwana-university",
  Gadchiroli: "gondwana-university",
};

export function mhtCetHomeUniversityForDistrict2026(
  district: string,
): MhtCetHomeUniversityId {
  const homeUniversity = MHT_CET_HOME_UNIVERSITY_BY_DISTRICT_2026[district];
  if (!homeUniversity) {
    throw new Error(
      `district is absent from the reviewed 2026 CAP home-university rules: ${district}`,
    );
  }
  return homeUniversity;
}

export const MHT_CET_MINORITY_COMMUNITIES_2026 = [
  {
    id: "official-linguistic-minority-gujarathi",
    label: "Linguistic minority — Gujarati",
  },
  {
    id: "official-linguistic-minority-gujarathi-jain",
    label: "Linguistic minority — Gujarati Jain",
  },
  {
    id: "official-linguistic-minority-gujarathi-kutchhi",
    label: "Linguistic minority — Gujarati Kutchhi",
  },
  {
    id: "official-linguistic-minority-hindi",
    label: "Linguistic minority — Hindi",
  },
  {
    id: "official-linguistic-minority-hindi-bhojpuri",
    label: "Linguistic minority — Hindi (Bhojpuri)",
  },
  {
    id: "official-linguistic-minority-kannada",
    label: "Linguistic minority — Kannada",
  },
  {
    id: "official-linguistic-minority-malyalam",
    label: "Linguistic minority — Malyalam",
  },
  {
    id: "official-linguistic-minority-punjabi",
    label: "Linguistic minority — Punjabi",
  },
  {
    id: "official-linguistic-minority-sindhi",
    label: "Linguistic minority — Sindhi",
  },
  {
    id: "official-linguistic-minority-tamil",
    label: "Linguistic minority — Tamil",
  },
  {
    id: "official-religious-minority-buddhist",
    label: "Religious minority — Buddhist",
  },
  {
    id: "official-religious-minority-christian",
    label: "Religious minority — Christian",
  },
  {
    id: "official-religious-minority-christian-roman-catholics",
    label: "Religious minority — Christian (Roman Catholics)",
  },
  {
    id: "official-religious-minority-jain",
    label: "Religious minority — Jain",
  },
  {
    id: "official-religious-minority-muslim",
    label: "Religious minority — Muslim",
  },
  {
    id: "official-religious-minority-sikh",
    label: "Religious minority — Sikh",
  },
  {
    id: "official-religious-minority-parsi",
    label: "Religious minority — Parsi",
  },
  {
    id: "official-linguistic-minority-urdu",
    label: "Linguistic minority — Urdu",
  },
  {
    id: "official-religious-minority-zoroastrian",
    label: "Religious minority — Zoroastrian",
  },
  {
    id: "official-linguistic-minority-gujar",
    label: "Linguistic minority — Gujar",
  },
  {
    id: "official-linguistic-minority-konkani",
    label: "Linguistic minority — Konkani",
  },
] as const;
export type MhtCetMinorityCommunityId =
  (typeof MHT_CET_MINORITY_COMMUNITIES_2026)[number]["id"];

export const MHT_CET_MINORITY_INSTITUTE_RULES_2026 = [
  {
    id: "official-linguistic-minority-gujarathi",
    candidate_community_ids: [
      "official-linguistic-minority-gujarathi",
      "official-linguistic-minority-gujarathi-jain",
      "official-linguistic-minority-gujarathi-kutchhi",
    ],
  },
  {
    id: "official-linguistic-minority-gujarathi-jain",
    candidate_community_ids: [
      "official-linguistic-minority-gujarathi",
      "official-linguistic-minority-gujarathi-jain",
    ],
  },
  {
    id: "official-linguistic-minority-hindi",
    candidate_community_ids: [
      "official-linguistic-minority-hindi",
      "official-linguistic-minority-hindi-bhojpuri",
    ],
  },
  {
    id: "official-linguistic-minority-kannada",
    candidate_community_ids: ["official-linguistic-minority-kannada"],
  },
  {
    id: "official-linguistic-minority-malyalam",
    candidate_community_ids: ["official-linguistic-minority-malyalam"],
  },
  {
    id: "official-linguistic-minority-punjabi",
    candidate_community_ids: ["official-linguistic-minority-punjabi"],
  },
  {
    id: "official-linguistic-minority-sindhi",
    candidate_community_ids: ["official-linguistic-minority-sindhi"],
  },
  {
    id: "official-linguistic-minority-tamil",
    candidate_community_ids: ["official-linguistic-minority-tamil"],
  },
  {
    id: "official-religious-minority-buddhist",
    candidate_community_ids: ["official-religious-minority-buddhist"],
  },
  {
    id: "official-religious-minority-christian",
    candidate_community_ids: [
      "official-religious-minority-christian",
      "official-religious-minority-christian-roman-catholics",
    ],
  },
  {
    id: "official-religious-minority-jain",
    candidate_community_ids: ["official-religious-minority-jain"],
  },
  {
    id: "official-religious-minority-muslim",
    candidate_community_ids: ["official-religious-minority-muslim"],
  },
  {
    id: "official-religious-minority-roman-catholics",
    candidate_community_ids: [
      "official-religious-minority-christian-roman-catholics",
    ],
  },
  {
    id: "official-religious-minority-sikh",
    candidate_community_ids: ["official-religious-minority-sikh"],
  },
  {
    id: "official-religious-minority-jain-linguistic-minority-gujarathi",
    candidate_community_ids: [
      "official-linguistic-minority-gujarathi",
      "official-linguistic-minority-gujarathi-jain",
      "official-linguistic-minority-gujarathi-kutchhi",
      "official-religious-minority-jain",
    ],
  },
  {
    id: "official-religious-minority-parsi",
    candidate_community_ids: ["official-religious-minority-parsi"],
  },
  {
    id: "official-religious-minority-muslim-linguistic-minority-urdu",
    candidate_community_ids: [
      "official-linguistic-minority-urdu",
      "official-religious-minority-muslim",
    ],
  },
  {
    id: "official-religious-minority-zoroastrian",
    candidate_community_ids: ["official-religious-minority-zoroastrian"],
  },
  {
    id: "official-linguistic-minority-gujar",
    candidate_community_ids: ["official-linguistic-minority-gujar"],
  },
  {
    id: "official-religious-minority-parsi-gujarathi",
    candidate_community_ids: [
      "official-religious-minority-parsi",
      "official-linguistic-minority-gujarathi",
      "official-linguistic-minority-gujarathi-jain",
      "official-linguistic-minority-gujarathi-kutchhi",
    ],
  },
  {
    id: "official-linguistic-minority-konkani",
    candidate_community_ids: ["official-linguistic-minority-konkani"],
  },
] as const;
export type MhtCetMinorityInstituteStatusId =
  (typeof MHT_CET_MINORITY_INSTITUTE_RULES_2026)[number]["id"];

export function isMhtCetMinorityCommunityEligible2026(
  instituteStatusId: MhtCetMinorityInstituteStatusId | null,
  candidateCommunityId: MhtCetMinorityCommunityId | undefined,
): boolean {
  if (!instituteStatusId || !candidateCommunityId) return false;
  const rule = MHT_CET_MINORITY_INSTITUTE_RULES_2026.find(
    (entry) => entry.id === instituteStatusId,
  );
  return (
    rule?.candidate_community_ids.some(
      (candidateId) => candidateId === candidateCommunityId,
    ) ?? false
  );
}

export const MHT_CET_PWD_CATEGORIES_2026 = [
  { id: "locomotor-disability", label: "Locomotor disability" },
  { id: "leprosy-cured-person", label: "Leprosy cured person" },
  { id: "cerebral-palsy", label: "Cerebral palsy" },
  { id: "dwarfism", label: "Dwarfism" },
  { id: "muscular-dystrophy", label: "Muscular dystrophy" },
  { id: "acid-attack-victim", label: "Acid attack victim" },
  { id: "blindness", label: "Blindness" },
  { id: "low-vision", label: "Low vision" },
  { id: "deaf", label: "Deaf" },
  { id: "hard-of-hearing", label: "Hard of hearing" },
  {
    id: "speech-and-language-disability",
    label: "Speech and language disability",
  },
  { id: "intellectual-disability", label: "Intellectual disability" },
  {
    id: "specific-learning-disability",
    label: "Specific learning disability",
  },
  { id: "autism-spectrum-disorder", label: "Autism spectrum disorder" },
  { id: "mental-illness", label: "Mental illness" },
  { id: "multiple-sclerosis", label: "Multiple sclerosis" },
  { id: "parkinsons-disease", label: "Parkinson's disease" },
  { id: "haemophilia", label: "Haemophilia" },
  { id: "thalassemia", label: "Thalassemia" },
  { id: "sickle-cell-disease", label: "Sickle cell disease" },
  { id: "multiple-disabilities", label: "Multiple disabilities" },
] as const;
export type MhtCetPwdCategoryId =
  (typeof MHT_CET_PWD_CATEGORIES_2026)[number]["id"];

export const MHT_CET_ELIGIBILITY_RULES_2026 = {
  rules_year: 2026,
  source_id: "mht-cet.2026.brochure",
  pwd_minimum_benchmark_percent: 40,
  home_universities: MHT_CET_HOME_UNIVERSITIES_2026,
  home_university_by_district: MHT_CET_HOME_UNIVERSITY_BY_DISTRICT_2026,
  minority_communities: MHT_CET_MINORITY_COMMUNITIES_2026,
  minority_institute_rules: MHT_CET_MINORITY_INSTITUTE_RULES_2026,
  pwd_categories: MHT_CET_PWD_CATEGORIES_2026,
} as const;
