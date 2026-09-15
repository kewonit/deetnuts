import { createPublicKey, verify as verifySignature } from "node:crypto";

const CLOCK_SKEW_SECONDS = 30;
const DEFAULT_JWKS_TTL_MS = 5 * 60 * 1000;
const MAX_JWKS_TTL_MS = 60 * 60 * 1000;
const MAX_TOKEN_BYTES = 32 * 1024;

export class AccessTokenError extends Error {
  constructor(message) {
    super(message);
    this.name = "AccessTokenError";
  }
}

function decodeBase64Url(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new AccessTokenError(`Invalid ${label}`);
  }

  try {
    return Buffer.from(value, "base64url");
  } catch {
    throw new AccessTokenError(`Invalid ${label}`);
  }
}

function decodeJsonSegment(value, label) {
  const bytes = decodeBase64Url(value, label);
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new AccessTokenError(`Invalid ${label}`);
  }
}

function parseMaxAge(cacheControl) {
  const match = /(?:^|,)\s*max-age=(\d+)\s*(?:,|$)/i.exec(cacheControl || "");
  if (!match) return DEFAULT_JWKS_TTL_MS;
  return Math.min(Number(match[1]) * 1000, MAX_JWKS_TTL_MS);
}

function normalizeAudience(audience) {
  if (typeof audience === "string") return [audience];
  if (
    Array.isArray(audience) &&
    audience.every((value) => typeof value === "string")
  ) {
    return audience;
  }
  return [];
}

export function validateConfig(environment = process.env) {
  const teamDomain = environment.CF_ACCESS_TEAM_DOMAIN?.trim().toLowerCase();
  const audience = environment.CF_ACCESS_AUD?.trim();
  const allowedEmail =
    environment.CF_ACCESS_ALLOWED_EMAIL?.trim().toLowerCase();

  if (
    !teamDomain ||
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cloudflareaccess\.com$/.test(
      teamDomain,
    )
  ) {
    throw new Error(
      "CF_ACCESS_TEAM_DOMAIN must be a valid Cloudflare Access team domain",
    );
  }
  if (!audience || !/^[A-Za-z0-9_-]{32,128}$/.test(audience)) {
    throw new Error(
      "CF_ACCESS_AUD must be the Access application audience tag",
    );
  }
  if (/^0+$/.test(audience)) {
    throw new Error("Replace the example CF_ACCESS_AUD before production use");
  }
  if (
    !allowedEmail ||
    Buffer.byteLength(allowedEmail) > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(allowedEmail) ||
    allowedEmail === "replace-with-allowed-google-email@example.invalid"
  ) {
    throw new Error(
      "CF_ACCESS_ALLOWED_EMAIL must be the intended Google account email",
    );
  }

  return {
    allowedEmail,
    audience,
    issuer: `https://${teamDomain}`,
    jwksUrl: `https://${teamDomain}/cdn-cgi/access/certs`,
  };
}

export class AccessTokenVerifier {
  constructor(config, options = {}) {
    this.config = config;
    this.fetch = options.fetch ?? globalThis.fetch;
    this.now = options.now ?? (() => Date.now());
    this.jwks = null;
    this.jwksExpiresAt = 0;
    this.pendingJwks = null;
  }

  async fetchJwks(force = false) {
    if (!force && this.jwks && this.jwksExpiresAt > this.now())
      return this.jwks;
    if (!force && this.pendingJwks) return this.pendingJwks;

    const request = (async () => {
      const response = await this.fetch(this.config.jwksUrl, {
        headers: { accept: "application/json" },
        redirect: "error",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok)
        throw new AccessTokenError("Unable to load Access signing keys");

      const body = await response.json();
      if (!body || !Array.isArray(body.keys) || body.keys.length === 0) {
        throw new AccessTokenError("Access signing keys are malformed");
      }
      for (const key of body.keys) {
        if (
          !key ||
          key.kty !== "RSA" ||
          key.use !== "sig" ||
          key.alg !== "RS256" ||
          !key.kid
        ) {
          throw new AccessTokenError("Access signing keys are malformed");
        }
      }

      this.jwks = body.keys;
      this.jwksExpiresAt =
        this.now() + parseMaxAge(response.headers.get("cache-control"));
      return this.jwks;
    })();

    if (!force) this.pendingJwks = request;
    try {
      return await request;
    } finally {
      if (this.pendingJwks === request) this.pendingJwks = null;
    }
  }

  async verify(token) {
    if (
      typeof token !== "string" ||
      token.length === 0 ||
      Buffer.byteLength(token) > MAX_TOKEN_BYTES
    ) {
      throw new AccessTokenError("Missing or oversized Access token");
    }

    const segments = token.split(".");
    if (segments.length !== 3)
      throw new AccessTokenError("Malformed Access token");

    const header = decodeJsonSegment(segments[0], "Access token header");
    const claims = decodeJsonSegment(segments[1], "Access token claims");
    const signature = decodeBase64Url(segments[2], "Access token signature");

    if (
      header.alg !== "RS256" ||
      typeof header.kid !== "string" ||
      header.kid.length === 0
    ) {
      throw new AccessTokenError("Unsupported Access token header");
    }

    let keys = await this.fetchJwks();
    let jwk = keys.find((candidate) => candidate.kid === header.kid);
    if (!jwk) {
      keys = await this.fetchJwks(true);
      jwk = keys.find((candidate) => candidate.kid === header.kid);
    }
    if (!jwk) throw new AccessTokenError("Unknown Access signing key");

    let publicKey;
    try {
      publicKey = createPublicKey({ key: jwk, format: "jwk" });
    } catch {
      throw new AccessTokenError("Invalid Access signing key");
    }

    const validSignature = verifySignature(
      "RSA-SHA256",
      Buffer.from(`${segments[0]}.${segments[1]}`, "ascii"),
      publicKey,
      signature,
    );
    if (!validSignature)
      throw new AccessTokenError("Invalid Access token signature");

    const nowSeconds = Math.floor(this.now() / 1000);
    if (claims.iss !== this.config.issuer)
      throw new AccessTokenError("Invalid Access token issuer");
    if (!normalizeAudience(claims.aud).includes(this.config.audience)) {
      throw new AccessTokenError("Invalid Access token audience");
    }
    if (claims.type !== "app")
      throw new AccessTokenError("Invalid Access token type");
    if (
      typeof claims.exp !== "number" ||
      claims.exp <= nowSeconds - CLOCK_SKEW_SECONDS
    ) {
      throw new AccessTokenError("Expired Access token");
    }
    if (
      typeof claims.iat !== "number" ||
      claims.iat > nowSeconds + CLOCK_SKEW_SECONDS
    ) {
      throw new AccessTokenError("Invalid Access token issued-at time");
    }
    if (
      claims.nbf !== undefined &&
      (typeof claims.nbf !== "number" ||
        claims.nbf > nowSeconds + CLOCK_SKEW_SECONDS)
    ) {
      throw new AccessTokenError("Access token is not active");
    }
    if (typeof claims.sub !== "string" || claims.sub.length === 0) {
      throw new AccessTokenError("Invalid Access token subject");
    }
    if (
      typeof claims.email !== "string" ||
      claims.email.trim().toLowerCase() !== this.config.allowedEmail
    ) {
      throw new AccessTokenError("Access email is not allowed");
    }

    return claims;
  }
}
