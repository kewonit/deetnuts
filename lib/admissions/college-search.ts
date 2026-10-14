// College search tuned for how students type: acronyms (PICT, VJTI), name
// fragments (sardar patel), codes (16006) and places (pune). Matches fall into
// tiers so the strongest kind of match always lists first.

const STOP_WORDS = new Set(["of", "and", "the", "for", "in", "at"]);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export interface CollegeSearchTarget {
  words: string[];
  compactName: string;
  acronyms: string[];
  code: string;
  restWords: string[];
}

export function prepareCollegeSearch(college: {
  name: string;
  code: string;
  extra?: string[];
}): CollegeSearchTarget {
  const name = normalize(college.name);
  const words = name.split(" ").filter(Boolean);
  // Names keep their trust prefixes ("Bhartiya Vidya Bhavan's Sardar Patel…"), so an
  // acronym can sit anywhere inside the initials.
  const acronyms = [
    words.map((word) => word[0]).join(""),
    words
      .filter((word) => !STOP_WORDS.has(word))
      .map((word) => word[0])
      .join(""),
  ];
  return {
    words,
    compactName: name.replaceAll(" ", ""),
    acronyms,
    code: college.code.replace(/^0+/, ""),
    restWords: normalize((college.extra ?? []).join(" ")).split(" ").filter(Boolean),
  };
}

// Lower is better; null means no match.
export function collegeSearchTier(target: CollegeSearchTarget, query: string): number | null {
  const tokens = normalize(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return null;
  if (tokens.length === 1) {
    const [token] = tokens;
    if (/^\d+$/.test(token)) {
      const code = token.replace(/^0+/, "");
      if (target.code === code) return 0;
      if (code && target.code.startsWith(code)) return 1;
    }
    if (target.words.includes(token)) return 0;
    if (token.length >= 3 && target.acronyms.some((acronym) => acronym.includes(token))) return 1;
  }
  const startsWord = (words: string[], token: string) => words.some((word) => word.startsWith(token));
  if (tokens.every((token) => startsWord(target.words, token))) return 1;
  if (tokens.every((token) => target.compactName.includes(token))) return 2;
  if (tokens.every((token) => target.compactName.includes(token) || startsWord(target.restWords, token))) return 3;
  return null;
}
