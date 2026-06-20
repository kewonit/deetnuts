function parseCsv(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export function isAllowedSource(
  source: string | null | undefined,
  configuredCsv: string | undefined,
) {
  const allowed = parseCsv(configuredCsv);
  if (allowed.size === 0) return true;
  if (!source) return false;
  return allowed.has(source);
}

export function isDiscordGuildAllowed(guildId: string | null | undefined) {
  return isAllowedSource(guildId, process.env.DISCORD_ALLOWED_GUILD_IDS);
}

export function isRedditSubredditAllowed(subreddit: string | null | undefined) {
  return isAllowedSource(subreddit, process.env.REDDIT_SUBREDDITS);
}
