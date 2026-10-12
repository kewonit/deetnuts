const GITHUB_REPO_API_URL = "https://api.github.com/repos/kewonit/deetnuts";
const FRESH_MS = 6 * 60 * 60 * 1000;
const RETRY_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 3000;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function fetchGitHubStarCount(
  fetchImpl: FetchLike = fetch,
): Promise<number | null> {
  try {
    const response = await fetchImpl(GITHUB_REPO_API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "deetnuts-star-count",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { stargazers_count?: unknown };
    const count = data.stargazers_count;
    return typeof count === "number" && Number.isSafeInteger(count) && count >= 0
      ? count
      : null;
  } catch {
    return null;
  }
}

// In-process cache: GitHub is asked at most once per FRESH_MS per server.
// Stale counts are served immediately while one background refresh runs,
// and a failed refresh keeps the last good count and retries after RETRY_MS.
export function createGitHubStarCache({
  fetchImpl = fetch,
  now = Date.now,
}: { fetchImpl?: FetchLike; now?: () => number } = {}) {
  let snapshot: { count: number | null; expiresAt: number } | null = null;
  let inflight: Promise<number | null> | null = null;

  function refresh() {
    inflight ??= fetchGitHubStarCount(fetchImpl).then((count) => {
      snapshot =
        count === null
          ? { count: snapshot?.count ?? null, expiresAt: now() + RETRY_MS }
          : { count, expiresAt: now() + FRESH_MS };
      inflight = null;
      return snapshot.count;
    });
    return inflight;
  }

  return async function getGitHubStarCount(): Promise<number | null> {
    if (snapshot && now() < snapshot.expiresAt) return snapshot.count;
    if (snapshot?.count != null) {
      void refresh();
      return snapshot.count;
    }
    return refresh();
  };
}

export const getGitHubStarCount = createGitHubStarCache();

export function formatStarCount(count: number | null): string | null {
  if (count === null) return null;
  return new Intl.NumberFormat("en", {
    notation: count >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(count);
}
