import assert from "node:assert/strict";
import test from "node:test";

import {
  createRedditAuthorizationUrl,
  RedditClient,
} from "./reddit-client";

const jsonResponse = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("createRedditAuthorizationUrl requests permanent least-privilege access", () => {
  const url = new URL(
    createRedditAuthorizationUrl({
      clientId: "client-id",
      redirectUri: "http://localhost:8080/reddit/callback",
      state: "random-state",
      scopes: ["identity", "read", "submit"],
    }),
  );

  assert.equal(url.origin + url.pathname, "https://www.reddit.com/api/v1/authorize");
  assert.equal(url.searchParams.get("client_id"), "client-id");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("duration"), "permanent");
  assert.equal(url.searchParams.get("scope"), "identity read submit");
  assert.equal(url.searchParams.get("state"), "random-state");
});

test("RedditClient refreshes once, reads comments, and replies with OAuth", async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    requests.push({ url, init });
    if (url.endsWith("/api/v1/access_token")) {
      return jsonResponse({
        access_token: "access-token",
        expires_in: 3600,
        token_type: "bearer",
      });
    }
    if (url.endsWith("/api/v1/me")) {
      return jsonResponse({ name: "deetnuts-bot" });
    }
    if (url.includes("/r/mht_cet/comments.json")) {
      return jsonResponse({
        data: {
          children: [
            {
              data: {
                id: "abc123",
                name: "t1_abc123",
                body: "--percentile 95",
                author: "student",
                subreddit: "mht_cet",
              },
            },
          ],
        },
      });
    }
    if (url.endsWith("/api/comment")) {
      return jsonResponse({ json: { errors: [] } });
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  const client = new RedditClient({
    userAgent: "deetnuts:test:v1 (by /u/deetnuts)",
    clientId: "client-id",
    clientSecret: "client-secret",
    refreshToken: "refresh-token",
    fetchImpl,
  });

  assert.deepEqual(await client.getMe(), { name: "deetnuts-bot" });
  const comments = await client.getNewComments("mht_cet", 25);
  assert.equal(comments.length, 1);
  assert.equal(comments[0].name, "t1_abc123");
  await comments[0].reply("Test reply");

  assert.equal(
    requests.filter(({ url }) => url.endsWith("/api/v1/access_token")).length,
    1,
  );
  for (const request of requests.filter(({ url }) =>
    url.startsWith("https://oauth.reddit.com"),
  )) {
    assert.equal(
      new Headers(request.init?.headers).get("Authorization"),
      "Bearer access-token",
    );
  }
  const replyRequest = requests.find(({ url }) => url.endsWith("/api/comment"));
  assert.equal(replyRequest?.init?.method, "POST");
  assert.equal(
    (replyRequest?.init?.body as URLSearchParams).get("thing_id"),
    "t1_abc123",
  );
});

test("RedditClient rejects unsafe subreddit and reply inputs before fetching", async () => {
  const client = new RedditClient({
    userAgent: "deetnuts:test:v1 (by /u/deetnuts)",
    clientId: "client-id",
    clientSecret: "client-secret",
    refreshToken: "refresh-token",
    fetchImpl: async () => {
      throw new Error("fetch should not run");
    },
  });

  await assert.rejects(
    client.getNewComments("../unsafe", 25),
    /Invalid subreddit name/,
  );
  await assert.rejects(client.reply("t3_not-a-comment", "text"), /target/);
  await assert.rejects(client.reply("t1_abc123", "   "), /cannot be empty/);
});

test("RedditClient fails closed for missing credentials and invalid token types", async () => {
  assert.throws(
    () =>
      new RedditClient({
        userAgent: " ",
        clientId: "client-id",
        clientSecret: "client-secret",
        refreshToken: "refresh-token",
      }),
    /user agent is required/,
  );

  const client = new RedditClient({
    userAgent: "deetnuts:test:v1 (by /u/deetnuts)",
    clientId: "client-id",
    clientSecret: "client-secret",
    refreshToken: "refresh-token",
    fetchImpl: async () =>
      jsonResponse({
        access_token: "access-token",
        expires_in: 3600,
        token_type: "mac",
      }),
  });

  await assert.rejects(client.getMe(), /token type response is invalid/);
});
