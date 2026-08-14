import type { MhtCetPredictionInput } from "./schema";

function booleanParam(params: URLSearchParams, key: string): boolean {
  return params.get(key) === "true";
}

function optionalParam(
  params: URLSearchParams,
  key: string,
): string | undefined {
  return params.get(key)?.trim() || undefined;
}

export function decodeMhtCetUrlParams(params: URLSearchParams): unknown | null {
  const rank = params.get("rank");
  if (!rank) return null;
  return {
    rank: Number.parseInt(rank, 10),
    candidature_type_id: params.get("mht_candidature") ?? "type-a",
    category_id: params.get("mht_category") ?? "open",
    ladies_seat_eligible: booleanParam(params, "mht_ladies"),
    ...(optionalParam(params, "mht_home_university")
      ? {
          home_university_id: optionalParam(params, "mht_home_university"),
        }
      : {}),
    eligibilities: {
      ews_certificate: booleanParam(params, "ews"),
      tfws_eligible: booleanParam(params, "mht_tfws"),
      ...(optionalParam(params, "mht_pwd")
        ? { pwd_category_id: optionalParam(params, "mht_pwd") }
        : {}),
      orphan_certificate: booleanParam(params, "mht_orphan"),
      ...(optionalParam(params, "mht_minority")
        ? {
            minority_community_id: optionalParam(params, "mht_minority"),
          }
        : {}),
    },
    include_all: booleanParam(params, "include_all"),
  };
}

export function encodeMhtCetUrlParams(
  input: MhtCetPredictionInput,
): URLSearchParams {
  const params = new URLSearchParams({
    exam: "mht-cet",
    rank: String(input.rank),
    mht_candidature: input.candidature_type_id,
    mht_category: input.category_id,
  });
  const setBoolean = (key: string, value: boolean) => {
    if (value) params.set(key, "true");
  };
  setBoolean("mht_ladies", input.ladies_seat_eligible);
  setBoolean("ews", input.eligibilities.ews_certificate);
  setBoolean("mht_tfws", input.eligibilities.tfws_eligible);
  setBoolean("mht_orphan", input.eligibilities.orphan_certificate);
  setBoolean("include_all", input.include_all === true);
  if (input.home_university_id) {
    params.set("mht_home_university", input.home_university_id);
  }
  if (input.eligibilities.pwd_category_id) {
    params.set("mht_pwd", input.eligibilities.pwd_category_id);
  }
  if (input.eligibilities.minority_community_id) {
    params.set("mht_minority", input.eligibilities.minority_community_id);
  }
  return params;
}
