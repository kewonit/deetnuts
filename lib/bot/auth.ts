import { timingSafeEqual } from "node:crypto";

export function hasValidBotToken(headers: Headers) {
  const configuredToken = process.env.BOT_API_TOKEN;
  if (!configuredToken) return false;

  const authHeader = headers.get("authorization") ?? "";
  const providedToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (!providedToken) return false;

  const configured = Buffer.from(configuredToken);
  const provided = Buffer.from(providedToken);

  if (configured.length !== provided.length) return false;
  return timingSafeEqual(configured, provided);
}
