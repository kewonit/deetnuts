import { createAdminClient } from "@/lib/supabase/admin";

export interface DailyStats {
  date: string;
  served: number;
  rejected: number;
  failed: number;
  total: number;
}

export interface PlatformStat {
  platform: string;
  count: number;
}

export interface StatusStat {
  status: string;
  count: number;
}

export interface DurationStat {
  date: string;
  avgDurationMs: number;
}

export interface EventProcessingStat {
  status: string;
  count: number;
}

export interface BotStats {
  daily: DailyStats[];
  platforms: PlatformStat[];
  statuses: StatusStat[];
  durations: DurationStat[];
  eventsProcessed: EventProcessingStat[];
  totals: {
    totalRequests: number;
    totalServed: number;
    totalFailed: number;
    totalEventsProcessed: number;
    avgResponseTimeMs: number;
    uptimeDays: number;
  };
}

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

  // Safe aggregated queries - no PII or sensitive IDs exposed
  const [
    dailyResult,
    platformResult,
    statusResult,
    durationResult,
    eventsResult,
    totalsResult,
  ] = await Promise.all([
    // Daily breakdown
    supabase
      .from("bot_usage_events")
      .select("status, created_at")
      .gte("created_at", since)
      .eq("event_name", "cutoff_request"),

    // Platform breakdown
    supabase
      .from("bot_usage_events")
      .select("platform")
      .gte("created_at", since)
      .neq("platform", "worker"),

    // Status breakdown
    supabase
      .from("bot_usage_events")
      .select("status")
      .gte("created_at", since)
      .eq("event_name", "cutoff_request"),

    // Duration trends
    supabase
      .from("bot_usage_events")
      .select("duration_ms, created_at")
      .gte("created_at", since)
      .eq("event_name", "cutoff_request")
      .not("duration_ms", "is", null)
      .gt("duration_ms", 0)
      .lt("duration_ms", 30000), // Filter outliers > 30s

    // Event processing stats
    supabase
      .from("bot_processed_events")
      .select("status")
      .gte("created_at", since),

    // Totals
    supabase
      .from("bot_usage_events")
      .select("status, duration_ms, created_at")
      .gte("created_at", since)
      .eq("event_name", "cutoff_request"),
  ]);

  // Handle errors gracefully - return empty stats rather than crash
  const dailyRows = dailyResult.error ? [] : (dailyResult.data ?? []);
  const platformRows = platformResult.error ? [] : (platformResult.data ?? []);
  const statusRows = statusResult.error ? [] : (statusResult.data ?? []);
  const durationRows = durationResult.error ? [] : (durationResult.data ?? []);
  const eventsRows = eventsResult.error ? [] : (eventsResult.data ?? []);
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

  // Platform breakdown
  const platformCounts = new Map<string, number>();
  for (const row of platformRows) {
    const p = row.platform ?? "unknown";
    platformCounts.set(p, (platformCounts.get(p) ?? 0) + 1);
  }

  // Status breakdown
  const statusCounts = new Map<string, number>();
  for (const row of statusRows) {
    const s = row.status ?? "unknown";
    statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
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
    const avg =
      vals.length > 0
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : 0;
    durations.push({
      date: formatDateLabel(key),
      avgDurationMs: avg,
    });
  }

  // Events processed
  const eventCounts = new Map<string, number>();
  for (const row of eventsRows) {
    const s = row.status ?? "unknown";
    eventCounts.set(s, (eventCounts.get(s) ?? 0) + 1);
  }

  // Totals
  const totalRequests = totalsRows.length;
  const totalServed = totalsRows.filter((r) => r.status === "served").length;
  const totalFailed = totalsRows.filter((r) => r.status === "failed").length;

  const validDurations = totalsRows
    .filter((r) => typeof r.duration_ms === "number" && r.duration_ms > 0 && r.duration_ms < 30000)
    .map((r) => r.duration_ms as number);

  const avgResponseTimeMs =
    validDurations.length > 0
      ? Math.round(
          validDurations.reduce((a, b) => a + b, 0) / validDurations.length
        )
      : 0;

  // Find first event to estimate uptime
  const { data: firstEvent } = await supabase
    .from("bot_usage_events")
    .select("created_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const uptimeDays = firstEvent?.created_at
    ? Math.max(
        1,
        Math.round(
          (Date.now() - new Date(firstEvent.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return {
    daily: Array.from(dailyMap.values()),
    platforms: Array.from(platformCounts.entries()).map(([platform, count]) => ({
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      count,
    })),
    statuses: Array.from(statusCounts.entries()).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    })),
    durations,
    eventsProcessed: Array.from(eventCounts.entries()).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    })),
    totals: {
      totalRequests,
      totalServed,
      totalFailed,
      totalEventsProcessed: eventsRows.length,
      avgResponseTimeMs,
      uptimeDays,
    },
  };
}
