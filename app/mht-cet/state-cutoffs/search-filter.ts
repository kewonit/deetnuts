const SEARCH_STOP_WORDS = new Set(["and", "for", "in", "of", "the"]);
const MAX_SEARCH_TOKENS = 8;

export const escapeFilterValue = (value: string): string => {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
};

const normalizeSearchTokens = (search: string): string[] => {
  const rawTokens = search.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const hasLongTextToken = rawTokens.some(
    (token) => /^\d+$/.test(token) || token.length >= 3,
  );
  const tokens: string[] = [];
  const seen = new Set<string>();

  for (const token of rawTokens) {
    const isNumeric = /^\d+$/.test(token);
    const isShortAlpha = !isNumeric && token.length < 3;

    if (SEARCH_STOP_WORDS.has(token)) {
      continue;
    }

    if (!isNumeric && token.length < 2) {
      continue;
    }

    if (isShortAlpha && hasLongTextToken) {
      continue;
    }

    if (seen.has(token)) {
      continue;
    }

    seen.add(token);
    tokens.push(token);

    if (tokens.length >= MAX_SEARCH_TOKENS) {
      break;
    }
  }

  return tokens;
};

const buildTokenClause = (token: string): string => {
  if (/^\d+$/.test(token)) {
    const normalizedCode = token.replace(/^0+(?=\d)/, "");
    const codeClauses = [`college_code = "${escapeFilterValue(token)}"`];

    if (normalizedCode && normalizedCode !== token) {
      codeClauses.push(`college_code = "${escapeFilterValue(normalizedCode)}"`);
    }

    return `(${codeClauses.join(" || ")})`;
  }

  const escapedToken = escapeFilterValue(token);
  return `(college_name ~ "${escapedToken}" || course_name ~ "${escapedToken}")`;
};

export const buildStateCutoffSearchFilter = (search: string): string => {
  const trimmed = search.trim();

  if (!trimmed) {
    return "";
  }

  const tokens = normalizeSearchTokens(trimmed);
  if (tokens.length === 0) {
    const escapedSearch = escapeFilterValue(trimmed);
    return `(college_name ~ "${escapedSearch}" || course_name ~ "${escapedSearch}")`;
  }

  return tokens.map(buildTokenClause).join(" && ");
};
