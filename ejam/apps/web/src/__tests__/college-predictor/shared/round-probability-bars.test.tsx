// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { RoundProbabilityBars } from "@/components/predictor/round-probability-bars";

afterEach(() => cleanup());

const DETAILS = [
  {
    predictedClosingRank: 24_555,
    latestHistoricalPercentile: 91.25,
    sourceCode: "GOPENO",
    allocationScopeId: "other-than-home-university",
    dataQuality: "inferred" as const,
  },
  null,
  {
    predictedClosingRank: 27_179,
    latestHistoricalPercentile: 89.75,
    sourceCode: "GOPENO",
    allocationScopeId: "other-than-home-university",
    dataQuality: "inferred" as const,
  },
  null,
];
const AVAILABILITY = [
  { status: "available", reason: "Official round 1 is available." },
  {
    status: "no-eligible-stage-for-profile",
    reason:
      "Official round 2 cutoffs exist, but no published stage is eligible for this candidate profile.",
  },
  { status: "available", reason: "Official round 3 is available." },
  {
    status: "offering-not-published-for-maharashtra-cap",
    reason:
      "This offering was not published in the official Maharashtra CAP round 4 cutoff inventory.",
  },
];

describe("round probability bars", () => {
  it("renders all four MHT rounds and describes genuine gaps explicitly", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RoundProbabilityBars
        roundProbs={[0.9, null, 0.7, null]}
        roundDetails={DETAILS}
        roundAvailability={AVAILABILITY}
        overallProbability={0.9}
        roundCount={4}
      />,
    );

    const controls = screen.getAllByRole("button");
    expect(controls).toHaveLength(4);
    expect(controls[0]?.getAttribute("aria-label")).toMatch(
      /Round 1: 90%.*point forecast rank 24,555.*GOPENO/i,
    );
    expect(controls[1]?.getAttribute("aria-label")).toBe(
      "Round 2: Official round 2 cutoffs exist, but no published stage is eligible for this candidate profile.",
    );
    expect(container.querySelectorAll(".t-round-bar")).toHaveLength(4);
    expect(container.querySelectorAll("[data-unavailable]")).toHaveLength(2);

    await user.tab();
    await user.tab();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("keeps the compact non-interactive view screen-reader complete", () => {
    render(
      <RoundProbabilityBars
        roundProbs={[0.9, null, 0.7, null]}
        roundDetails={DETAILS}
        roundAvailability={AVAILABILITY}
        overallProbability={0.9}
        roundCount={4}
        interactive={false}
      />,
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(
      screen.getByText(/Round 2: Official round 2 cutoffs exist/i),
    ).not.toBeNull();
    expect(
      screen.getByText(/Round 4: This offering was not published/i),
    ).not.toBeNull();
  });
});
