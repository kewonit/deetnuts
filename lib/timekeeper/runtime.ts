import "server-only";
import { validateTimekeeperPublicConfig } from "./public-config";

export function getTimekeeperPublicConfig() {
  return validateTimekeeperPublicConfig(
    process.env.TIMEKEEPER_SUPABASE_URL?.trim() ?? "",
    process.env.TIMEKEEPER_SUPABASE_ANON_KEY?.trim() ?? "",
  );
}
