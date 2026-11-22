import type { CounsellingBody } from "./types";

// Architecture and planning seats are allotted on JEE Main Paper 2 ranks, so a Paper 1
// rank is never compared with them and they never rank against engineering programs.
export const PAPER_TWO = /arch|plan/i;

// Main categories first, then their PwD seats, the way students scan them.
export const CATEGORY_ORDER = [
  "OPEN",
  "EWS",
  "OBC-NCL",
  "SC",
  "ST",
  "OPEN (PwD)",
  "EWS (PwD)",
  "OBC-NCL (PwD)",
  "SC (PwD)",
  "ST (PwD)",
];
export const QUOTA_ORDER = ["AI", "OS", "HS"];
export const GENDER_ORDER = [
  "Gender-Neutral",
  "NA",
  "Female-only (including Supernumerary)",
];

const QUOTA_LABELS: Record<string, string> = {
  AI: "All India",
  HS: "Home state",
  OS: "Other state",
  GO: "Goa",
  JK: "J&K",
  LA: "Ladakh",
  AP: "Andhra Pradesh",
};

export function bodyLabel(body: CounsellingBody): string {
  return body === "josaa" ? "JoSAA" : "CSAB";
}

export function quotaLabel(quota: string): string {
  return QUOTA_LABELS[quota] ?? quota;
}

// Pills and table cells.
export function genderLabel(gender: string): string {
  if (gender === "NA") return "Not specified";
  return gender === "Gender-Neutral" ? "Gender-neutral" : "Female-only";
}

// Program and seat-pool page titles and headings, which name the source pool.
export function genderPoolLabel(gender: string): string {
  if (gender === "NA") return "Not specified in source";
  return gender.replace("Female-only (including Supernumerary)", "Female-only");
}

// "6", "1–6", or "1, 2, 4–6" when the source skips a round.
export function roundRuns(rounds: Iterable<number>): string {
  const sorted = [...new Set(rounds)].sort((left, right) => left - right);
  const runs: string[] = [];
  for (let index = 0; index < sorted.length; ) {
    let end = index;
    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end] + 1) end += 1;
    const length = end - index + 1;
    if (length >= 3) runs.push(`${sorted[index]}–${sorted[end]}`);
    else runs.push(...sorted.slice(index, end + 1).map(String));
    index = end + 1;
  }
  return runs.join(", ");
}

export function formatRounds(rounds: Iterable<number>): string {
  const values = [...new Set(rounds)];
  return `${values.length === 1 ? "Round" : "Rounds"} ${roundRuns(values)}`;
}
