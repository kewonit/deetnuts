import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPercentile,
  homeUniversityLabel,
  summarizeMhtCetCollege,
} from "./mht-cet-college-summary";
import { pickPeerColleges, summarizeOpenGeneralPeaks } from "./mht-cet-peers";
import type { AdmissionsCutoffObservation } from "./types";

function observation(
  overrides: Partial<AdmissionsCutoffObservation> &
    Pick<AdmissionsCutoffObservation, "programName" | "category" | "percentileValue">,
): AdmissionsCutoffObservation {
  return {
    id: `${overrides.programName}-${overrides.category}`,
    programId: overrides.programName,
    programCode: overrides.programName,
    year: 2026,
    round: 1,
    closingValue: overrides.rankValue ?? 0,
    metric: "rank",
    rankValue: 1000,
    poolLabel: "Open, General",
    poolScope: "State level",
    poolFamily: "open",
    poolOrder: 2,
    openGeneral: true,
    ...overrides,
  };
}

const college = {
  collegeId: "6006",
  name: "Example College",
  homeUniversity: "Autonomous Institute",
  homeUniversityId: "savitribai-phule-pune-university",
};

test("quoted percentiles are truncated, never rounded up", () => {
  assert.equal(formatPercentile(99.9767207), "99.97");
  assert.equal(formatPercentile(92.5129597), "92.51");
  assert.equal(formatPercentile(null), "—");
});

test("placeholder home universities fall back to the normalized university", () => {
  assert.equal(homeUniversityLabel(college), "Savitribai Phule Pune University");
  assert.equal(
    homeUniversityLabel({ homeUniversity: "Autonomous Institute", homeUniversityId: null }),
    null,
  );
  assert.equal(
    homeUniversityLabel({ homeUniversity: "Mumbai University", homeUniversityId: null }),
    "Mumbai University",
  );
});

test("summary ranks programs by the default seat", () => {
  const observations = [
    observation({ programName: "Civil Engineering", category: "GOPENS", percentileValue: 90.5, rankValue: 9000 }),
    observation({
      programName: "Computer Science and Engineering(Artificial Intelligence and Machine Learning)",
      category: "GOPENS",
      percentileValue: 97.1,
    }),
    observation({ programName: "Computer Engineering", category: "GOPENS", percentileValue: 98.2, rankValue: 400 }),
    observation({ programName: "Computer Science and Engineering", category: "GOPENS", percentileValue: 96 }),
    observation({
      programName: "Civil Engineering",
      category: "LOPENS",
      percentileValue: 95,
      poolLabel: "Open, Ladies",
      openGeneral: false,
    }),
  ];
  const summary = summarizeMhtCetCollege({ observations, college });
  assert.equal(summary.programCount, 4);
  assert.equal(summary.top?.name, "Computer Engineering");
  assert.equal(summary.bottom?.name, "Civil Engineering");
  assert.equal(summary.bottom?.percentile, 90.5);
  assert.equal(summary.homeSplit, false);
});

test("peer colleges are the closest top cutoffs, excluding the college itself", () => {
  const peaks = summarizeOpenGeneralPeaks([
    { college_code: "16006", college_name: "Self", course_name: "CSE", category: "GOPENS", cutoff_score: 95 },
    { college_code: "016006", college_name: "Self", course_name: "Civil", category: "GOPENS", cutoff_score: 90 },
    { college_code: "1002", college_name: "Near above", course_name: "CSE", category: "GOPENH", cutoff_score: 95.4 },
    { college_code: "1005", college_name: "Near below", course_name: "CSE", category: "GOPENO", cutoff_score: 94.8 },
    { college_code: "1012", college_name: "Far", course_name: "CSE", category: "GOPENS", cutoff_score: 60 },
    { college_code: "1101", college_name: "Ladies only", course_name: "CSE", category: "LOPENS", cutoff_score: 95 },
    { college_code: "99999", college_name: "Not indexed", course_name: "CSE", category: "GOPENS", cutoff_score: 95 },
  ]);
  assert.equal(peaks.find((peak) => peak.collegeId === "16006")?.program, "CSE");
  assert.equal(peaks.some((peak) => peak.collegeId === "1101" || peak.collegeId === "99999"), false);
  const peers = pickPeerColleges(peaks, "16006", 2);
  assert.deepEqual(
    peers.map((peer) => peer.name),
    ["Near above", "Near below"],
  );
  assert.match(peers[0].path, /^\/mht-cet\/colleges\/.+-01002$/);
  assert.deepEqual(pickPeerColleges(peaks, "4242"), []);
});
