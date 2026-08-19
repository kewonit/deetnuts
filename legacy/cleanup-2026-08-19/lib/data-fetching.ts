import { unstable_cache } from "next/cache";

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

export function createCachedFetcher<T>(
  key: string,
  tags: string[],
  revalidate?: number,
) {
  return unstable_cache(
    async (params?: Record<string, any>) => {
      void params;
      throw new Error("createCachedFetcher: fetcher implementation required");
    },
    [key],
    {
      tags,
      revalidate,
    },
  );
}

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

const requestCache = new Map<string, Promise<any>>();

export async function fetchWithDeduplication<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  if (requestCache.has(key)) {
    return requestCache.get(key)!;
  }

  const promise = fetcher().finally(() => {
    setTimeout(() => requestCache.delete(key), 1000);
  });

  requestCache.set(key, promise);
  return promise;
}

export const CachePresets = {
  STATIC: {
    revalidate: 3600,
    tags: ["static"],
  },
  DYNAMIC: {
    revalidate: 60,
    tags: ["dynamic"],
  },
  USER: {
    revalidate: 0,
    tags: ["user"],
  },
  INSTITUTE: {
    revalidate: 900,
    tags: ["institute", "mht-cet"],
  },
  CUTOFFS: {
    revalidate: 1800,
    tags: ["cutoffs", "mht-cet"],
  },
} as const;
