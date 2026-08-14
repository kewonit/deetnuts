import type { MhtCetRoundAvailability } from "./result-schema";
import type { MhtCetRoundDataStatus } from "./schema";

type AvailabilityEntry = MhtCetRoundAvailability["1"];

export function mhtCetRoundAvailabilityReason(
  round: 1 | 2 | 3 | 4,
  status: AvailabilityEntry["status"],
): string {
  switch (status) {
    case "available":
      return `Official Maharashtra CAP rank cutoff is available for round ${round}.`;
    case "offering-not-published-for-maharashtra-cap":
      return `This offering was not published in the official Maharashtra CAP round ${round} cutoff inventory.`;
    case "no-eligible-stage-for-profile":
      return `Official round ${round} cutoffs exist, but no published stage is eligible for this candidate profile.`;
    case "percentile-only-rank-zero":
      return `Official round ${round} data contains percentile-only rank-zero records, so no rank probability is calculated.`;
  }
}

export function mhtCetRoundAvailabilityEntry(options: {
  round: 1 | 2 | 3 | 4;
  hasWinner: boolean;
  publishedStatuses: MhtCetRoundDataStatus[];
  eligibleStatuses: MhtCetRoundDataStatus[];
}): AvailabilityEntry {
  if (options.hasWinner) {
    return {
      status: "available",
      reason: mhtCetRoundAvailabilityReason(options.round, "available"),
    };
  }
  if (options.publishedStatuses.length === 0) {
    return {
      status: "offering-not-published-for-maharashtra-cap",
      reason: mhtCetRoundAvailabilityReason(
        options.round,
        "offering-not-published-for-maharashtra-cap",
      ),
    };
  }
  if (options.eligibleStatuses.length === 0) {
    return {
      status: "no-eligible-stage-for-profile",
      reason: mhtCetRoundAvailabilityReason(
        options.round,
        "no-eligible-stage-for-profile",
      ),
    };
  }
  if (
    options.eligibleStatuses.every((status) => status === "percentile-only")
  ) {
    return {
      status: "percentile-only-rank-zero",
      reason: mhtCetRoundAvailabilityReason(
        options.round,
        "percentile-only-rank-zero",
      ),
    };
  }
  throw new Error(
    `MHT-CET round ${options.round} has an eligible rank channel but no winner`,
  );
}
