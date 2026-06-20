import "dotenv/config";

import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("bot_usage_events")
    .select("platform,source,status,event_name,created_at")
    .gte("created_at", since)
    .eq("event_name", "cutoff_request");

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const day = new Date(row.created_at).toISOString().slice(0, 10);
    const key = `${day}\t${row.platform}\t${row.status}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  console.log("day\tplatform\tstatus\tcount");
  [...counts.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .forEach(([key, count]) => {
      console.log(`${key}\t${count}`);
    });
}

main().catch((error) => {
  console.error("Failed to load bot usage", error);
  process.exitCode = 1;
});
