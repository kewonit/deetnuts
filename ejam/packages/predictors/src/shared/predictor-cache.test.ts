import { describe, expect, it } from "vitest";
import {
  createServerCacheKey,
  getServerCacheEntry,
  type ServerCacheEntry,
  setServerCacheEntry,
} from "./predictor-cache";

const COLLIDING_JEE_MAIN_REQUESTS = [
  {
    index_sha:
      "9d1a6448f6c64307169f03de73eb4fb33c468aa10ac29ed75d39f263f5e2fe5a",
    exam_id: "jee-main",
    rank: 191937,
    seat_type: "OPEN",
    gender: "Gender-Neutral",
    quota: "OS",
    state: "Andhra Pradesh",
  },
  {
    index_sha:
      "9d1a6448f6c64307169f03de73eb4fb33c468aa10ac29ed75d39f263f5e2fe5a",
    exam_id: "jee-main",
    rank: 10552,
    seat_type: "OPEN",
    gender: "Gender-Neutral",
    quota: "OS",
    state: "Arunachal Pradesh",
  },
] as const;

function stableNormalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableNormalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, stableNormalize(entry)]),
    );
  }
  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableNormalize(value));
}

function oldFnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (const char of value) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function cacheEntry(): ServerCacheEntry {
  return {
    programs: [],
    metadata: {
      total_matching: 0,
      total_above_threshold: 0,
      threshold_used: 0,
      hidden_count: 0,
      total_matching_programs: 0,
      displayed_programs: 0,
      hidden_programs: 0,
      active_filters: {},
    },
  };
}

describe("createServerCacheKey", () => {
  it("does not alias valid predictor inputs that collided under FNV-1a", () => {
    const [first, second] = COLLIDING_JEE_MAIN_REQUESTS;

    expect(oldFnv1a(stableStringify(first))).toBe(
      oldFnv1a(stableStringify(second)),
    );
    expect(createServerCacheKey(first)).not.toBe(createServerCacheKey(second));
  });
});

describe("server result cache", () => {
  it("evicts the oldest entry when the cache reaches its configured limit", () => {
    const cache = new Map<string, ServerCacheEntry>();

    setServerCacheEntry(cache, "first", cacheEntry(), 2);
    setServerCacheEntry(cache, "second", cacheEntry(), 2);
    setServerCacheEntry(cache, "third", cacheEntry(), 2);

    expect([...cache.keys()]).toEqual(["second", "third"]);
  });

  it("refreshes recency on cache hits before evicting", () => {
    const cache = new Map<string, ServerCacheEntry>();
    const first = cacheEntry();

    setServerCacheEntry(cache, "first", first, 2);
    setServerCacheEntry(cache, "second", cacheEntry(), 2);

    expect(getServerCacheEntry(cache, "first")).toBe(first);

    setServerCacheEntry(cache, "third", cacheEntry(), 2);

    expect([...cache.keys()]).toEqual(["first", "third"]);
  });
});
