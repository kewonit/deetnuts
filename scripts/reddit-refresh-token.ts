import "dotenv/config";
import crypto from "node:crypto";
import {
  createRedditAuthorizationUrl,
  exchangeRedditAuthorizationCode,
  getRedditIdentity,
} from "../lib/bot/reddit-client";

const DEFAULT_REDIRECT_URI = "http://localhost:8080/reddit/callback";
const REQUIRED_SCOPES = ["identity", "read", "submit"];

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function requiredEnv(name: string) {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function printAuthorizationInstructions({
  clientId,
  redirectUri,
}: {
  clientId: string;
  redirectUri: string;
}) {
  const state = readEnv("REDDIT_AUTH_STATE") ?? crypto.randomBytes(16).toString("hex");
  const authUrl = createRedditAuthorizationUrl({
    clientId,
    redirectUri,
    state,
    scopes: REQUIRED_SCOPES,
  });

  console.log("Create or edit the Reddit app here:");
  console.log("https://www.reddit.com/prefs/apps");
  console.log("");
  console.log("Use this redirect URI exactly:");
  console.log(redirectUri);
  console.log("");
  console.log("Open this authorization URL, allow the app, then copy the code query parameter:");
  console.log(authUrl);
  console.log("");
  console.log("Then run:");
  console.log("REDDIT_AUTH_CODE=<code-from-redirect-url> npm run reddit:auth");
}

async function exchangeCodeForRefreshToken({
  clientId,
  clientSecret,
  redirectUri,
  userAgent,
  code,
}: {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  userAgent: string;
  code: string;
}) {
  const tokens = await exchangeRedditAuthorizationCode({
    code,
    userAgent,
    clientId,
    clientSecret,
    redirectUri,
  });

  const username = await getRedditIdentity({
    accessToken: tokens.accessToken,
    userAgent,
  }).then((user) => user.name);

  console.log(`Authorized Reddit user: ${username}`);
  console.log("");
  console.log("Add this to the worker environment:");
  console.log(`REDDIT_REFRESH_TOKEN=${tokens.refreshToken}`);
}

async function main() {
  const clientId = requiredEnv("REDDIT_CLIENT_ID");
  const redirectUri = readEnv("REDDIT_REDIRECT_URI") ?? DEFAULT_REDIRECT_URI;
  const code = readEnv("REDDIT_AUTH_CODE");

  if (!code) {
    printAuthorizationInstructions({ clientId, redirectUri });
    return;
  }

  await exchangeCodeForRefreshToken({
    clientId,
    clientSecret: readEnv("REDDIT_CLIENT_SECRET"),
    redirectUri,
    userAgent: requiredEnv("REDDIT_USER_AGENT"),
    code,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
