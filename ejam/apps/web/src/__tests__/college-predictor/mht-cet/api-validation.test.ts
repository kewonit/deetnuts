import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/predict/[exam_id]/route";

describe("MHT-CET API input validation", () => {
  it("returns a structured field error for stale Defence input", async () => {
    const request = new NextRequest(
      "http://localhost/api/predict/mht-cet?year=2026",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rank: 10_000,
          candidature_type_id: "type-a",
          category_id: "open",
          ladies_seat_eligible: false,
          home_university_id: "mumbai-university",
          eligibilities: {
            ews_certificate: false,
            tfws_eligible: false,
            orphan_certificate: false,
            defence_category_id: "priority-i",
          },
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ exam_id: "mht-cet" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "INVALID_INPUT",
        field_errors: {
          "eligibilities.defence_category_id":
            "Defence reservation prediction is not supported",
        },
      },
    });
  });
});
