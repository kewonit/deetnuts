import { BAND_STYLES } from "@/lib/bands";
import type { PredictorDisplayProgram } from "@/lib/predictor-adapters";

// aliases so users can type old or slang band names and still match
const BAND_ALIASES: Record<string, string[]> = {
  safe: ["safe"],
  iffy: ["iffy", "target"],
  delulu: ["delulu", "reach"],
  "doesnt-matter": [
    "doesnt-matter",
    "doesn't matter yaar",
    "doesnt matter yaar",
    "doesn't matter",
    "doesnt matter",
    "long-shot",
    "longshot",
    "long shot",
    "long",
    "yaar",
  ],
};

// Smart aliases for Indian engineering branches
const KEYWORD_ALIASES: Array<[string, string]> = [
  ["computer science", "cs cse"],
  ["artificial intelligence", "ai aiml ml"],
  ["machine learning", "ml aiml"],
  ["electronics and communication", "ece"],
  ["electronics & communication", "ece"],
  ["electrical and electronics", "eee"],
  ["electrical & electronics", "eee"],
  ["mechanical", "me mech"],
  ["civil", "ce"],
  ["information technology", "it"],
  ["mathematics and computing", "mncc mac"],
  ["mathematics & computing", "mncc mac"],
  ["electrical engineering", "ee"],
  ["aerospace", "aero"],
  ["metallurgical", "meta"],
  ["chemical", "chem"],
  ["engineering", "engg"],
];

function bandMatchesToken(band: string, token: string): boolean {
  const aliases = BAND_ALIASES[band];
  if (aliases?.some((a) => a.includes(token))) return true;
  const label = BAND_STYLES[band as keyof typeof BAND_STYLES]?.label;
  return label ? label.toLowerCase().includes(token) : false;
}

/** build a compact searchable string per row — cached by callers */
function buildSearchText(row: PredictorDisplayProgram): string {
  let text = [
    row.instituteName,
    row.instituteCode ?? "",
    row.programName,
    row.programId,
    row.choiceCode ?? "",
    row.degree ?? "",
    row.instituteType,
    row.seatPoolLabel,
    row.gender ?? "",
    row.homeState ?? "",
    row.fillRound ? `round ${row.fillRound}` : "",
    String(row.predictedClosingRank),
    row.durationYears ? `${row.durationYears}yr` : "",
    row.durationYears ? `${row.durationYears} year` : "",
  ]
    .join(" ")
    .toLowerCase();

  // Inject smart aliases so short acronyms match the long text
  for (const [keyword, aliases] of KEYWORD_ALIASES) {
    if (text.includes(keyword)) {
      text += ` ${aliases}`;
    }
  }

  return text;
}

/** weak map so we only build the search text once per object reference */
const searchTextCache = new WeakMap<PredictorDisplayProgram, string>();

function getSearchText(row: PredictorDisplayProgram): string {
  let text = searchTextCache.get(row);
  if (!text) {
    text = buildSearchText(row);
    searchTextCache.set(row, text);
  }
  return text;
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1),
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function tokenMatchesText(token: string, text: string): boolean {
  const words = text.split(/\s+/);

  for (const word of words) {
    // Exact or prefix match (great for injected aliases like "cs" or "cse")
    if (word === token || word.startsWith(token)) return true;

    // For short tokens, exact/prefix match is enough.
    // We don't want "cs" to fuzzy match "ce" or "cse" to fuzzy match "ce" etc.
    if (token.length <= 3) continue;

    // Levenshtein fuzzy match for longer words to handle typos
    const dist = levenshtein(token, word);
    const maxDist = token.length <= 5 ? 1 : 2;
    if (dist <= maxDist) return true;
  }

  // For tokens > 3, we can also check if it's a substring of the full text
  // e.g., token "tech" in "technology" is covered by word.startsWith,
  // but what about "nology"? If token is > 3, text.includes is fine.
  if (token.length > 3 && text.includes(token)) return true;

  return false;
}

export function applyResultsSearch(
  programs: PredictorDisplayProgram[],
  query: string,
): PredictorDisplayProgram[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return programs;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return programs;

  return programs.filter((row) => {
    const text = getSearchText(row);
    return tokens.every(
      (token) =>
        tokenMatchesText(token, text) || bandMatchesToken(row.band, token),
    );
  });
}
