import assert from "node:assert/strict";
import test from "node:test";
import type { AdmissionsCutoffObservation } from "./types";
import {
  describeMhtCetSeatPool,
  groupMhtCetPrograms,
  programHeadlineRows,
  seatPoolLine,
  type SeatPoolFacts,
} from "./mht-cet-seat-pool";

function facts(overrides: Partial<SeatPoolFacts> = {}): SeatPoolFacts {
  return {
    categoryId: "open",
    ladiesSeat: false,
    allocationScope: "state-level",
    specialEligibility: "none",
    ...overrides,
  };
}

function observation(
  overrides: Partial<AdmissionsCutoffObservation> &
    Pick<AdmissionsCutoffObservation, "programName" | "programCode" | "category">,
): AdmissionsCutoffObservation {
  return {
    id: `${overrides.programCode}-${overrides.category}`,
    programId: overrides.programCode,
    year: 2026,
    round: 1,
    allocation: "STATE_LEVEL",
    closingValue: 1000,
    metric: "rank",
    rankValue: 1000,
    percentileValue: 90,
    poolLabel: overrides.category,
    poolScope: "State level",
    poolFamily: "open",
    poolOrder: 0,
    openGeneral: false,
    ...overrides,
  };
}

test("seat pool labels follow the registry facts", () => {
  assert.equal(
    seatPoolLine(
      describeMhtCetSeatPool({
        category: "GOPENH",
        allocation: "HOME_TO_HOME",
        entry: facts({ allocationScope: "home-university" }),
      }),
    ),
    "Open, General, Home university",
  );
  assert.equal(
    seatPoolLine(
      describeMhtCetSeatPool({
        category: "LOPENS",
        allocation: "STATE_LEVEL",
        entry: facts({ ladiesSeat: true }),
      }),
    ),
    "Open, Ladies, State level",
  );
  assert.equal(
    seatPoolLine(
      describeMhtCetSeatPool({
        category: "DEFOPENS",
        allocation: "STATE_LEVEL",
        entry: facts({ specialEligibility: "defence" }),
      }),
    ),
    "Defence, Open, State level",
  );
  assert.equal(
    seatPoolLine(
      describeMhtCetSeatPool({
        category: "TFWS",
        allocation: "STATE_LEVEL",
        entry: facts({ categoryId: null, specialEligibility: "tfws" }),
      }),
    ),
    "TFWS, State level",
  );
  assert.equal(
    seatPoolLine(
      describeMhtCetSeatPool({
        category: "EWS",
        allocation: "STATE_LEVEL",
        entry: facts({ specialEligibility: "ews" }),
      }),
    ),
    "EWS",
  );
  assert.equal(
    seatPoolLine(
      describeMhtCetSeatPool({
        category: "MI",
        allocation: "OTHER_TO_OTHER",
        entry: facts({ categoryId: null, specialEligibility: "minority" }),
      }),
    ),
    "Minority, Other university",
  );
});

test("a category code and allocation section that disagree both stay visible", () => {
  assert.equal(
    seatPoolLine(
      describeMhtCetSeatPool({
        category: "GOPENH",
        allocation: "OTHER_TO_OTHER",
        entry: facts({ allocationScope: "home-university" }),
      }),
    ),
    "Open, General, Home university, Other university",
  );
});

test("unknown category codes stay as the official code", () => {
  const described = describeMhtCetSeatPool({
    category: "ZZZ",
    allocation: "STATE_LEVEL",
    entry: null,
  });
  assert.equal(described.label, "ZZZ");
  assert.equal(described.scope, "State level");
  assert.equal(described.family, "other");
  assert.equal(described.openGeneral, false);
});

test("a TFWS choice code groups under its program and programs sort by open cutoff", () => {
  const groups = groupMhtCetPrograms([
    observation({
      programName: "Civil Engineering",
      programCode: "0627819110",
      category: "GOPENS",
      percentileValue: 90,
      poolLabel: "Open, General",
      poolFamily: "open",
      poolOrder: 0,
      openGeneral: true,
    }),
    observation({
      programName: "Civil Engineering",
      programCode: "0627819111T",
      category: "TFWS",
      percentileValue: 88,
      poolLabel: "TFWS",
      poolFamily: "tfws",
      poolOrder: 40,
      openGeneral: false,
    }),
    observation({
      programName: "Computer Engineering",
      programCode: "0627824510",
      category: "GOPENS",
      percentileValue: 99,
      poolLabel: "Open, General",
      poolFamily: "open",
      poolOrder: 0,
      openGeneral: true,
    }),
  ]);

  assert.deepEqual(
    groups.map((group) => group.name),
    ["Computer Engineering", "Civil Engineering"],
  );
  assert.deepEqual(groups[1]?.codes, ["0627819110"]);
  assert.equal(groups[1]?.rows.length, 2);
  assert.equal(groups[1]?.rows[1]?.showChoiceCode, true);
  assert.equal(groups[1]?.rows[1]?.programCode, "0627819111T");
  assert.equal(groups[1]?.rows[0]?.showChoiceCode, false);
});

test("program headlines use the general rows of the selected pool", () => {
  const rows = [
    observation({
      programName: "Computer Engineering",
      programCode: "0347524510",
      category: "GOPENH",
      poolLabel: "Open, General",
      poolScope: "Home university",
      poolFamily: "open",
      openGeneral: true,
      percentileValue: 92,
    }),
    observation({
      programName: "Computer Engineering",
      programCode: "0347524510",
      category: "LOPENH",
      poolLabel: "Open, Ladies",
      poolScope: "Home university",
      poolFamily: "open",
      openGeneral: false,
      percentileValue: 93,
    }),
    observation({
      programName: "Computer Engineering",
      programCode: "0347524510",
      category: "GOPENO",
      poolLabel: "Open, General",
      poolScope: "Other university",
      poolFamily: "open",
      openGeneral: true,
      percentileValue: 88,
    }),
    observation({
      programName: "Computer Engineering",
      programCode: "0347524511T",
      category: "TFWS",
      poolLabel: "TFWS",
      poolFamily: "tfws",
      openGeneral: false,
      percentileValue: 94,
    }),
    observation({
      programName: "Computer Engineering",
      programCode: "0347524510",
      category: "LSCS",
      poolLabel: "SC, Ladies",
      poolFamily: "sc",
      openGeneral: false,
    }),
  ];

  assert.deepEqual(
    programHeadlineRows(rows, "all").map((row) => row.poolScope),
    ["Home university", "Other university"],
  );
  assert.deepEqual(
    programHeadlineRows(rows, "tfws").map((row) => row.category),
    ["TFWS"],
  );
  assert.deepEqual(
    programHeadlineRows(rows, "sc").map((row) => row.category),
    ["LSCS"],
  );
});

test("the 2026 seat-pool registry labels GOPENS", async () => {
  process.env.EJAM_DATA_ROOT = "ejam/data";
  const { _resetDataRootCache } = await import("@ejam/data/data-root");
  const { _resetMhtCetSeatPoolRegistryCache } = await import("@ejam/data/mht-cet/eligibility");
  _resetDataRootCache();
  _resetMhtCetSeatPoolRegistryCache();
  const { lookupMhtCetSeatPool } = await import("./mht-cet-seat-pool-registry");
  const entry = lookupMhtCetSeatPool("GOPENS");
  assert.ok(entry);
  assert.equal(
    seatPoolLine(
      describeMhtCetSeatPool({
        category: "GOPENS",
        allocation: "STATE_LEVEL",
        entry,
      }),
    ),
    "Open, General, State level",
  );
  assert.equal(
    describeMhtCetSeatPool({
      category: "GOPENS",
      allocation: "STATE_LEVEL",
      entry,
    }).openGeneral,
    true,
  );
});
