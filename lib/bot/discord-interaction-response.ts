import {
  InteractionResponseFlags,
  InteractionResponseType,
} from "discord-interactions";

const DISCORD_API_BASE_URL = "https://discord.com/api/v10";
const DISCORD_MESSAGE_CONTENT_LIMIT = 2_000;
const DISCORD_MESSAGE_FLAG_SUPPRESS_EMBEDS = 1 << 2;
const DISCORD_RESPONSE_TIMEOUT_MS = 10_000;

type DiscordFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export function deferredInteractionResponse(ephemeral = false) {
  return {
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    ...(ephemeral
      ? { data: { flags: InteractionResponseFlags.EPHEMERAL } }
      : {}),
  };
}

export function discordInteractionMessage(content: string) {
  return {
    content: content.slice(0, DISCORD_MESSAGE_CONTENT_LIMIT),
    flags: DISCORD_MESSAGE_FLAG_SUPPRESS_EMBEDS,
    allowed_mentions: { parse: [] as string[] },
  };
}

export async function editOriginalDiscordInteraction({
  applicationId,
  interactionToken,
  content,
  fetchImpl = fetch,
}: {
  applicationId: string;
  interactionToken: string;
  content: string;
  fetchImpl?: DiscordFetch;
}) {
  const response = await fetchImpl(
    `${DISCORD_API_BASE_URL}/webhooks/${encodeURIComponent(applicationId)}/${encodeURIComponent(interactionToken)}/messages/@original`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordInteractionMessage(content)),
      signal: AbortSignal.timeout(DISCORD_RESPONSE_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Discord interaction response update failed with HTTP ${response.status}`,
    );
  }
}
