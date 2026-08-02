import { after, NextRequest, NextResponse } from "next/server";
import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";

import { isDiscordGuildAllowed } from "@/lib/bot/allowlist";
import { BotCutoffError, queryBotStateCutoffs } from "@/lib/bot/cutoff-query";
import {
  deferredInteractionResponse,
  editOriginalDiscordInteraction,
} from "@/lib/bot/discord-interaction-response";
import { formatDiscordCutoffResponse } from "@/lib/bot/formatters";
import {
  type BotUsageEvent,
  safeLogBotUsageEvent,
} from "@/lib/bot/usage";

export const runtime = "nodejs";
export const maxDuration = 30;

const DISCORD_MESSAGE_FLAG_SUPPRESS_EMBEDS = 1 << 2;

type DiscordCommandOption = {
  name: string;
  value?: string | number | boolean;
};

type DiscordInteraction = {
  id: string;
  application_id?: string;
  token?: string;
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

function getOptionString(
  options: DiscordCommandOption[] | undefined,
  name: string,
) {
  const option = options?.find((item) => item.name === name);
  return typeof option?.value === "string" && option.value.trim()
    ? option.value.trim()
    : undefined;
}

function interactionMessage(content: string, ephemeral = false) {
  const flags =
    DISCORD_MESSAGE_FLAG_SUPPRESS_EMBEDS |
    (ephemeral ? InteractionResponseFlags.EPHEMERAL : 0);

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags,
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

function logAfterResponse(event: BotUsageEvent) {
  after(() => safeLogBotUsageEvent(event));
}

async function completeCutoffInteraction({
  applicationId,
  interactionToken,
  requestId,
  source,
  startedAt,
  percentile,
  year,
  round,
  category,
  subcategory,
  branch,
  course,
}: {
  applicationId: string;
  interactionToken: string;
  requestId: string;
  source: string | null;
  startedAt: number;
  percentile: number;
  year?: number;
  round?: number;
  category?: string;
  subcategory?: string;
  branch?: string;
  course?: string;
}) {
  let message: string;
  let usageEvent: BotUsageEvent;

  try {
    const result = await queryBotStateCutoffs({
      percentile,
      year,
      round,
      category,
      subcategory,
      branch,
      course,
    });

    message = formatDiscordCutoffResponse(result);
    usageEvent = {
      requestId,
      externalId: requestId,
      platform: "discord",
      source,
      eventName: "cutoff_request",
      status: "served",
      percentile: result.query.percentile,
      year: result.query.year,
      round: result.query.round,
      resultCount: result.rows.length,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    const isUserError =
      error instanceof BotCutoffError &&
      (error.code === "INVALID_INPUT" ||
        error.code === "UNSUPPORTED_YEAR" ||
        error.code === "UNSUPPORTED_ROUND");

    message = isUserError
      ? error.message
      : "Unable to fetch cutoff data right now.";
    usageEvent = {
      requestId,
      externalId: requestId,
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
    };
  }

  try {
    await editOriginalDiscordInteraction({
      applicationId,
      interactionToken,
      content: message,
    });
  } catch (error) {
    console.error("Failed to update Discord interaction response", {
      requestId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    usageEvent = {
      ...usageEvent,
      status: "failed",
      errorCode: "DISCORD_RESPONSE_FAILED",
      durationMs: Date.now() - startedAt,
    };
  }

  await safeLogBotUsageEvent(usageEvent);
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
    logAfterResponse({
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
    logAfterResponse({
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
    logAfterResponse({
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
  const category = getOptionString(options, "category");
  const subcategory = getOptionString(options, "subcategory");
  const branch = getOptionString(options, "branch");
  const course = getOptionString(options, "course");

  if (percentile === undefined) {
    logAfterResponse({
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

  const applicationId = interaction.application_id;
  const interactionToken = interaction.token;

  if (!applicationId || !interactionToken) {
    logAfterResponse({
      requestId,
      externalId: interaction.id,
      platform: "discord",
      source,
      eventName: "cutoff_request",
      status: "rejected",
      percentile,
      year,
      round,
      durationMs: Date.now() - startedAt,
      errorCode: "INVALID_INTERACTION_TOKEN",
    });

    return jsonInteractionResponse(
      interactionMessage("Invalid Discord interaction payload.", true),
    );
  }

  after(() =>
    completeCutoffInteraction({
      applicationId,
      interactionToken,
      requestId,
      source,
      startedAt,
      percentile,
      year,
      round,
      category,
      subcategory,
      branch,
      course,
    }),
  );

  return jsonInteractionResponse(deferredInteractionResponse());
}
