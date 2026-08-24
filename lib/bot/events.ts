import { ClientResponseError, getPocketBase } from "@/lib/pocketbaseClient";

export type BotProcessedEventStatus =
  | "processing"
  | "replied"
  | "skipped"
  | "failed";

export interface ClaimedBotEvent {
  id: string;
  platform: string;
  external_id: string;
  action: string;
  status: BotProcessedEventStatus;
}

export async function claimBotEvent({
  platform,
  externalId,
  action,
  metadata = {},
}: {
  platform: string;
  externalId: string;
  action: string;
  metadata?: Record<string, unknown>;
}): Promise<{ claimed: true; event: ClaimedBotEvent } | { claimed: false }> {
  try {
    const now = new Date().toISOString();
    const data = await getPocketBase().collection("bot_processed_events").create({
      platform,
      external_id: externalId,
      action,
      status: "processing",
      metadata,
      created_at: now,
      updated_at: now,
    });
    return { claimed: true, event: data as unknown as ClaimedBotEvent };
  } catch (error) {
    const responseData =
      error instanceof ClientResponseError ? JSON.stringify(error.data) : "";
    if (
      error instanceof ClientResponseError &&
      error.status === 400 &&
      responseData.includes("validation_not_unique")
    ) {
      return { claimed: false };
    }
    throw error;
  }
}

export async function updateBotEventStatus({
  id,
  status,
  metadata,
}: {
  id: string;
  status: BotProcessedEventStatus;
  metadata?: Record<string, unknown>;
}) {
  const data = await getPocketBase().collection("bot_processed_events").update(id, {
      status,
      metadata: metadata ?? {},
      updated_at: new Date().toISOString(),
    });

  return data as unknown as ClaimedBotEvent;
}
