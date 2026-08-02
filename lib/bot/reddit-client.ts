const REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const REDDIT_AUTHORIZE_URL = "https://www.reddit.com/api/v1/authorize";
const REDDIT_OAUTH_ORIGIN = "https://oauth.reddit.com";
const REQUEST_TIMEOUT_MS = 30_000;

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

type RedditTokenResponse = {
  access_token?: unknown;
  expires_in?: unknown;
  refresh_token?: unknown;
  token_type?: unknown;
};

type RedditListingResponse = {
  data?: {
    children?: Array<{ data?: Record<string, unknown> }>;
  };
};

export type RedditComment = {
  id: string;
  name: string;
  body?: string;
  author?: string;
  subreddit?: string;
  reply(text: string): Promise<void>;
};

export type RedditClientOptions = {
  userAgent: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  fetchImpl?: FetchLike;
};

const requireNonEmpty = (value: unknown, label: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Reddit ${label} response is missing`);
  }
  return value;
};

const requireBearerToken = (token: RedditTokenResponse) => {
  const tokenType = requireNonEmpty(token.token_type, "token type");
  if (tokenType.toLowerCase() !== "bearer") {
    throw new Error("Reddit token type response is invalid");
  }
};

const parseJsonResponse = async <T>(
  response: Response,
  label: string,
): Promise<T> => {
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new Error(`${label} returned invalid JSON`);
  }
  if (!response.ok) {
    throw new Error(`${label} failed with HTTP ${response.status}`);
  }
  return value as T;
};

const basicAuthorization = (clientId: string, clientSecret: string) =>
  `Basic ${Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64")}`;

export function createRedditAuthorizationUrl({
  clientId,
  redirectUri,
  state,
  scopes,
}: {
  clientId: string;
  redirectUri: string;
  state: string;
  scopes: readonly string[];
}) {
  const url = new URL(REDDIT_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("duration", "permanent");
  url.searchParams.set("scope", scopes.join(" "));
  return url.toString();
}

export async function exchangeRedditAuthorizationCode({
  clientId,
  clientSecret = "",
  redirectUri,
  userAgent,
  code,
  fetchImpl = fetch,
}: {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  userAgent: string;
  code: string;
  fetchImpl?: FetchLike;
}) {
  const response = await fetchImpl(REDDIT_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthorization(clientId, clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const token = await parseJsonResponse<RedditTokenResponse>(
    response,
    "Reddit authorization-code exchange",
  );
  requireBearerToken(token);
  return {
    accessToken: requireNonEmpty(token.access_token, "access token"),
    refreshToken: requireNonEmpty(token.refresh_token, "refresh token"),
  };
}

export async function getRedditIdentity({
  accessToken,
  userAgent,
  fetchImpl = fetch,
}: {
  accessToken: string;
  userAgent: string;
  fetchImpl?: FetchLike;
}) {
  const response = await fetchImpl(`${REDDIT_OAUTH_ORIGIN}/api/v1/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": userAgent,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const identity = await parseJsonResponse<{ name?: unknown }>(
    response,
    "Reddit identity request",
  );
  return { name: requireNonEmpty(identity.name, "identity name") };
}

export class RedditClient {
  private readonly fetchImpl: FetchLike;
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;
  private accessTokenRequest: Promise<string> | null = null;

  constructor(private readonly options: RedditClientOptions) {
    for (const [label, value] of [
      ["user agent", options.userAgent],
      ["client ID", options.clientId],
      ["client secret", options.clientSecret],
      ["refresh token", options.refreshToken],
    ] as const) {
      if (!value.trim()) {
        throw new Error(`Reddit ${label} is required`);
      }
    }
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async requestAccessToken(): Promise<string> {
    const response = await this.fetchImpl(REDDIT_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: basicAuthorization(
          this.options.clientId,
          this.options.clientSecret,
        ),
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": this.options.userAgent,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.options.refreshToken,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const token = await parseJsonResponse<RedditTokenResponse>(
      response,
      "Reddit token refresh",
    );
    requireBearerToken(token);
    const accessToken = requireNonEmpty(token.access_token, "access token");
    const expiresIn = Number(token.expires_in);
    if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new Error("Reddit token expiry response is invalid");
    }
    this.accessToken = accessToken;
    this.accessTokenExpiresAt = Date.now() + Math.max(0, expiresIn - 60) * 1000;
    return accessToken;
  }

  private async getAccessToken(forceRefresh = false): Promise<string> {
    if (
      !forceRefresh &&
      this.accessToken &&
      Date.now() < this.accessTokenExpiresAt
    ) {
      return this.accessToken;
    }
    if (!this.accessTokenRequest) {
      this.accessTokenRequest = this.requestAccessToken().finally(() => {
        this.accessTokenRequest = null;
      });
    }
    return this.accessTokenRequest;
  }

  private async oauthRequest(
    path: string,
    init: RequestInit = {},
    retryUnauthorized = true,
  ): Promise<Response> {
    const accessToken = await this.getAccessToken(!retryUnauthorized);
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    headers.set("User-Agent", this.options.userAgent);
    const response = await this.fetchImpl(`${REDDIT_OAUTH_ORIGIN}${path}`, {
      ...init,
      headers,
      signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.status === 401 && retryUnauthorized) {
      this.accessToken = null;
      this.accessTokenExpiresAt = 0;
      return this.oauthRequest(path, init, false);
    }
    if (!response.ok) {
      throw new Error(`Reddit API request failed with HTTP ${response.status}`);
    }
    return response;
  }

  async getMe() {
    const response = await this.oauthRequest("/api/v1/me");
    const identity = (await response.json()) as { name?: unknown };
    return { name: requireNonEmpty(identity.name, "identity name") };
  }

  async getNewComments(subreddit: string, limit = 50): Promise<RedditComment[]> {
    if (!/^[A-Za-z0-9_]{2,21}$/.test(subreddit)) {
      throw new Error(`Invalid subreddit name: ${subreddit}`);
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("Reddit comment limit must be an integer from 1 to 100");
    }
    const response = await this.oauthRequest(
      `/r/${encodeURIComponent(subreddit)}/comments.json?limit=${limit}&raw_json=1`,
    );
    const listing = (await response.json()) as RedditListingResponse;
    const children = listing.data?.children;
    if (!Array.isArray(children)) {
      throw new Error("Reddit comments response is malformed");
    }
    return children.map(({ data }, index) => {
      const id = requireNonEmpty(data?.id, `comment ${index + 1} id`);
      const name = requireNonEmpty(
        data?.name ?? `t1_${id}`,
        `comment ${index + 1} fullname`,
      );
      return {
        id,
        name,
        body: typeof data?.body === "string" ? data.body : undefined,
        author: typeof data?.author === "string" ? data.author : undefined,
        subreddit:
          typeof data?.subreddit === "string" ? data.subreddit : undefined,
        reply: (text: string) => this.reply(name, text),
      };
    });
  }

  async reply(parentFullname: string, text: string): Promise<void> {
    if (!/^t1_[a-z0-9]+$/i.test(parentFullname)) {
      throw new Error("Reddit reply target is invalid");
    }
    if (!text.trim()) {
      throw new Error("Reddit reply text cannot be empty");
    }
    const response = await this.oauthRequest("/api/comment", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        api_type: "json",
        thing_id: parentFullname,
        text,
        raw_json: "1",
      }),
    });
    const result = (await response.json()) as {
      json?: { errors?: unknown[] };
    };
    if (!Array.isArray(result.json?.errors) || result.json.errors.length > 0) {
      throw new Error("Reddit rejected the comment reply");
    }
  }
}
