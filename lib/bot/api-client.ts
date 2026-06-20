import type { BotCutoffQueryInput, BotCutoffResult } from "./cutoff-query";
import type { BotUsageEvent } from "./usage";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; message?: string };

type ClaimResponse =
  | {
      success: true;
      claimed: true;
      event: { id: string };
    }
  | {
      success: true;
      claimed: false;
      event: null;
    }
  | { success: false; error: string };

function getBotApiBaseUrl() {
  const baseUrl = process.env.BOT_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("BOT_API_BASE_URL is required");
  }
  return baseUrl.replace(/\/+$/, "");
}

function getBotApiToken() {
  const token = process.env.BOT_API_TOKEN;
  if (!token) {
    throw new Error("BOT_API_TOKEN is required");
  }
  return token;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${getBotApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getBotApiToken()}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as T;
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? String(payload.error)
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${getBotApiBaseUrl()}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getBotApiToken()}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as T;
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? String(payload.error)
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export async function queryCutoffsViaBotApi(
  query: BotCutoffQueryInput & {
    platform: "reddit" | "discord" | "api";
    source?: string;
  },
) {
  const response = await postJson<ApiResponse<BotCutoffResult>>(
    "/api/bot/cutoffs",
    query,
  );
  if (!response.success) {
    throw new Error(response.message || response.error);
  }
  return response.data;
}

export async function claimBotEventViaApi({
  platform,
  externalId,
  action,
  metadata,
}: {
  platform: string;
  externalId: string;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  const response = await postJson<ClaimResponse>("/api/bot/events/claim", {
    platform,
    externalId,
    action,
    metadata,
  });

  if (!response.success) {
    throw new Error(response.error);
  }

  return response;
}

export async function updateBotEventViaApi({
  id,
  status,
  metadata,
}: {
  id: string;
  status: "replied" | "skipped" | "failed";
  metadata?: Record<string, unknown>;
}) {
  await patchJson(`/api/bot/events/${encodeURIComponent(id)}`, {
    status,
    metadata,
  });
}

export async function logBotUsageViaApi(event: BotUsageEvent) {
  await postJson("/api/bot/logs", event);
}
