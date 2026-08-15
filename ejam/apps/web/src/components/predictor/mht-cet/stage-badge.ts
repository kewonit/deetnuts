import type { MhtCetStageSemanticsId } from "@ejam/data/mht-cet/browser";

export function getMhtCetStageBadgeLabel(
  semantics: MhtCetStageSemanticsId,
): string | null {
  switch (semantics) {
    case "standard":
      return null;
    case "ladies-to-male-same-category":
      return "Ladies seat converted";
    case "pwd-released-to-base-category":
      return "PwD seat converted";
    case "defence-released-to-base-category":
      return "Defence seat converted";
    case "minority-to-maharashtra":
      return "Converted to Maharashtra";
    case "unrestricted-maharashtra-merit":
      return "Converted to open";
  }
}
