export const ANONYMOUS_STATE_CUTOFF_ACTION_LIMIT = 10;
export const ANONYMOUS_STATE_CUTOFF_API_REQUEST_LIMIT = 20;
export const ANONYMOUS_STATE_CUTOFF_STORAGE_KEY =
  "deetnuts:mht-cet-state-cutoffs:anonymous-actions";
export const ANONYMOUS_STATE_CUTOFF_API_COOKIE =
  "mht_cet_state_cutoff_anonymous_requests";

export type AnonymousUsageStorage = Pick<Storage, "getItem" | "setItem">;

export interface AnonymousStateCutoffActionResult {
  allowed: boolean;
  authenticated: boolean;
  count: number;
  limit: number;
  remaining: number;
}

let fallbackActionCount = 0;

export function parseAnonymousUsageCount(
  rawValue: string | null | undefined,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const parsed = Number.parseInt(rawValue || "", 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.min(parsed, max);
}

function resolveStorage(
  storage?: AnonymousUsageStorage | null,
): AnonymousUsageStorage | null {
  if (storage !== undefined) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getAnonymousStateCutoffActionCount(
  storage?: AnonymousUsageStorage | null,
): number {
  const resolvedStorage = resolveStorage(storage);

  if (!resolvedStorage) {
    return fallbackActionCount;
  }

  try {
    return parseAnonymousUsageCount(
      resolvedStorage.getItem(ANONYMOUS_STATE_CUTOFF_STORAGE_KEY),
      ANONYMOUS_STATE_CUTOFF_ACTION_LIMIT,
    );
  } catch {
    return fallbackActionCount;
  }
}

function writeAnonymousStateCutoffActionCount(
  count: number,
  storage?: AnonymousUsageStorage | null,
) {
  const normalizedCount = Math.min(
    Math.max(0, count),
    ANONYMOUS_STATE_CUTOFF_ACTION_LIMIT,
  );
  const resolvedStorage = resolveStorage(storage);

  if (!resolvedStorage) {
    fallbackActionCount = normalizedCount;
    return;
  }

  try {
    resolvedStorage.setItem(
      ANONYMOUS_STATE_CUTOFF_STORAGE_KEY,
      String(normalizedCount),
    );
  } catch {
    fallbackActionCount = normalizedCount;
  }
}

export function resetAnonymousStateCutoffActionCount(
  storage?: AnonymousUsageStorage | null,
) {
  writeAnonymousStateCutoffActionCount(0, storage);
}

export function recordAnonymousStateCutoffAction({
  isAuthenticated,
  storage,
}: {
  isAuthenticated: boolean;
  storage?: AnonymousUsageStorage | null;
}): AnonymousStateCutoffActionResult {
  if (isAuthenticated) {
    return {
      allowed: true,
      authenticated: true,
      count: 0,
      limit: ANONYMOUS_STATE_CUTOFF_ACTION_LIMIT,
      remaining: ANONYMOUS_STATE_CUTOFF_ACTION_LIMIT,
    };
  }

  const currentCount = getAnonymousStateCutoffActionCount(storage);

  if (currentCount >= ANONYMOUS_STATE_CUTOFF_ACTION_LIMIT) {
    return {
      allowed: false,
      authenticated: false,
      count: currentCount,
      limit: ANONYMOUS_STATE_CUTOFF_ACTION_LIMIT,
      remaining: 0,
    };
  }

  const nextCount = currentCount + 1;
  writeAnonymousStateCutoffActionCount(nextCount, storage);

  return {
    allowed: true,
    authenticated: false,
    count: nextCount,
    limit: ANONYMOUS_STATE_CUTOFF_ACTION_LIMIT,
    remaining: ANONYMOUS_STATE_CUTOFF_ACTION_LIMIT - nextCount,
  };
}
