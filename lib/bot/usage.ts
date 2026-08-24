import { getPocketBase } from "@/lib/pocketbaseClient";

export const BOT_USAGE_EVENT_NAMES = [
  "cutoff_request",
  "cutoff_query",
  "worker_heartbeat",
  "state_cutoff_search",
] as const;

export const BOT_USAGE_STATUSES = [
  "served",
  "rejected",
  "failed",
  "duplicate",
  "skipped",
  "heartbeat",
] as const;

export type BotUsageEventName = (typeof BOT_USAGE_EVENT_NAMES)[number];
export type BotUsageStatus = (typeof BOT_USAGE_STATUSES)[number];

export interface BotUsageEvent {
  requestId: string;
  externalId?: string | null;
  platform: "discord" | "reddit" | "api" | "worker" | "web";
  source?: string | null;
  eventName: BotUsageEventName;
  status: BotUsageStatus;
  percentile?: number | null;
  scoreMode?: "rank" | "percentile" | null;
  scoreValue?: number | null;
  year?: number | null;
  round?: number | null;
  resultCount?: number | null;
  durationMs?: number | null;
  errorCode?: string | null;
}

export function isBotUsageEventName(value: string): value is BotUsageEventName {
  return BOT_USAGE_EVENT_NAMES.includes(value as BotUsageEventName);
}

export function isBotUsageStatus(value: string): value is BotUsageStatus {
  return BOT_USAGE_STATUSES.includes(value as BotUsageStatus);
}

export async function logBotUsageEvent(event: BotUsageEvent) {
  const now = new Date().toISOString();
  await getPocketBase().collection("bot_usage_events").create({
    request_id: event.requestId,
    external_id: event.externalId ?? null,
    platform: event.platform,
    source: event.source ?? null,
    event_name: event.eventName,
    status: event.status,
    percentile: event.percentile ?? null,
    score_mode: event.scoreMode ?? null,
    score_value: event.scoreValue ?? null,
    year: event.year ?? null,
    round: event.round ?? null,
    result_count: event.resultCount ?? null,
    duration_ms: event.durationMs ?? null,
    error_code: event.errorCode ?? null,
    created_at: now,
    updated_at: now,
  });
}

export async function safeLogBotUsageEvent(event: BotUsageEvent) {
  try {
    await logBotUsageEvent(event);
  } catch (error) {
    console.warn("Failed to log bot usage event", {
      eventName: event.eventName,
      platform: event.platform,
      requestId: event.requestId,
      error,
    });
  }
}
