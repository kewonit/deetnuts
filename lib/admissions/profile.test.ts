import assert from "node:assert/strict";
import test from "node:test";
import {
  AdmissionsStoredProfileSchema,
  calculatePercentileMargin,
  calculateRankMargin,
} from "./profile";
import {
  decodeAdmissionsProfileFragment,
  encodeAdmissionsProfileFragment,
  getAdmissionsProfileStorageKey,
  resolveAdmissionsProfileSources,
  setProfileFragmentInUrl,
} from "./profile-codec";

const mhtProfile = AdmissionsStoredProfileSchema.parse({
  version: 1,
  system: "mht-cet",
  profile: {
    scoreMode: "percentile",
    score: 95.75,
    candidate: {
      candidatureType: "type-a",
      homeUniversityId: "savitribai-phule-pune-university",
      categoryId: "open",
      ladiesSeatEligible: false,
      eligibilities: {
        ewsCertificate: false,
        tfwsEligible: false,
        pwd: false,
        orphanCertificate: false,
      },
    },
  },
});

test("rank and percentile margins use opposite correct directions", () => {
  assert.equal(calculateRankMargin(9_158, 10_000), 842);
  assert.equal(calculateRankMargin(10_317, 10_000), -317);
  assert.ok(
    Math.abs(calculatePercentileMargin(97.4, 96.8) - 0.6) < Number.EPSILON * 100,
  );
  assert.equal(calculatePercentileMargin(95.75, 96.25), -0.5);
});

test("profile fragments round-trip and remain distinct from canonical state", () => {
  const fragment = encodeAdmissionsProfileFragment(mhtProfile);
  assert.match(fragment, /^profile=v1\.[A-Za-z0-9_-]+$/);
  assert.deepEqual(
    decodeAdmissionsProfileFragment(`#view=table&${fragment}`, "mht-cet"),
    mhtProfile,
  );

  const url = setProfileFragmentInUrl(
    new URL("https://deetnuts.com/mht-cet/colleges/example-01002?year=2026#view=table"),
    fragment,
  );
  assert.equal(url.pathname, "/mht-cet/colleges/example-01002");
  assert.equal(url.search, "?year=2026");
  assert.match(url.hash, /view=table&profile=v1\./);
});

test("valid link profile wins over valid device profile", () => {
  const device = JSON.stringify({
    ...mhtProfile,
    profile: { ...mhtProfile.profile, score: 99.9 },
  });
  assert.deepEqual(
    resolveAdmissionsProfileSources(
      `#${encodeAdmissionsProfileFragment(mhtProfile)}`,
      device,
      "mht-cet",
    ),
    { profile: mhtProfile, source: "link" },
  );
  assert.equal(
    getAdmissionsProfileStorageKey("mht-cet"),
    "deetnuts:admissions-profile:v1:mht-cet",
  );
});
