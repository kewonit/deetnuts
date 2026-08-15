import type { ProgramPrediction } from "@ejam/data/college-predictor";

export function seatPoolLabel(row: ProgramPrediction): string {
  return [row.seat_type, row.quota.toUpperCase(), genderShort(row.gender)]
    .filter(Boolean)
    .join(" · ");
}

export function genderShort(gender: string): string {
  if (gender.startsWith("Gender")) return "GN";
  if (gender.startsWith("Female")) return "F";
  return gender;
}
