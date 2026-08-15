import { describe, expect, it } from "vitest";
import { getEmptyStateDescription } from "@/components/predictor/empty-state";

describe("MHT-CET empty state", () => {
  it("does not ask Type E candidates for a home university", () => {
    const description = getEmptyStateDescription({
      hasPredicted: false,
      exam: "mht-cet",
    });

    expect(description).toContain("complete your candidature profile");
    expect(description).not.toContain("home university");
  });
});
