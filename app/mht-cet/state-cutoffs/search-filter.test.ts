import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStateCutoffSearchFilter,
  escapeFilterValue,
} from "./search-filter";

test("buildStateCutoffSearchFilter tokenizes long college names instead of using one raw substring", () => {
  assert.equal(
    buildStateCutoffSearchFilter(
      "Shri Vile Parle Kelvani Mandal's Dwarkadas J. Sanghvi College of Engineering, Vile Mumbai",
    ),
    [
      '(college_name ~ "shri" || course_name ~ "shri")',
      '(college_name ~ "vile" || course_name ~ "vile")',
      '(college_name ~ "parle" || course_name ~ "parle")',
      '(college_name ~ "kelvani" || course_name ~ "kelvani")',
      '(college_name ~ "mandal" || course_name ~ "mandal")',
      '(college_name ~ "dwarkadas" || course_name ~ "dwarkadas")',
      '(college_name ~ "sanghvi" || course_name ~ "sanghvi")',
      '(college_name ~ "college" || course_name ~ "college")',
    ].join(" && "),
  );
});

test("buildStateCutoffSearchFilter drops short abbreviations when longer tokens exist", () => {
  assert.equal(
    buildStateCutoffSearchFilter("D.J. Sanghvi"),
    '(college_name ~ "sanghvi" || course_name ~ "sanghvi")',
  );
});

test("buildStateCutoffSearchFilter matches numeric college codes with or without leading zeroes", () => {
  assert.equal(
    buildStateCutoffSearchFilter("03199"),
    '(college_code = "03199" || college_code = "3199")',
  );
});

test("buildStateCutoffSearchFilter returns an empty filter for blank search", () => {
  assert.equal(buildStateCutoffSearchFilter("   "), "");
});

test("escapeFilterValue escapes quotes and backslashes for filter interpolation", () => {
  assert.equal(
    escapeFilterValue('Autonomous "Institute" \\ West'),
    'Autonomous \\"Institute\\" \\\\ West',
  );
});
