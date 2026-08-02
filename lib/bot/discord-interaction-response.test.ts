import assert from "node:assert/strict";
import test from "node:test";
import {
  InteractionResponseFlags,
  InteractionResponseType,
} from "discord-interactions";

import {
  deferredInteractionResponse,
  discordInteractionMessage,
  editOriginalDiscordInteraction,
} from "./discord-interaction-response";

test("deferredInteractionResponse acknowledges public and ephemeral commands", () => {
  assert.deepEqual(deferredInteractionResponse(), {
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  });
  assert.deepEqual(deferredInteractionResponse(true), {
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: { flags: InteractionResponseFlags.EPHEMERAL },
  });
});

test("discordInteractionMessage suppresses embeds and user mentions", () => {
  assert.deepEqual(discordInteractionMessage("result"), {
    content: "result",
    flags: 4,
    allowed_mentions: { parse: [] },
  });

  assert.equal(discordInteractionMessage("x".repeat(2_001)).content.length, 2_000);
});

test("editOriginalDiscordInteraction updates the deferred response", async () => {
  let requestedUrl = "";
  let requestedInit: RequestInit | undefined;

  await editOriginalDiscordInteraction({
    applicationId: "123456789012345678",
    interactionToken: "token/with unsafe characters",
    content: "cutoff result",
    fetchImpl: async (input, init) => {
      requestedUrl = String(input);
      requestedInit = init;
      return new Response(null, { status: 204 });
    },
  });

  assert.equal(
    requestedUrl,
    "https://discord.com/api/v10/webhooks/123456789012345678/token%2Fwith%20unsafe%20characters/messages/@original",
  );
  assert.equal(requestedInit?.method, "PATCH");
  assert.deepEqual(JSON.parse(String(requestedInit?.body)), {
    content: "cutoff result",
    flags: 4,
    allowed_mentions: { parse: [] },
  });
});

test("editOriginalDiscordInteraction rejects failed Discord updates", async () => {
  await assert.rejects(
    editOriginalDiscordInteraction({
      applicationId: "123456789012345678",
      interactionToken: "secret-token",
      content: "cutoff result",
      fetchImpl: async () => new Response(null, { status: 503 }),
    }),
    /HTTP 503/,
  );
});
