import { describe, expect, it } from "vitest";
import {
  loadMhtCetSeatPoolRegistry,
  MhtCetPredictionInput,
} from "../../mht-cet";
import { BASE_INPUT } from "./fixtures";

const OBSERVED_SOURCE_CODES = [
  "AI",
  "DEFOBCS",
  "DEFOPENS",
  "DEFRNT1S",
  "DEFRNT2S",
  "DEFRNT3S",
  "DEFROBCS",
  "DEFRSTS",
  "DEFRSCS",
  "DEFRSEBCS",
  "DEFRVJS",
  "DEFSCS",
  "DEFSEBCS",
  "DEFSTS",
  "EWS",
  "GNT1H",
  "GNT1O",
  "GNT1S",
  "GNT1_DEF",
  "GNT2H",
  "GNT2O",
  "GNT2S",
  "GNT2_DEF",
  "GNT3H",
  "GNT3O",
  "GNT3S",
  "GOBCH",
  "GOBCO",
  "GOBCS",
  "GOPENH",
  "GOPENO",
  "GOPENS",
  "GSCH",
  "GSCO",
  "GSCS",
  "GSEBCH",
  "GSEBCO",
  "GSEBCS",
  "GSTH",
  "GSTO",
  "GSTS",
  "GVJH",
  "GVJO",
  "GVJS",
  "LNT1H",
  "LNT1O",
  "LNT1S",
  "LNT1_DEF",
  "LNT2H",
  "LNT2O",
  "LNT2S",
  "LNT2_DEF",
  "LNT3",
  "LNT3H",
  "LNT3O",
  "LNT3S",
  "LOBCH",
  "LOBCO",
  "LOBCS",
  "LOPENH",
  "LOPENO",
  "LOPENS",
  "LSCH",
  "LSCO",
  "LSCS",
  "LSEBCH",
  "LSEBCO",
  "LSEBCS",
  "LSTH",
  "LSTO",
  "LSTS",
  "LVJH",
  "LVJO",
  "LVJS",
  "MI",
  "OBC",
  "OPEN",
  "ORPHAN",
  "OTHER",
  "PWDOBCH",
  "PWDOBCS",
  "PWDOPEN",
  "PWDOPENH",
  "PWDOPENS",
  "PWDRNT1S",
  "PWDRNT2H",
  "PWDRNT2S",
  "PWDRNT3S",
  "PWDROBCH",
  "PWDROBCS",
  "PWDRSCH",
  "PWDRSCS",
  "PWDRSEBCH",
  "PWDRSEBCS",
  "PWDRSTH",
  "PWDRSTS",
  "PWDRVJS",
  "PWDSCH",
  "PWDSCS",
  "PWDSEBCS",
  "PWDSEBCH",
  "PWDSTS",
  "ST",
  "TFWS",
].sort();

describe("MHT-CET seat-pool registry", () => {
  it("explicitly accounts for every category code observed in all seven sources", () => {
    const registry = loadMhtCetSeatPoolRegistry();
    expect(registry.entries.map((entry) => entry.source_code).sort()).toEqual(
      OBSERVED_SOURCE_CODES,
    );
    expect(new Set(registry.entries.map((entry) => entry.id)).size).toBe(
      registry.entries.length,
    );
  });

  it("rejects invalid candidature and EWS/category combinations at runtime", () => {
    expect(
      MhtCetPredictionInput.safeParse({
        ...BASE_INPUT,
        home_university_id: undefined,
      }).success,
    ).toBe(false);
    expect(
      MhtCetPredictionInput.safeParse({
        ...BASE_INPUT,
        eligibilities: {
          ...BASE_INPUT.eligibilities,
          ews_certificate: true,
        },
      }).success,
    ).toBe(false);
  });

  it("rejects the removed Defence request field", () => {
    expect(
      MhtCetPredictionInput.safeParse({
        ...BASE_INPUT,
        eligibilities: {
          ...BASE_INPUT.eligibilities,
          defence_category_id: "priority-i",
        },
      }).success,
    ).toBe(false);
  });
});
