import assert from "node:assert/strict";
import test from "node:test";
import type { MhtCetCutoffRow } from "./data";
import {
  evaluateAdmissionsFit,
  type AdmissionsFitRepository,
} from "./fit";
import { FitRequestV1Schema } from "./profile";

function mhtCutoff(overrides: Partial<MhtCetCutoffRow> = {}): MhtCetCutoffRow {
  return {
    id: "mht-1",
    college_code: "01002",
    college_name: "Government College",
    course_code: "19110",
    course_name: "Civil Engineering",
    category: "GOPENH",
    seat_allocation_section: "HOME_TO_HOME",
    cutoff_score: 96.25,
    last_rank: 10_000,
    institute_home_university_id: "savitribai-phule-pune-university",
    source_pdf: "cap.pdf",
    source_page: 42,
    ...overrides,
  };
}

function repository(overrides: Partial<AdmissionsFitRepository> = {}): AdmissionsFitRepository {
  return {
    getMhtCetCollegeCutoffs: async () => [],
    ...overrides,
  };
}

const mhtRequest = FitRequestV1Schema.parse({
  version: 1,
  system: "mht-cet",
  entity: { kind: "college", id: "1002" },
  year: 2026,
  round: 1,
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

test("MHT-CET includes missed observations but excludes ineligible allocations", async () => {
  const result = await evaluateAdmissionsFit(
    mhtRequest,
    repository({
      getMhtCetCollegeCutoffs: async (_college, year) =>
        year === 2026
          ? [
              mhtCutoff(),
              mhtCutoff({
                id: "other-university-wrong-allocation",
                institute_home_university_id: "mumbai-university",
                seat_allocation_section: "HOME_TO_HOME",
                cutoff_score: 1,
              }),
              mhtCutoff({ id: "ladies", category: "LOPENH", cutoff_score: 1 }),
            ]
          : [],
    }),
  );

  assert.equal(result.observations.length, 1);
  assert.equal(result.observations[0].margin, -0.5);
  assert.equal(result.observations[0].outcome, "missed");
  assert.equal(result.provenance.sourcePage, 42);
});

test("MHT-CET history keeps the best result's exact program and seat pool", async () => {
  const result = await evaluateAdmissionsFit(
    mhtRequest,
    repository({
      getMhtCetCollegeCutoffs: async (_college, year) => {
        if (year === 2026) {
          return [mhtCutoff({ cutoff_score: 95 })];
        }
        if (year === 2025) {
          return [
            mhtCutoff({
              id: "different-program",
              course_code: "99999",
              course_name: "Different Program",
              cutoff_score: 90,
            }),
          ];
        }
        return [];
      },
    }),
  );

  assert.equal(result.observations[0].programId, "19110");
  assert.equal(result.history?.comparableYears, 1);
  assert.equal(result.history?.clearedYears, 1);
});

test("fit returns no comparable data without inventing a fallback", async () => {
  const result = await evaluateAdmissionsFit(mhtRequest, repository());
  assert.equal(result.status, "no-comparable-data");
  assert.deepEqual(result.observations, []);
  assert.equal(result.history, null);
});

test("MHT-CET propagates a requested-year outage but marks older history outages partial", async () => {
  await assert.rejects(
    evaluateAdmissionsFit(
      mhtRequest,
      repository({
        getMhtCetCollegeCutoffs: async (_college, year) => {
          if (year === 2026) throw new Error("current source outage");
          return [];
        },
      }),
    ),
    /current source outage/,
  );

  const partial = await evaluateAdmissionsFit(
    mhtRequest,
    repository({
      getMhtCetCollegeCutoffs: async (_college, year) => {
        if (year === 2024) throw new Error("older source outage");
        return year === 2026 ? [mhtCutoff()] : [];
      },
    }),
  );
  assert.equal(partial.status, "partial");
  assert.equal(partial.observations.length, 1);
  assert.match(partial.provenance.note || "", /2024/);
});

test("large entity-scoped responses are deterministic and marked partial", async () => {
  const rows = Array.from({ length: 201 }, (_, index) =>
    mhtCutoff({
      id: `mht-${index}`,
      course_code: String(index).padStart(4, "0"),
      course_name: `Program ${String(index).padStart(3, "0")}`,
      cutoff_score: 90 + index / 100,
    }),
  );
  const result = await evaluateAdmissionsFit(
    mhtRequest,
    repository({
      getMhtCetCollegeCutoffs: async (_college, year) => year === 2026 ? rows : [],
    }),
  );

  assert.equal(result.status, "partial");
  assert.equal(result.observations.length, 200);
  assert.ok(result.observations[0].margin >= result.observations.at(-1)!.margin);
});
