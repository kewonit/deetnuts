import { writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

import {
  claimBotEventViaApi,
  logBotUsageViaApi,
  queryCutoffsViaBotApi,
  updateBotEventViaApi,
} from "../lib/bot/api-client";
import {
  CUTOFF_COMMAND_USAGE,
  parseCutoffFlagCommand,
} from "../lib/bot/commands";
import { formatRedditCutoffResponse } from "../lib/bot/formatters";
import {
  RedditClient,
  type RedditComment,
} from "../lib/bot/reddit-client";

const DEFAULT_POLL_INTERVAL_MS = 60_000;
const DEFAULT_LIMIT = 50;
const DEFAULT_HEALTH_FILE = "/tmp/reddit-worker-healthy";

let shutdownRequested = false;
const shutdownController = new AbortController();

function requestShutdown(signal: NodeJS.Signals) {
  if (shutdownRequested) return;
  shutdownRequested = true;
  console.log(`Received ${signal}; stopping Reddit worker`);
  shutdownController.abort();
}

process.once("SIGINT", () => requestShutdown("SIGINT"));
process.once("SIGTERM", () => requestShutdown("SIGTERM"));

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function parseCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isDryRun() {
  return process.env.REDDIT_DRY_RUN !== "false";
}

function getAuthorName(comment: RedditComment) {
  return comment.author ?? "";
}

function getSubredditName(comment: RedditComment, fallback: string) {
  return comment.subreddit ?? fallback;
}

function getRequestId(comment: RedditComment) {
  return comment.name || `t1_${comment.id}`;
}

async function logWorkerEvent(event: Parameters<typeof logBotUsageViaApi>[0]) {
  if (isDryRun()) {
    console.log("[dry-run] usage", event);
    return;
  }

  try {
    await logBotUsageViaApi(event);
  } catch (error) {
    console.warn("Failed to log Reddit worker usage event", error);
  }
}

async function markEvent(
  eventId: string | null,
  status: "replied" | "skipped" | "failed",
  metadata?: Record<string, unknown>,
) {
  if (!eventId || isDryRun()) return;

  try {
    await updateBotEventViaApi({ id: eventId, status, metadata });
  } catch (error) {
    console.warn("Failed to update bot event status", error);
  }
}

async function maybeReply(comment: RedditComment, text: string) {
  if (isDryRun()) {
    console.log("[dry-run] would reply", {
      comment: getRequestId(comment),
      text,
    });
    return;
  }

  await comment.reply(text);
}

function getUserFacingQueryError(error: unknown) {
  if (!(error instanceof Error)) return null;

  if (
    error.message.startsWith("Unsupported category") ||
    error.message.startsWith("Unsupported subcategory") ||
    error.message.startsWith("Unsupported branch/course") ||
    error.message.includes("is not available for") ||
    error.message.startsWith("Use either branch or course") ||
    /^Year \d+ is not supported$/.test(error.message) ||
    /^Round \d+ is not available for \d+$/.test(error.message) ||
    error.message === "Invalid cutoff query"
  ) {
    return error.message;
  }

  return null;
}

async function processComment({
  comment,
  subreddit,
  botUsername,
  dryRunSeen,
}: {
  comment: RedditComment;
  subreddit: string;
  botUsername: string | null;
  dryRunSeen: Set<string>;
}) {
  const body = comment.body ?? "";
  if (!body.includes("--percentile")) return;

  const requestId = getRequestId(comment);
  const source = getSubredditName(comment, subreddit);
  const startedAt = Date.now();
  const authorName = getAuthorName(comment);

  if (!body.trim() || body === "[deleted]" || body === "[removed]") return;
  if (botUsername && authorName === botUsername) return;

  if (isDryRun()) {
    if (dryRunSeen.has(requestId)) return;
    dryRunSeen.add(requestId);
  } else {
    const claim = await claimBotEventViaApi({
      platform: "reddit",
      externalId: requestId,
      action: "cutoff_request",
      metadata: { subreddit: source },
    });

    if (!claim.claimed) {
      return;
    }

    try {
      await handleClaimedComment({
        comment,
        requestId,
        source,
        eventId: claim.event.id,
        startedAt,
        body,
      });
    } catch (error) {
      await markEvent(claim.event.id, "failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
    return;
  }

  await handleClaimedComment({
    comment,
    requestId,
    source,
    eventId: null,
    startedAt,
    body,
  });
}

async function handleClaimedComment({
  comment,
  requestId,
  source,
  eventId,
  startedAt,
  body,
}: {
  comment: RedditComment;
  requestId: string;
  source: string;
  eventId: string | null;
  startedAt: number;
  body: string;
}) {
  const parsed = parseCutoffFlagCommand(body);

  if (!parsed.ok) {
    await maybeReply(comment, `${parsed.error} ${CUTOFF_COMMAND_USAGE}`);
    await logWorkerEvent({
      requestId,
      externalId: requestId,
      platform: "reddit",
      source,
      eventName: "cutoff_request",
      status: "rejected",
      durationMs: Date.now() - startedAt,
      errorCode: "INVALID_COMMAND",
    });
    await markEvent(eventId, "skipped", { reason: parsed.error });
    return;
  }

  try {
    const result = await queryCutoffsViaBotApi({
      ...parsed.command,
      platform: "reddit",
      source,
    });
    await maybeReply(comment, formatRedditCutoffResponse(result));
    await logWorkerEvent({
      requestId,
      externalId: requestId,
      platform: "reddit",
      source,
      eventName: "cutoff_request",
      status: "served",
      percentile: result.query.percentile,
      year: result.query.year,
      round: result.query.round,
      resultCount: result.rows.length,
      durationMs: Date.now() - startedAt,
    });
    await markEvent(eventId, "replied", { resultCount: result.rows.length });
  } catch (error) {
    const userFacingError = getUserFacingQueryError(error);

    if (userFacingError) {
      await maybeReply(comment, `${userFacingError} ${CUTOFF_COMMAND_USAGE}`);
    }

    await logWorkerEvent({
      requestId,
      externalId: requestId,
      platform: "reddit",
      source,
      eventName: "cutoff_request",
      status: userFacingError ? "rejected" : "failed",
      percentile: parsed.command.percentile,
      year: parsed.command.year,
      round: parsed.command.round,
      resultCount: 0,
      durationMs: Date.now() - startedAt,
      errorCode: error instanceof Error ? error.message : "UNKNOWN",
    });
    await markEvent(eventId, userFacingError ? "skipped" : "failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function pollSubreddit({
  reddit,
  subreddit,
  botUsername,
  dryRunSeen,
}: {
  reddit: RedditClient;
  subreddit: string;
  botUsername: string | null;
  dryRunSeen: Set<string>;
}) {
  const comments = await reddit.getNewComments(subreddit, DEFAULT_LIMIT);

  for (const comment of [...comments].reverse()) {
    if (shutdownRequested) return;
    await processComment({ comment, subreddit, botUsername, dryRunSeen });
    await touchHealthFile();
  }
}

async function logHeartbeat(subreddits: string[]) {
  await logWorkerEvent({
    requestId: `reddit-worker-${Date.now()}`,
    platform: "worker",
    source: subreddits.join(","),
    eventName: "worker_heartbeat",
    status: "heartbeat",
  });
}

async function touchHealthFile() {
  const healthFile =
    process.env.REDDIT_WORKER_HEALTH_FILE || DEFAULT_HEALTH_FILE;
  await writeFile(healthFile, `${Date.now()}\n`, { mode: 0o600 });
}

async function main() {
  if (process.env.NODE_ENV !== "production") {
    await import("dotenv/config");
  }

  const subreddits = parseCsv(requiredEnv("REDDIT_SUBREDDITS"));
  if (subreddits.length === 0) {
    throw new Error("REDDIT_SUBREDDITS must contain at least one subreddit");
  }

  const reddit = new RedditClient({
    userAgent: requiredEnv("REDDIT_USER_AGENT"),
    clientId: requiredEnv("REDDIT_CLIENT_ID"),
    clientSecret: requiredEnv("REDDIT_CLIENT_SECRET"),
    refreshToken: requiredEnv("REDDIT_REFRESH_TOKEN"),
  });

  const pollIntervalMs = parsePositiveInt(
    process.env.REDDIT_POLL_INTERVAL_MS,
    DEFAULT_POLL_INTERVAL_MS,
  );
  const dryRunSeen = new Set<string>();
  const botUsername = await reddit
    .getMe()
    .then((user) => user.name)
    .catch(() => null);

  console.log("Starting Reddit cutoff worker", {
    subreddits,
    pollIntervalMs,
    dryRun: isDryRun(),
    botUsername,
  });

  await logHeartbeat(subreddits);
  await touchHealthFile();

  while (!shutdownRequested) {
    for (const subreddit of subreddits) {
      if (shutdownRequested) break;
      try {
        await pollSubreddit({ reddit, subreddit, botUsername, dryRunSeen });
      } catch (error) {
        console.error(`Failed to poll r/${subreddit}`, error);
      }
    }

    if (shutdownRequested) break;
    await logHeartbeat(subreddits);
    await touchHealthFile();

    try {
      await sleep(pollIntervalMs, undefined, {
        signal: shutdownController.signal,
      });
    } catch (error) {
      if (!(error instanceof Error) || error.name !== "AbortError") {
        throw error;
      }
    }
  }

  console.log("Reddit cutoff worker stopped");
}

main().catch((error) => {
  console.error("Reddit worker crashed", error);
  process.exitCode = 1;
});
