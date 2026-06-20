import "dotenv/config";
import { REST, Routes } from "discord.js";

import {
  buildDiscordBotCommands,
  getDiscordRegistrationGuildIds,
} from "../lib/bot/discord-commands";

const token = process.env.DISCORD_BOT_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;

if (!token || !applicationId) {
  throw new Error(
    "DISCORD_BOT_TOKEN and DISCORD_APPLICATION_ID are required to register commands",
  );
}

const discordToken = token;
const discordApplicationId = applicationId;

const rest = new REST({ version: "10" }).setToken(discordToken);

async function main() {
  const commands = buildDiscordBotCommands();
  const guildIds = getDiscordRegistrationGuildIds();

  await rest.put(Routes.applicationCommands(discordApplicationId), {
    body: commands,
  });
  console.log(`Registered ${commands.length} Discord command(s) globally`);

  for (const guildId of guildIds) {
    await rest.put(
      Routes.applicationGuildCommands(discordApplicationId, guildId),
      { body: commands },
    );
    console.log(
      `Registered ${commands.length} Discord command(s) for guild ${guildId}`,
    );
  }
}

main().catch((error) => {
  console.error("Failed to register Discord commands", error);
  process.exitCode = 1;
});
