import { NextRequest, NextResponse } from "next/server";
import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";

import { isDiscordGuildAllowed } from "@/lib/bot/allowlist";
import { BotCutoffError, queryBotStateCutoffs } from "@/lib/bot/cutoff-query";
import { formatDiscordCutoffResponse } from "@/lib/bot/formatters";
import { safeLogBotUsageEvent } from "@/lib/bot/usage";

export const runtime = "nodejs";

type DiscordCommandOption = {
  name: string;
  value?: string | number | boolean;
};

type DiscordInteraction = {
  id: string;
  type: number;
  guild_id?: string;
  channel_id?: string;
  data?: {
    name?: string;
    options?: DiscordCommandOption[];
  };
};

function jsonInteractionResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function getOptionNumber(
  options: DiscordCommandOption[] | undefined,
  name: string,
) {
  const option = options?.find((item) => item.name === name);
  if (typeof option?.value === "number") return option.value;
  if (typeof option?.value === "string" && option.value.trim()) {
    const parsed = Number(option.value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function interactionMessage(content: string, ephemeral = false) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags: ephemeral ? InteractionResponseFlags.EPHEMERAL : undefined,
      allowed_mentions: { parse: [] },
    },
  };
}

async function verifyDiscordRequest(request: NextRequest, rawBody: string) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");

  if (!publicKey || !signature || !timestamp) {
    return false;
  }

  return verifyKey(rawBody, signature, timestamp, publicKey);
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const rawBody = await request.text();
  const isValid = await verifyDiscordRequest(request, rawBody);

  if (!isValid) {
    return new NextResponse("Bad request signature", { status: 401 });
  }

  let interaction: DiscordInteraction;
  try {
    interaction = JSON.parse(rawBody) as DiscordInteraction;
  } catch {
    return jsonInteractionResponse(
      interactionMessage("Invalid Discord interaction payload.", true),
      400,
    );
  }

  if (interaction.type === InteractionType.PING) {
    return jsonInteractionResponse({ type: InteractionResponseType.PONG });
  }

  if (interaction.type !== InteractionType.APPLICATION_COMMAND) {
    return jsonInteractionResponse(
      interactionMessage("Unsupported interaction type.", true),
    );
  }

  const requestId = interaction.id;
  const source = interaction.guild_id ?? interaction.channel_id ?? null;
  const commandName = interaction.data?.name;

  if (commandName !== "cutoff") {
    await safeLogBotUsageEvent({
      requestId,
      externalId: interaction.id,
      platform: "discord",
      source,
      eventName: "cutoff_request",
      status: "rejected",
      durationMs: Date.now() - startedAt,
      errorCode: "UNKNOWN_COMMAND",
    });

    return jsonInteractionResponse(
      interactionMessage("Unknown command.", true),
    );
  }

  if (!interaction.guild_id) {
    await safeLogBotUsageEvent({
      requestId,
      externalId: interaction.id,
      platform: "discord",
      source,
      eventName: "cutoff_request",
      status: "rejected",
      durationMs: Date.now() - startedAt,
      errorCode: "GUILD_REQUIRED",
    });

    return jsonInteractionResponse(
      interactionMessage("Use this command inside a Discord server.", true),
    );
  }

  if (!isDiscordGuildAllowed(interaction.guild_id)) {
    await safeLogBotUsageEvent({
      requestId,
      externalId: interaction.id,
      platform: "discord",
      source,
      eventName: "cutoff_request",
      status: "rejected",
      durationMs: Date.now() - startedAt,
      errorCode: "SOURCE_NOT_ALLOWED",
    });

    return jsonInteractionResponse(
      interactionMessage(
        "This Discord server is not enabled for DEETNUTS bot.",
        true,
      ),
    );
  }

  const options = interaction.data?.options;
  const percentile = getOptionNumber(options, "percentile");
  const year = getOptionNumber(options, "year");
  const round = getOptionNumber(options, "round");

  if (percentile === undefined) {
    await safeLogBotUsageEvent({
      requestId,
      externalId: interaction.id,
      platform: "discord",
      source,
      eventName: "cutoff_request",
      status: "rejected",
      durationMs: Date.now() - startedAt,
      errorCode: "MISSING_PERCENTILE",
    });

    return jsonInteractionResponse(
      interactionMessage("Percentile is required.", true),
    );
  }

  try {
    const result = await queryBotStateCutoffs({
      percentile,
      year,
      round,
    });

    await safeLogBotUsageEvent({
      requestId,
      externalId: interaction.id,
      platform: "discord",
      source,
      eventName: "cutoff_request",
      status: "served",
      percentile: result.query.percentile,
      year: result.query.year,
      round: result.query.round,
      resultCount: result.rows.length,
      durationMs: Date.now() - startedAt,
    });

    return jsonInteractionResponse(
      interactionMessage(formatDiscordCutoffResponse(result)),
    );
  } catch (error) {
    const isUserError =
      error instanceof BotCutoffError &&
      (error.code === "INVALID_INPUT" ||
        error.code === "UNSUPPORTED_YEAR" ||
        error.code === "UNSUPPORTED_ROUND");

    await safeLogBotUsageEvent({
      requestId,
      externalId: interaction.id,
      platform: "discord",
      source,
      eventName: "cutoff_request",
      status: isUserError ? "rejected" : "failed",
      percentile,
      year,
      round,
      resultCount: 0,
      durationMs: Date.now() - startedAt,
      errorCode: error instanceof BotCutoffError ? error.code : "UNKNOWN",
    });

    const message =
      error instanceof BotCutoffError
        ? error.message
        : "Unable to fetch cutoff data right now.";

    return jsonInteractionResponse(interactionMessage(message, true));
  }
}
