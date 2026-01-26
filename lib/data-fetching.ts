/**
 * Data fetching utilities following Vercel best practices
 * - Proper error handling
 * - Typed responses
 * - Revalidation strategies
 * - Cache tags for on-demand revalidation
 */

import { unstable_cache } from "next/cache";

/**
 * Fetch with automatic retry logic
 * Best Practice: Handles transient network errors
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = 3,
  delay = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError || new Error("Failed to fetch after retries");
}

/**
 * Create a cached data fetcher with tags
 * Best Practice: Enables granular cache invalidation
 */
export function createCachedFetcher<T>(
  key: string,
  tags: string[],
  revalidate?: number,
) {
  return unstable_cache(
    async (params?: Record<string, any>) => {
      // Your data fetching logic here
      // This is a placeholder that should be replaced
      return {} as T;
    },
    [key],
    {
      tags,
      revalidate,
    },
  );
}

/**
 * Parallel data fetching helper
 * Best Practice: Reduces total loading time
 */
export async function fetchParallel<T extends Record<string, any>>(
  fetchers: Record<keyof T, () => Promise<any>>,
): Promise<T> {
  const entries = Object.entries(fetchers);
  const results = await Promise.all(
    entries.map(async ([key, fetcher]) => {
      try {
        const data = await fetcher();
        return [key, data];
      } catch (error) {
        console.error(`Error fetching ${key}:`, error);
        return [key, null];
      }
    }),
  );

  return Object.fromEntries(results) as T;
}

/**
 * Type-safe error wrapper for data fetching
 * Best Practice: Provides consistent error handling
 */
export interface DataResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export async function safeFetch<T>(
  fetcher: () => Promise<T>,
): Promise<DataResult<T>> {
  try {
    const data = await fetcher();
    return { data, error: null, isLoading: false };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
      isLoading: false,
    };
  }
}

/**
 * Fetch with timeout
 * Best Practice: Prevents hanging requests
 */
export async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout = 10000,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Batch multiple requests with deduplication
 * Best Practice: Reduces redundant network calls
 */
const requestCache = new Map<string, Promise<any>>();

export async function fetchWithDeduplication<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  if (requestCache.has(key)) {
    return requestCache.get(key)!;
  }

  const promise = fetcher().finally(() => {
    // Clean up after request completes
    setTimeout(() => requestCache.delete(key), 1000);
  });

  requestCache.set(key, promise);
  return promise;
}

/**
 * Cache configuration presets
 * Best Practice: Standardized caching strategies
 */
export const CachePresets = {
  // Static data that rarely changes
  STATIC: {
    revalidate: 3600, // 1 hour
    tags: ["static"],
  },
  // Dynamic data that changes frequently
  DYNAMIC: {
    revalidate: 60, // 1 minute
    tags: ["dynamic"],
  },
  // User-specific data
  USER: {
    revalidate: 0, // No caching
    tags: ["user"],
  },
  // Institute data
  INSTITUTE: {
    revalidate: 900, // 15 minutes
    tags: ["institute", "josaa"],
  },
  // Cutoffs data
  CUTOFFS: {
    revalidate: 1800, // 30 minutes
    tags: ["cutoffs", "josaa"],
  },
} as const;
