import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDiscordBotCommands,
  getDiscordRegistrationGuildIds,
} from "./discord-commands";

test("buildDiscordBotCommands includes category, subcategory, and course options", () => {
  const [command] = buildDiscordBotCommands();
  const options = command.options ?? [];
  const optionNames = options.map((option) => option.name);

  assert.deepEqual(optionNames, [
    "percentile",
    "year",
    "round",
    "category",
    "subcategory",
    "course",
  ]);

  const subcategoryOption = options.find(
    (item) => item.name === "subcategory",
  ) as { choices?: { value: string | number }[] } | undefined;
  const subcategoryChoices = subcategoryOption?.choices ?? [];

  assert.ok(subcategoryChoices.some((choice) => choice.value === "all"));
  assert.ok(
    subcategoryChoices.some((choice) => choice.value === "ladies_home"),
  );
  assert.ok(
    subcategoryChoices.some(
      (choice) => choice.value === "gender_neutral_state",
    ),
  );

  const courseOption = options.find((item) => item.name === "course") as
    | { choices?: { value: string | number }[] }
    | undefined;
  const courseChoices = courseOption?.choices ?? [];

  assert.ok(courseChoices.some((choice) => choice.value === "cs_it"));
  assert.ok(courseChoices.some((choice) => choice.value === "ai_ds"));
  assert.ok(
    courseChoices.some((choice) => choice.value === "electronics_comm"),
  );
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
