import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDiscordBotCommands,
  getDiscordRegistrationGuildIds,
} from "./discord-commands";

test("buildDiscordBotCommands includes category, branch, and course options", () => {
  const [command] = buildDiscordBotCommands();
  const options = command.options ?? [];
  const optionNames = options.map((option) => option.name);

  assert.deepEqual(optionNames, [
    "percentile",
    "year",
    "round",
    "category",
    "branch",
    "course",
  ]);

  for (const optionName of ["branch", "course"]) {
    const option = options.find((item) => item.name === optionName) as
      | { choices?: { value: string | number }[] }
      | undefined;
    const choices = option?.choices ?? [];

    assert.ok(choices.some((choice) => choice.value === "cs_it"));
    assert.ok(choices.some((choice) => choice.value === "ai_ds"));
    assert.ok(choices.some((choice) => choice.value === "electronics_comm"));
  }
});

test("getDiscordRegistrationGuildIds combines legacy and allowed guild envs", () => {
  assert.deepEqual(
    getDiscordRegistrationGuildIds({
      DISCORD_GUILD_ID: "guild-a",
      DISCORD_ALLOWED_GUILD_IDS: "guild-b,guild-a",
    }),
    ["guild-a", "guild-b"],
  );
});
