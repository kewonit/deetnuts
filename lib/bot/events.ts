import { createAdminClient } from "@/lib/supabase/admin";

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
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bot_processed_events")
    .insert({
      platform,
      external_id: externalId,
      action,
      status: "processing",
      metadata,
    })
    .select("id,platform,external_id,action,status")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { claimed: false };
    }

    throw new Error(error.message);
  }

  return { claimed: true, event: data as ClaimedBotEvent };
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
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bot_processed_events")
    .update({
      status,
      metadata: metadata ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id,platform,external_id,action,status")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ClaimedBotEvent;
}
