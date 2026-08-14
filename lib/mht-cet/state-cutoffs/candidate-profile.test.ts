import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolve } from "node:path";
import {
  MHT_CET_CATEGORY_OPTIONS,
  MHT_CET_HOME_UNIVERSITY_IDS,
  MHT_CET_MINORITY_OPTIONS,
  MhtCetCandidateProfileSchema,
  buildAllocationOrFilter,
  deriveEligibleSeatPools,
  isAllocationSectionEligible,
  isCandidateScoreValid,
  type MhtCetCandidateProfile,
} from "./candidate-profile";

const puneUniversity = "savitribai-phule-pune-university" as const;

function createProfile(
  overrides: Partial<MhtCetCandidateProfile> = {},
): MhtCetCandidateProfile {
  return {
    candidatureType: "type-a",
    homeUniversityId: puneUniversity,
    categoryId: "open",
    ladiesSeatEligible: false,
    eligibilities: {
      ewsCertificate: false,
      tfwsEligible: false,
      pwd: false,
      orphanCertificate: false,
      ...overrides.eligibilities,
    },
    ...overrides,
  };
}

test("validates candidature-dependent profile combinations", () => {
  assert.equal(MhtCetCandidateProfileSchema.safeParse(createProfile()).success, true);
  assert.equal(
    MhtCetCandidateProfileSchema.safeParse(
      createProfile({ homeUniversityId: undefined }),
    ).success,
    false,
  );
  assert.equal(
    MhtCetCandidateProfileSchema.safeParse(
      createProfile({
        candidatureType: "type-e",
        homeUniversityId: puneUniversity,
      }),
    ).success,
    false,
  );
  assert.equal(
    MhtCetCandidateProfileSchema.safeParse(
      createProfile({
        candidatureType: "type-e",
        homeUniversityId: undefined,
        eligibilities: {
          ...createProfile().eligibilities,
          pwd: true,
        },
      }),
    ).success,
    false,
  );
});

test("validates EWS and minority restrictions", () => {
  assert.equal(
    MhtCetCandidateProfileSchema.safeParse(
      createProfile({
        categoryId: "obc",
        eligibilities: {
          ...createProfile().eligibilities,
          ewsCertificate: true,
        },
      }),
    ).success,
    false,
  );
  assert.equal(
    MhtCetCandidateProfileSchema.safeParse(
      createProfile({
        candidatureType: "type-c",
        eligibilities: {
          ...createProfile().eligibilities,
          minorityCommunityId: "official-religious-minority-muslim",
        },
      }),
    ).success,
    false,
  );
});

test("includes Open pools with every reserved category", () => {
  for (const category of MHT_CET_CATEGORY_OPTIONS) {
    const derived = deriveEligibleSeatPools(
      createProfile({ categoryId: category.value }),
    );
    assert.ok(derived.categoryCodes.includes("GOPENH"));
    assert.ok(derived.categoryCodes.includes("GOPENO"));
    assert.ok(derived.categoryCodes.includes("GOPENS"));
    assert.equal(
      derived.categoryCodes.length,
      category.value === "open" ? 3 : 6,
    );
  }
});

test("adds ladies and supported special pools only when eligible", () => {
  const derived = deriveEligibleSeatPools(
    createProfile({
      categoryId: "obc",
      ladiesSeatEligible: true,
      eligibilities: {
        ewsCertificate: false,
        tfwsEligible: true,
        pwd: true,
        orphanCertificate: true,
        minorityCommunityId: "official-religious-minority-muslim",
      },
    }),
  );

  assert.ok(derived.categoryCodes.includes("LOPENH"));
  assert.ok(derived.categoryCodes.includes("LOBCH"));
  assert.ok(derived.categoryCodes.includes("TFWS"));
  assert.ok(derived.categoryCodes.includes("ORPHAN"));
  assert.ok(derived.categoryCodes.includes("PWDOPENH"));
  assert.ok(derived.categoryCodes.includes("PWDOBCH"));
  assert.ok(derived.categoryCodes.includes("MI"));
  assert.deepEqual(derived.minorityInstituteIds, [
    "official-religious-minority-muslim",
  ]);
});

test("raw source codes can only narrow the derived eligible set", () => {
  const derived = deriveEligibleSeatPools(createProfile(), [
    "GOPENH",
    "LOPENH",
    "DEFOPENS",
    "GOPENH",
  ]);

  assert.deepEqual(derived.categoryCodes, ["GOPENH"]);
  assert.deepEqual(derived.ignoredRequestedCodes, ["LOPENH", "DEFOPENS"]);
});

test("accepts only complete percentile and merit-rank values", () => {
  for (const percentile of ["0", "95.5", "100"]) {
    assert.equal(isCandidateScoreValid("percentile", percentile), true);
  }
  for (const percentile of ["", ".", "-1", "100.0001", "not-a-score"]) {
    assert.equal(isCandidateScoreValid("percentile", percentile), false);
  }
  for (const rank of ["1", "2832", "1000000"]) {
    assert.equal(isCandidateScoreValid("rank", rank), true);
  }
  for (const rank of ["", "0", "1.5", "1000001", "not-a-rank"]) {
    assert.equal(isCandidateScoreValid("rank", rank), false);
  }
});

test("builds HU/OHU filters from normalized institute home university", () => {
  assert.equal(
    buildAllocationOrFilter(createProfile()),
    [
      "seat_allocation_section.eq.STATE_LEVEL",
      `and(institute_home_university_id.eq.${puneUniversity},seat_allocation_section.in.(HOME_TO_HOME,OTHER_TO_HOME))`,
      `and(institute_home_university_id.neq.${puneUniversity},seat_allocation_section.in.(HOME_TO_OTHER,OTHER_TO_OTHER))`,
    ].join(","),
  );

  assert.equal(
    buildAllocationOrFilter(
      createProfile({
        candidatureType: "type-e",
        homeUniversityId: undefined,
      }),
    ),
    [
      "seat_allocation_section.eq.STATE_LEVEL",
      "seat_allocation_section.eq.HOME_TO_OTHER",
      "seat_allocation_section.eq.OTHER_TO_OTHER",
    ].join(","),
  );
});

test("checks allocation eligibility against the institute home university", () => {
  const homeCandidate = createProfile();
  assert.equal(
    isAllocationSectionEligible(homeCandidate, "HOME_TO_HOME", puneUniversity),
    true,
  );
  assert.equal(
    isAllocationSectionEligible(homeCandidate, "HOME_TO_OTHER", puneUniversity),
    false,
  );
  assert.equal(
    isAllocationSectionEligible(homeCandidate, "HOME_TO_OTHER", "mumbai-university"),
    true,
  );
  assert.equal(
    isAllocationSectionEligible(homeCandidate, "HOME_TO_HOME", "mumbai-university"),
    false,
  );

  const borderCandidate = createProfile({
    candidatureType: "type-e",
    homeUniversityId: undefined,
  });
  assert.equal(
    isAllocationSectionEligible(borderCandidate, "STATE_LEVEL", null),
    true,
  );
  assert.equal(
    isAllocationSectionEligible(borderCandidate, "HOME_TO_OTHER", null),
    true,
  );
  assert.equal(
    isAllocationSectionEligible(borderCandidate, "HOME_TO_HOME", null),
    false,
  );
});

test("checked-in eJAM map is normalized, unique, and complete by year", () => {
  const mapPath = resolve(
    process.cwd(),
    "lib/mht-cet/state-cutoffs/institute-eligibility.generated.json",
  );
  const generated = JSON.parse(readFileSync(mapPath, "utf8")) as {
    schema_version: number;
    generated_from: string;
    source_sha256: string;
    institutes: Array<{
      year: number;
      institute_code: string;
      institute_home_university_id: string;
      affiliating_university_id: string;
      minority_community_id: string | null;
    }>;
  };

  assert.equal(generated.schema_version, 1);
  assert.equal(generated.generated_from, "github/ejam");
  assert.match(generated.source_sha256, /^[a-f0-9]{64}$/);
  assert.equal(generated.institutes.length, 726);

  const keys = new Set<string>();
  for (const institute of generated.institutes) {
    assert.match(institute.institute_code, /^\d{5}$/);
    assert.ok(
      MHT_CET_HOME_UNIVERSITY_IDS.includes(
        institute.institute_home_university_id as
          (typeof MHT_CET_HOME_UNIVERSITY_IDS)[number],
      ),
    );
    assert.ok(institute.affiliating_university_id);
    keys.add(`${institute.year}:${institute.institute_code}`);
  }
  assert.equal(keys.size, generated.institutes.length);
  assert.deepEqual(
    MHT_CET_MINORITY_OPTIONS.map(({ value }) => value).sort(),
    [
      ...new Set(
        generated.institutes
          .map(({ minority_community_id }) => minority_community_id)
          .filter((value): value is string => Boolean(value)),
      ),
    ].sort(),
  );
  assert.equal(
    generated.institutes.filter(({ year }) => year === 2024).length,
    354,
  );
  assert.equal(
    generated.institutes.filter(({ year }) => year === 2025).length,
    372,
  );

  const affiliations = new Set(
    generated.institutes.map(({ affiliating_university_id }) =>
      affiliating_university_id,
    ),
  );
  assert.ok(affiliations.has("deemed-to-be-university"));
  assert.ok(
    affiliations.has(
      "dr-babasaheb-ambedkar-technological-university-lonere",
    ),
  );
  assert.ok(affiliations.has("sndt-women-s-university"));
});
