import type { MhtCetAllocationScope } from "./schema";
import type { MhtCetStageSemanticsId } from "./stage-schema";

export function mhtCetStageDescription(
  semanticsId: MhtCetStageSemanticsId,
): string {
  switch (semanticsId) {
    case "standard":
      return "Original seat-pool eligibility";
    case "ladies-to-male-same-category":
      return "Ladies seat converted to a male seat in the same category";
    case "pwd-released-to-base-category":
      return "PwD restriction removed; base category retained";
    case "defence-released-to-base-category":
      return "Defence restriction removed; base category retained";
    case "minority-to-maharashtra":
      return "Minority seat converted to Maharashtra State candidature";
    case "unrestricted-maharashtra-merit":
      return "Reservation removed; allotted on Maharashtra State merit";
  }
}

export function mhtCetEffectiveEligibilityDescription(
  semanticsId: MhtCetStageSemanticsId,
  effectiveScope: MhtCetAllocationScope,
): string {
  return `${mhtCetStageDescription(semanticsId)}; effective candidate scope: ${effectiveScope}`;
}
