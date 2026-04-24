import assert from "node:assert/strict";
import test from "node:test";

import {
  formatSearchEmptyStateMessage,
  summarizeSearchInsightRows,
  type SearchInsight,
} from "./search-insights";

test("formatSearchEmptyStateMessage explains when one searched college exists but all rows are above the entered percentile", () => {
  const message = formatSearchEmptyStateMessage({
    hasFilters: true,
    percentileTarget: "86.4",
    search: "03199",
    searchInsight: {
      totalMatchingRows: 40,
      distinctCollegeCount: 1,
      lowestMatchingCutoff: 90.4894438,
      sampleCollegeNames: [
        "Shri Vile Parle Kelvani Mandal's Dwarkadas J. Sanghvi College of Engineering, Vile",
      ],
    } satisfies SearchInsight,
  });

  assert.match(message, /dwarkadas j\. sanghvi/i);
  assert.match(message, /90\.4894%/i);
  assert.match(message, /86\.4%/i);
});

test("formatSearchEmptyStateMessage falls back to the generic filtered empty state without search insight", () => {
  const message = formatSearchEmptyStateMessage({
    hasFilters: true,
    percentileTarget: "86.4",
    search: "03199",
    searchInsight: null,
  });

  assert.equal(
    message,
    "No cutoffs match your current filters. Clear a few filters or widen your percentile/rank range.",
  );
});

test("summarizeSearchInsightRows reports the lowest cutoff and distinct college count", () => {
  const summary = summarizeSearchInsightRows([
    {
      college_name: "A Institute",
      cutoff_score: 94.2,
    },
    {
      college_name: "A Institute",
      cutoff_score: 91.7,
    },
    {
      college_name: "B Institute",
      cutoff_score: 92.5,
    },
  ]);

  assert.deepEqual(summary, {
    totalMatchingRows: 3,
    distinctCollegeCount: 2,
    lowestMatchingCutoff: 91.7,
    sampleCollegeNames: ["A Institute", "B Institute"],
  });
});

test("summarizeSearchInsightRows returns null when matching rows have no usable college names", () => {
  assert.equal(
    summarizeSearchInsightRows([
      {
        college_name: null,
        cutoff_score: 94.2,
      },
      {
        college_name: null,
        cutoff_score: 91.7,
      },
    ]),
    null,
  );
});
