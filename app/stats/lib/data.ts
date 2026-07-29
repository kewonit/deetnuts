import { createAdminClient } from "@/lib/supabase/admin";

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
  const supabase = createAdminClient();
  const since = getDateDaysAgo(30);

  // Only aggregate request volume, status, and duration.
  const [dailyResult, durationResult, totalsResult] = await Promise.all([
    // Daily breakdown
    supabase
      .from("bot_usage_events")
      .select("status, created_at")
      .gte("created_at", since)
      .in("event_name", TRACKED_REQUEST_EVENTS),

    // Duration trends
    supabase
      .from("bot_usage_events")
      .select("duration_ms, created_at")
      .gte("created_at", since)
      .in("event_name", TRACKED_REQUEST_EVENTS)
      .not("duration_ms", "is", null)
      .gt("duration_ms", 0)
      .lt("duration_ms", 30000), // Filter outliers > 30s

    // Totals
    supabase
      .from("bot_usage_events")
      .select("status, duration_ms, created_at")
      .gte("created_at", since)
      .in("event_name", TRACKED_REQUEST_EVENTS),
  ]);

  // Handle errors gracefully - return empty stats rather than crash
  const dailyRows = dailyResult.error ? [] : (dailyResult.data ?? []);
  const durationRows = durationResult.error ? [] : (durationResult.data ?? []);
  const totalsRows = totalsResult.error ? [] : (totalsResult.data ?? []);

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
