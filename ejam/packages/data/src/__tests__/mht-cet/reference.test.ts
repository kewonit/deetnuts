import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveRegistryRoot } from "../../data-root";
import {
  isMhtCetMinorityCommunityEligible2026,
  MHT_CET_HOME_UNIVERSITIES_2026,
  MHT_CET_MINORITY_COMMUNITIES_2026,
  MHT_CET_MINORITY_INSTITUTE_RULES_2026,
  MhtCetInstituteReference,
  MhtCetPredictionInput,
  mhtCetHomeUniversityForDistrict2026,
} from "../../mht-cet";

function instituteReferences() {
  return [2024, 2025].flatMap((year) =>
    MhtCetInstituteReference.array().parse(
      JSON.parse(
        readFileSync(
          resolve(
            resolveRegistryRoot(),
            "engineering",
            "mht-cet",
            `institutes-${year}.json`,
          ),
          "utf-8",
        ),
      ),
    ),
  );
}

describe("MHT-CET eligibility references", () => {
  it("covers every official institute home-university identity exactly", () => {
    const references = instituteReferences();
    const official = new Set(
      references.map((entry) => entry.home_university_id),
    );
    const selectable = new Set(
      MHT_CET_HOME_UNIVERSITIES_2026.map((entry) => entry.id),
    );
    expect(selectable).toEqual(official);
    expect(
      references.every(
        (entry) =>
          entry.home_university_id ===
          mhtCetHomeUniversityForDistrict2026(entry.district),
      ),
    ).toBe(true);
    expect(
      references.every((entry) => entry.affiliating_university_id.length > 0),
    ).toBe(true);
  });

  it("covers every official institute minority status and candidate community", () => {
    const official = new Set(
      instituteReferences().flatMap((entry) =>
        entry.minority_community_id ? [entry.minority_community_id] : [],
      ),
    );
    const instituteRules = new Set(
      MHT_CET_MINORITY_INSTITUTE_RULES_2026.map((entry) => entry.id),
    );
    const candidateCommunities = new Set(
      MHT_CET_MINORITY_COMMUNITIES_2026.map((entry) => entry.id),
    );
    expect([...official].every((status) => instituteRules.has(status))).toBe(
      true,
    );
    expect(
      MHT_CET_MINORITY_INSTITUTE_RULES_2026.every((rule) =>
        rule.candidate_community_ids.every((community) =>
          candidateCommunities.has(community),
        ),
      ),
    ).toBe(true);
  });

  it("applies the official minority compatibility table", () => {
    expect(
      isMhtCetMinorityCommunityEligible2026(
        "official-linguistic-minority-gujarathi",
        "official-linguistic-minority-gujarathi-kutchhi",
      ),
    ).toBe(true);
    expect(
      isMhtCetMinorityCommunityEligible2026(
        "official-linguistic-minority-gujarathi-jain",
        "official-linguistic-minority-gujarathi-kutchhi",
      ),
    ).toBe(false);
    expect(
      isMhtCetMinorityCommunityEligible2026(
        "official-religious-minority-christian",
        "official-religious-minority-christian-roman-catholics",
      ),
    ).toBe(true);
  });

  it("rejects unknown communities and Type C minority claims", () => {
    const valid = {
      rank: 10_000,
      candidature_type_id: "type-a",
      category_id: "open",
      ladies_seat_eligible: false,
      home_university_id: "mumbai-university",
      eligibilities: {
        ews_certificate: false,
        tfws_eligible: false,
        orphan_certificate: false,
      },
    };
    expect(
      MhtCetPredictionInput.safeParse({
        ...valid,
        eligibilities: {
          ...valid.eligibilities,
          minority_community_id: "made-up-community",
        },
      }).success,
    ).toBe(false);
    expect(
      MhtCetPredictionInput.safeParse({
        ...valid,
        candidature_type_id: "type-c",
        eligibilities: {
          ...valid.eligibilities,
          minority_community_id: "official-religious-minority-muslim",
        },
      }).success,
    ).toBe(false);
  });
});
