import "dotenv/config";

import PocketBase from "pocketbase";

interface UsageRow {
  platform: string;
  status: string;
  created_at: string;
}

function required(name: string, minimumLength = 1): string {
  const value = process.env[name];
  if (!value || value.length < minimumLength) {
    throw new Error(`${name} is missing or too short`);
  }
  return value;
}

async function main() {
  const baseUrl =
    process.env.POCKETBASE_MIGRATION_URL ||
    process.env.POCKETBASE_INTERNAL_URL ||
    "http://127.0.0.1:8090";
  const url = new URL(baseUrl);
  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "pocketbase"].includes(url.hostname)
  ) {
    throw new Error("PocketBase reporting must use a private or loopback URL");
  }
  const pb = new PocketBase(url.origin);
  pb.autoCancellation(false);
  await pb.collection("app_services").authWithPassword(
    required("POCKETBASE_SERVICE_EMAIL"),
    required("POCKETBASE_SERVICE_PASSWORD", 32),
  );
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const rows = await pb.collection("bot_usage_events").getFullList<UsageRow>({
    fields: "platform,status,created_at",
    filter: `created_at >= "${since}" && event_name = "cutoff_request"`,
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
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
  const message = error instanceof Error ? error.message : "Unknown failure";
  console.error(`Failed to load bot usage: ${message}`);
  process.exitCode = 1;
});
