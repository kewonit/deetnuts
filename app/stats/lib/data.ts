import { getPocketBase } from "@/lib/pocketbaseClient";

export interface DailyStats {
  date: string;
  served: number;
  rejected: number;
  failed: number;
  total: number;
}

export interface DurationStat {
  date: string;
  avgDurationMs: number | null;
}

export interface BotStats {
  daily: DailyStats[];
  durations: DurationStat[];
  totals: {
    totalRequests: number;
    totalServed: number;
    avgResponseTimeMs: number;
  };
}

const TRACKED_REQUEST_EVENTS = [
  "cutoff_request",
  "state_cutoff_search",
] as const;

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export async function fetchBotStats(): Promise<BotStats> {
  const since = getDateDaysAgo(30);
  const eventFilter = TRACKED_REQUEST_EVENTS
    .map((event) => `event_name = "${event}"`)
    .join(" || ");
  let totalsRows: Array<{
    status: string;
    duration_ms: number | null;
    created_at: string;
  }> = [];
  try {
    totalsRows = await getPocketBase()
      .collection("bot_usage_events")
      .getFullList({
        fields: "status,duration_ms,created_at",
        filter: `created_at >= "${since}" && (${eventFilter})`,
      }) as typeof totalsRows;
  } catch {
    // Statistics are noncritical and intentionally degrade to an empty series.
  }
  const dailyRows = totalsRows;
  const durationRows = totalsRows.filter(
    (row) =>
      typeof row.duration_ms === "number" &&
      row.duration_ms > 0 &&
      row.duration_ms < 30000,
  );

  // Build daily map
  const dailyMap = new Map<string, DailyStats>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, {
      date: formatDateLabel(key),
      served: 0,
      rejected: 0,
      failed: 0,
      total: 0,
    });
  }

  for (const row of dailyRows) {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    const entry = dailyMap.get(key);
    if (!entry) continue;
    entry.total++;
    if (row.status === "served") entry.served++;
    else if (row.status === "rejected") entry.rejected++;
    else if (row.status === "failed") entry.failed++;
  }

  // Duration trends (daily average)
  const durationMap = new Map<string, number[]>();
  for (const row of durationRows) {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    if (!durationMap.has(key)) durationMap.set(key, []);
    durationMap.get(key)!.push(row.duration_ms ?? 0);
  }

  const durations: DurationStat[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const vals = durationMap.get(key) ?? [];
    const avgDurationMs =
      vals.length > 0
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : null;
    durations.push({
      date: formatDateLabel(key),
      avgDurationMs,
    });
  }

  // Totals
  const totalRequests = totalsRows.length;
  const totalServed = totalsRows.filter((r) => r.status === "served").length;

  const validDurations = totalsRows
    .filter(
      (r) =>
        typeof r.duration_ms === "number" &&
        r.duration_ms > 0 &&
        r.duration_ms < 30000,
    )
    .map((r) => r.duration_ms as number);

  const avgResponseTimeMs =
    validDurations.length > 0
      ? Math.round(
          validDurations.reduce((a, b) => a + b, 0) / validDurations.length,
        )
      : 0;

  return {
    daily: Array.from(dailyMap.values()),
    durations,
    totals: {
      totalRequests,
      totalServed,
      avgResponseTimeMs,
    },
  };
}
