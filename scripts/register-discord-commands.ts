import "dotenv/config";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  REST,
  Routes,
  SlashCommandBuilder,
  type RESTPutAPIApplicationCommandsJSONBody,
} from "discord.js";

import {
  ROUNDS_BY_YEAR,
  YEAR_OPTIONS,
} from "../lib/mht-cet/state-cutoffs/config";
import { BOT_CUTOFF_CATEGORY_GROUPS } from "../lib/bot/categories";
import { BOT_BRANCH_GROUPS } from "../lib/bot/branch-groups";

const token = process.env.DISCORD_BOT_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !applicationId) {
  throw new Error(
    "DISCORD_BOT_TOKEN and DISCORD_APPLICATION_ID are required to register commands",
  );
}

const discordToken = token;
const discordApplicationId = applicationId;

const supportedRounds = Array.from(
  new Set(Object.values(ROUNDS_BY_YEAR).flat()),
).sort((a, b) => a - b);

const commands: RESTPutAPIApplicationCommandsJSONBody = [
  new SlashCommandBuilder()
    .setName("cutoff")
    .setDescription(
      "Get top MHT-CET state cutoffs near a percentile",
    )
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addNumberOption((option) =>
      option
        .setName("percentile")
        .setDescription("MHT-CET percentile, e.g. 95")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(100),
    )
    .addIntegerOption((option) =>
      option
        .setName("year")
        .setDescription("CAP year")
        .setRequired(false)
        .addChoices(
          ...YEAR_OPTIONS.map((year) => ({
            name: year.label,
            value: year.value,
          })),
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("round")
        .setDescription("CAP round")
        .setRequired(false)
        .addChoices(
          ...supportedRounds.map((round) => ({
            name: `Round ${round}`,
            value: round,
          })),
        ),
    )
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("Reservation category group; defaults to Open General")
        .setRequired(false)
        .addChoices(
          ...BOT_CUTOFF_CATEGORY_GROUPS.map((group) => ({
            name: group.label,
            value: group.id,
          })),
        ),
    )
    .addStringOption((option) =>
      option
        .setName("branch")
        .setDescription("Branch or course group; defaults to all branches")
        .setRequired(false)
        .addChoices(
          ...BOT_BRANCH_GROUPS.map((group) => ({
            name: group.label,
            value: group.id,
          })),
        ),
    )
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(discordToken);

async function main() {
  const route = guildId
    ? Routes.applicationGuildCommands(discordApplicationId, guildId)
    : Routes.applicationCommands(discordApplicationId);

  await rest.put(route, { body: commands });

  console.log(
    `Registered ${commands.length} Discord command(s) ${guildId ? `for guild ${guildId}` : "globally"}`,
  );
}

main().catch((error) => {
  console.error("Failed to register Discord commands", error);
  process.exitCode = 1;
});
