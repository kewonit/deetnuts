import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDiscordBotCommands,
  getDiscordRegistrationGuildIds,
  requireDiscordSnowflake,
} from "./discord-commands";

test("buildDiscordBotCommands includes category, subcategory, and course options", () => {
  const [command] = buildDiscordBotCommands();
  const options = command.options ?? [];
  const optionNames = options.map((option) => option.name);

  assert.match(
    (command as { description?: string }).description ?? "",
    /defaults to 2026 Round 1/,
  );

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

  const yearOption = options.find((item) => item.name === "year") as
    | { choices?: { value: string | number }[]; description?: string }
    | undefined;
  assert.deepEqual(
    yearOption?.choices?.map((choice) => choice.value),
    [2026, 2025, 2024],
  );
  assert.match(yearOption?.description ?? "", /defaults to 2026/);
});

test("getDiscordRegistrationGuildIds combines legacy and allowed guild envs", () => {
  assert.deepEqual(
    getDiscordRegistrationGuildIds({
      DISCORD_GUILD_ID: "12345678901234567",
      DISCORD_ALLOWED_GUILD_IDS:
        "234567890123456789,12345678901234567",
    }),
    ["12345678901234567", "234567890123456789"],
  );
});

test("Discord registration rejects malformed application and guild IDs", () => {
  assert.throws(
    () => requireDiscordSnowflake("not-a-snowflake", "Application ID"),
    /17-20 digit Discord ID/,
  );
  assert.throws(
    () =>
      getDiscordRegistrationGuildIds({
        DISCORD_ALLOWED_GUILD_IDS: "12345678901234567,invalid",
      }),
    /DISCORD_ALLOWED_GUILD_IDS/,
  );
});
