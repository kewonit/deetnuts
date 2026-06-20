import {
  ApplicationIntegrationType,
  InteractionContextType,
  SlashCommandBuilder,
  type RESTPutAPIApplicationCommandsJSONBody,
} from "discord.js";

import {
  ROUNDS_BY_YEAR,
  YEAR_OPTIONS,
} from "@/lib/mht-cet/state-cutoffs/config";
import { BOT_BRANCH_GROUPS } from "./branch-groups";
import { BOT_CUTOFF_CATEGORY_GROUPS } from "./categories";

const DISCORD_GUILD_ID_ENV_KEYS = [
  "DISCORD_GUILD_ID",
  "DISCORD_ALLOWED_GUILD_IDS",
] as const;

function splitCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getDiscordRegistrationGuildIds(
  env: Record<string, string | undefined> = process.env,
) {
  const guildIds = new Set<string>();

  for (const key of DISCORD_GUILD_ID_ENV_KEYS) {
    for (const guildId of splitCsv(env[key])) {
      guildIds.add(guildId);
    }
  }

  return [...guildIds];
}

export function buildDiscordBotCommands(): RESTPutAPIApplicationCommandsJSONBody {
  const supportedRounds = Array.from(
    new Set(Object.values(ROUNDS_BY_YEAR).flat()),
  ).sort((a, b) => a - b);

  return [
    new SlashCommandBuilder()
      .setName("cutoff")
      .setDescription("Get top MHT-CET state cutoffs near a percentile")
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
          .setDescription("Branch group; defaults to all branches")
          .setRequired(false)
          .addChoices(
            ...BOT_BRANCH_GROUPS.map((group) => ({
              name: group.label,
              value: group.id,
            })),
          ),
      )
      .addStringOption((option) =>
        option
          .setName("course")
          .setDescription("Course group; same choices as branch")
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
}
