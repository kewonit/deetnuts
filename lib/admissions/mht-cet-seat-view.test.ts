import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_MHT_CET_SEAT_VIEW,
  matchProgramSeat,
  parseMhtCetSeatView,
  seatCaption,
  seatPlaceLine,
  seatViewFromCandidate,
  type MhtCetSeatView,
} from "./mht-cet-seat-view";

type Row = {
  category: string;
  poolFamily: string;
  poolLabel: string;
  poolScope: string | null;
  percentileValue: number;
};

function row(overrides: Partial<Row> & Pick<Row, "category" | "poolScope" | "percentileValue">): Row {
  return {
    poolFamily: "open",
    poolLabel: "Open, General",
    ...overrides,
  };
}

const shah = [
  row({ category: "GOPENH", poolScope: "Home university", percentileValue: 92.5129597 }),
  row({ category: "GOPENO", poolScope: "Other university", percentileValue: 88.0866426 }),
  row({
    category: "LOPENH",
    poolLabel: "Open, Ladies",
    poolScope: "Home university",
    percentileValue: 92.9703046,
  }),
  row({
    category: "LOPENO",
    poolLabel: "Open, Ladies",
    poolScope: "Other university",
    percentileValue: 85.6921506,
  }),
  row({
    category: "TFWS",
    poolFamily: "tfws",
    poolLabel: "TFWS",
    poolScope: "State level",
    percentileValue: 93.5072524,
  }),
];

const shivaji = [
  row({ category: "GOPENS", poolScope: "State level", percentileValue: 97.6747797 }),
];

const mumbai = "mumbai-university";
const pune = "savitribai-phule-pune-university";

function view(overrides: Partial<MhtCetSeatView> = {}): MhtCetSeatView {
  return { ...DEFAULT_MHT_CET_SEAT_VIEW, homeUniversityId: mumbai, ...overrides };
}

test("Mumbai Open general uses the Shah home cutoff", () => {
  const match = matchProgramSeat(shah, view(), mumbai);
  assert.equal(match?.category, "GOPENH");
  assert.equal(match?.percentileValue, 92.5129597);
  assert.equal(seatPlaceLine(shah, view(), mumbai), "Your home university");
  assert.equal(seatCaption(view()), "Open, General");
});

test("Pune Open general uses the Shah other-university cutoff", () => {
  const match = matchProgramSeat(shah, view({ homeUniversityId: pune }), mumbai);
  assert.equal(match?.category, "GOPENO");
  assert.equal(match?.percentileValue, 88.0866426);
  assert.equal(seatPlaceLine(shah, view({ homeUniversityId: pune }), mumbai), "Outside your home university");
});

test("Ladies follows the same home or other choice", () => {
  assert.equal(matchProgramSeat(shah, view({ gender: "ladies" }), mumbai)?.category, "LOPENH");
  assert.equal(
    matchProgramSeat(shah, view({ gender: "ladies", homeUniversityId: pune }), mumbai)?.category,
    "LOPENO",
  );
});

test("a statewide college ignores the saved university", () => {
  assert.equal(matchProgramSeat(shivaji, view({ homeUniversityId: pune }), pune)?.category, "GOPENS");
  assert.equal(matchProgramSeat(shivaji, view(), pune)?.percentileValue, 97.6747797);
  assert.equal(seatPlaceLine(shivaji, view(), pune), "This college has one statewide cutoff.");
});

test("TFWS ignores gender and uses its own row", () => {
  const match = matchProgramSeat(shah, view({ gender: "ladies", special: "tfws" }), mumbai);
  assert.equal(match?.category, "TFWS");
  assert.equal(match?.percentileValue, 93.5072524);
  assert.equal(seatCaption(view({ special: "tfws" })), "TFWS");
  assert.equal(seatPlaceLine(shah, view({ special: "tfws" }), mumbai), "This college has one statewide cutoff.");
});

test("a missing seat is an empty match", () => {
  assert.equal(matchProgramSeat(shah, view({ categoryId: "sc" }), mumbai), null);
  assert.equal(seatPlaceLine(shah, view({ categoryId: "sc" }), mumbai), "This seat is not published for this college.");
});

test("stored seat views reject unknown values and stay out of the URL", () => {
  assert.deepEqual(
    parseMhtCetSeatView(
      JSON.stringify({ categoryId: "obc", gender: "ladies", homeUniversityId: pune, special: "ews" }),
    ),
    { categoryId: "obc", gender: "ladies", homeUniversityId: pune, special: "ews" },
  );
  assert.equal(parseMhtCetSeatView(JSON.stringify({ categoryId: "open", gender: "general", special: "minority" })), null);
  assert.equal(
    seatViewFromCandidate({
      categoryId: "sc",
      ladiesSeatEligible: true,
      homeUniversityId: mumbai,
    })?.gender,
    "ladies",
  );
});
