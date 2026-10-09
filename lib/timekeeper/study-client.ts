"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { validateTimekeeperPublicConfig } from "./public-config";

let client: Promise<SupabaseClient> | null = null;
export function getStudyClient(): Promise<SupabaseClient> {
  if (!client)
    client = (async () => {
      const response = await fetch("/api/exam-countdown/config", {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok)
        throw new Error("The study map is temporarily unavailable");
      const body = await response.json();
      const config = validateTimekeeperPublicConfig(body.url, body.anonKey);
      return createClient(config.url, config.anonKey, {
        auth: {
          storageKey: "timekeeper-study-auth",
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
        realtime: { params: { eventsPerSecond: 10 } },
        global: { headers: { "x-application-name": "timekeeper-study-map" } },
      });
    })().catch((error) => {
      client = null;
      throw error;
    });
  return client;
}

export async function ensureStudyIdentity(
  client: SupabaseClient,
): Promise<string> {
  const session = await client.auth.getSession();
  if (session.data.session) return session.data.session.user.id;
  const result = await client.auth.signInAnonymously();
  if (result.error || !result.data.user)
    throw new Error("Could not connect to the study map");
  return result.data.user.id;
}

export function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(seed)}&size=80&backgroundColor=ffffff&radius=50`;
}

export function avatarSeed() {
  try {
    const stored = localStorage.getItem("timekeeper_avatar_seed");
    const parsed = stored ? JSON.parse(stored) : null;
    if (typeof parsed === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(parsed))
      return parsed;
    const seed = crypto.randomUUID();
    localStorage.setItem("timekeeper_avatar_seed", JSON.stringify(seed));
    return seed;
  } catch {
    return crypto.randomUUID();
  }
}

export async function studyLocation() {
  try {
    const response = await fetch("https://ipinfo.io/json", {
      signal: AbortSignal.timeout(5000),
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok) throw new Error("Location unavailable");
    const data = await response.json();
    const [latitude, longitude] = String(data.loc).split(",").map(Number);
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < 6 ||
      latitude > 38 ||
      longitude < 68 ||
      longitude > 98
    )
      throw new Error("Location outside the study map");
    // Share an approximate city position only; the original coordinates never
    // enter browser storage or the session RPC.
    const random = crypto.getRandomValues(new Uint32Array(2));
    const angle = (random[0] / 2 ** 32) * Math.PI * 2;
    const radius = Math.sqrt(random[1] / 2 ** 32) * 0.045;
    return {
      latitude: latitude + Math.cos(angle) * radius,
      longitude: longitude + Math.sin(angle) * radius,
      city: String(data.city ?? "").slice(0, 50),
      state: String(data.region ?? "").slice(0, 50),
    };
  } catch {
    return {
      latitude: 28.6139,
      longitude: 77.209,
      city: "New Delhi",
      state: "Delhi",
    };
  }
}
