import { describe, expect, it } from "vitest";
import {
  decodeMhtCetUrlParams,
  encodeMhtCetUrlParams,
  MhtCetPredictionInput,
} from "../../mht-cet";

describe("MHT-CET share URL adapter", () => {
  it("round-trips structured eligibility without JEE fields", () => {
    const input = MhtCetPredictionInput.parse({
      rank: 1_200,
      candidature_type_id: "type-a",
      category_id: "sc",
      ladies_seat_eligible: false,
      home_university_id: "savitribai-phule-pune-university",
      eligibilities: {
        ews_certificate: false,
        tfws_eligible: false,
        orphan_certificate: false,
      },
      include_all: true,
    });
    const params = encodeMhtCetUrlParams(input);

    expect(decodeMhtCetUrlParams(params)).toEqual(input);
    expect(params.get("seat_type")).toBeNull();
    expect(params.get("quota")).toBeNull();
  });
});
