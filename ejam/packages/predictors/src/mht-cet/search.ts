import type {
  MhtCetProbabilityBand,
  MhtCetProgramPrediction,
} from "@ejam/data/mht-cet";

const BAND_ALIASES: Record<MhtCetProbabilityBand, string[]> = {
  safe: ["safe"],
  iffy: ["iffy", "target"],
  delulu: ["delulu", "reach"],
  "doesnt-matter": ["doesnt matter", "long shot", "longshot", "yaar"],
};

const KEYWORD_ALIASES: Array<[string, string]> = [
  ["computer science", "cs cse"],
  ["artificial intelligence", "ai aiml ml"],
  ["machine learning", "ml aiml"],
  ["electronics and communication", "ece"],
  ["electronics communication", "ece"],
  ["electrical and electronics", "eee"],
  ["electrical electronics", "eee"],
  ["mechanical", "me mech"],
  ["civil", "ce"],
  ["information technology", "it"],
  ["electrical engineering", "ee"],
  ["aerospace", "aero"],
  ["metallurgical", "meta"],
  ["chemical", "chem"],
  ["engineering", "engg"],
];

export function normalizeMhtSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function boundedLevenshtein(
  left: string,
  right: string,
  maximum: number,
): number {
  if (Math.abs(left.length - right.length) > maximum) return maximum + 1;
  if (left === right) return 0;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution =
        previous[rightIndex - 1] +
        (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      const value = Math.min(
        substitution,
        (current[rightIndex - 1] ?? 0) + 1,
        (previous[rightIndex] ?? 0) + 1,
      );
      current[rightIndex] = value;
    }
    previous = current;
  }

  return previous[right.length] ?? maximum + 1;
}

function tokenMatches(token: string, text: string, words: string[]): boolean {
  if (/^\d+$/.test(token)) {
    return words.some(
      (word) => word === token || (token.length < 5 && word.startsWith(token)),
    );
  }
  if (text.includes(token)) return true;
  for (const word of words) {
    if (word === token || word.startsWith(token)) return true;
    if (token.length <= 3) continue;
    const maximum = token.length <= 5 ? 1 : 2;
    if (boundedLevenshtein(token, word, maximum) <= maximum) return true;
  }
  return false;
}

function searchableText(program: MhtCetProgramPrediction): string {
  let text = normalizeMhtSearchText(
    [
      program.institute_name,
      program.institute_code,
      program.program_name,
      program.program_id,
      program.choice_code,
      program.institute_type,
      program.best_eligible_seat_pool.source_code,
      program.best_eligible_seat_pool.label,
      program.predicted_closing_rank,
    ].join(" "),
  );
  for (const [keyword, aliases] of KEYWORD_ALIASES) {
    if (text.includes(keyword)) text += ` ${aliases}`;
  }
  return text;
}

export function matchesMhtSearch(
  program: MhtCetProgramPrediction,
  query: string | undefined,
): boolean {
  const normalized = normalizeMhtSearchText(query ?? "");
  if (!normalized) return true;
  const text = searchableText(program);
  const words = text.split(" ");
  const bandAliases = BAND_ALIASES[program.band].join(" ");
  return Array.from(new Set(normalized.split(" "))).every(
    (token) =>
      tokenMatches(token, text, words) ||
      tokenMatches(token, bandAliases, bandAliases.split(" ")),
  );
}
