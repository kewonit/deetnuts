export type TimekeeperPublicConfig = { url: string; anonKey: string };
export const TIMEKEEPER_SUPABASE_ORIGIN =
  "https://ivmobluuegkikmbwbfhe.supabase.co";

export function validateTimekeeperPublicConfig(
  url: string,
  anonKey: string,
): TimekeeperPublicConfig {
  const parsed = new URL(url);
  if (
    parsed.origin !== TIMEKEEPER_SUPABASE_ORIGIN ||
    parsed.username ||
    parsed.password ||
    parsed.href !== `${TIMEKEEPER_SUPABASE_ORIGIN}/`
  )
    throw new Error(
      "TIMEKEEPER_SUPABASE_URL must be the existing TimeKeeper Supabase project origin",
    );
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(anonKey)) {
    let payload: { role?: string };
    try {
      payload = JSON.parse(
        atob(anonKey.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
    } catch {
      throw new Error(
        "TIMEKEEPER_SUPABASE_ANON_KEY must be a public anon or publishable key",
      );
    }
    if (payload.role !== "anon" || anonKey.split(".").length !== 3)
      throw new Error(
        "TimeKeeper requires a public anon key; privileged keys are forbidden",
      );
  }
  return { url: parsed.origin, anonKey };
}
