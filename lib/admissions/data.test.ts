import assert from "node:assert/strict";
import test from "node:test";
import {
  AdmissionsDataError,
  loadMhtCetCollegeDetail,
  type MhtCetCutoffRow,
  type MhtCetDetailRepository,
} from "./data";
import { buildMhtCetCollegeMetadata } from "./metadata";
import { getCanonicalMhtCetCollegePath } from "./proxy-canonical";

const cutoff: MhtCetCutoffRow = {
  id: "fixture-cutoff",
  college_code: "01002",
  college_name: "Renamed Engineering College",
  course_code: "0100219110",
  course_name: "Civil Engineering",
  category: "GOPENH",
  seat_allocation_section: "HOME_UNIVERSITY",
  cutoff_score: 90,
  last_rank: 1000,
  source_pdf: "official-cutoffs.pdf",
  source_page: 1,
  source_index_url: "https://example.test/official-cutoffs",
  source_pdf_sha256: "a".repeat(64),
};

function repository(
  overrides: Partial<MhtCetDetailRepository> = {},
): MhtCetDetailRepository {
  return {
    getCollegeCutoffs: async () => [],
    getMasterCollege: async () => null,
    getSeatMatrix: async () => [],
    ...overrides,
  };
}

function unavailable() {
  return new AdmissionsDataError("Fixture data source unavailable");
}

test("healthy source absence is distinct from a source outage", async () => {
  assert.equal(await loadMhtCetCollegeDetail("1002", {}, repository()), null);
  const failure = unavailable();
  await assert.rejects(
    loadMhtCetCollegeDetail(
      "1002",
      {},
      repository({
        getCollegeCutoffs: async () => {
          throw failure;
        },
      }),
    ),
    (error) => error === failure,
  );
});

test("a directory outage cannot turn empty cutoff rows into a false missing college", async () => {
  const failure = unavailable();
  await assert.rejects(
    loadMhtCetCollegeDetail(
      "1002",
      {},
      repository({
        getMasterCollege: async () => {
          throw failure;
        },
      }),
    ),
    (error) => error === failure,
  );
});

test("selected cutoff failures propagate even when other college evidence exists", async () => {
  const failure = unavailable();
  await assert.rejects(
    loadMhtCetCollegeDetail(
      "1002",
      { year: 2024 },
      repository({
        getCollegeCutoffs: async (_id, year) => {
          if (year === 2024) throw failure;
          return [cutoff];
        },
      }),
    ),
    (error) => error === failure,
  );
});

test("optional source outages retain useful indexed college content", async () => {
  const model = await loadMhtCetCollegeDetail(
    "1002",
    {},
    repository({
      getCollegeCutoffs: async () => [cutoff],
      getMasterCollege: async () => {
        throw unavailable();
      },
      getSeatMatrix: async () => {
        throw unavailable();
      },
    }),
  );
  assert.ok(model);
  assert.equal(model.status, "partial");
  assert.equal(model.observations.length, 1);
  assert.equal(model.programs[0].name, "Civil Engineering");
  assert.equal(model.canonicalPath, getCanonicalMhtCetCollegePath("1002"));
  assert.ok(model.coverageNotes.some((note) => note.includes("directory")));
  assert.ok(model.coverageNotes.some((note) => note.includes("seat matrix")));
  assert.equal(buildMhtCetCollegeMetadata(model).robots, undefined);
});

test("historical selection survives a current-year outage with a stable canonical", async () => {
  const model = await loadMhtCetCollegeDetail(
    "old-college-name-1002",
    { year: 2024, round: 2 },
    repository({
      getCollegeCutoffs: async (_id, year) => {
        if (year === 2026) throw unavailable();
        return [cutoff];
      },
    }),
  );
  assert.ok(model);
  assert.equal(model.selectedYear, 2024);
  assert.equal(model.selectedRound, 2);
  assert.equal(model.provenance.year, 2024);
  assert.equal(model.observations[0].year, 2024);
  assert.equal(model.canonicalPath, getCanonicalMhtCetCollegePath("01002"));
  assert.equal(model.college.name, "Renamed Engineering College");
  const metadata = buildMhtCetCollegeMetadata(model);
  assert.match(metadata.description ?? "", /2024 MHT-CET/);
  assert.equal(
    metadata.alternates?.canonical,
    "https://www.deetnuts.com" + model.canonicalPath,
  );
  assert.equal(metadata.robots, undefined);
});

test("an unavailable current-year source cannot prove absence for an empty historic selection", async () => {
  const failure = unavailable();
  await assert.rejects(
    loadMhtCetCollegeDetail(
      "1002",
      { year: 2024 },
      repository({
        getCollegeCutoffs: async (_id, year) => {
          if (year === 2026) throw failure;
          return [];
        },
      }),
    ),
    (error) => error === failure,
  );
});

test("default metadata and page data share the same selected cutoff query", async () => {
  const calls: number[][] = [];
  const model = await loadMhtCetCollegeDetail(
    "1002",
    {},
    repository({
      getCollegeCutoffs: async (_id, year, round) => {
        calls.push([year, round]);
        return [cutoff];
      },
    }),
  );
  assert.ok(model);
  assert.deepEqual(calls, [[2026, 1]]);
});

test("invalid college identifiers do not read any data source", async () => {
  const model = await loadMhtCetCollegeDetail(
    "not-a-college",
    {},
    repository({
      getCollegeCutoffs: async () => {
        throw new Error("Unexpected data read");
      },
      getMasterCollege: async () => {
        throw new Error("Unexpected data read");
      },
      getSeatMatrix: async () => {
        throw new Error("Unexpected data read");
      },
    }),
  );
  assert.equal(model, null);
});
