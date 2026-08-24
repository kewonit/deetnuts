import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import { cookies } from "next/headers";
import PocketBase, { ClientResponseError, type RecordModel } from "pocketbase";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";

const HOST_COOKIE_PREFIX = process.env.NODE_ENV === "production" ? "__Host-" : "";

export const AUTH_COOKIE_NAME = `${HOST_COOKIE_PREFIX}deetnuts_auth`;
export const OAUTH_STATE_COOKIE_NAME = `${HOST_COOKIE_PREFIX}deetnuts_oauth`;

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const OAUTH_STATE_VERSION = "v1";
const OAUTH_STATE_IV_BYTES = 12;
const OAUTH_STATE_TAG_BYTES = 16;
const OAUTH_STATE_MAX_LENGTH = 4096;
const OAUTH_STATE_CONTEXT = Buffer.from("deetnuts/oauth-state/v1");

export interface PocketBaseUserRecord extends RecordModel {
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  full_name?: string;
  avatar_url?: string;
  username?: string;
  website?: string;
  supabase_id?: string;
}

interface OAuthStatePayload {
  provider: "google";
  state: string;
  codeVerifier: string;
  redirect: string;
  issuedAt: number;
}

function getInternalUrl(): string {
  const raw = process.env.POCKETBASE_INTERNAL_URL?.trim();
  if (!raw) throw new Error("POCKETBASE_INTERNAL_URL is not configured");
  const url = new URL(raw);
  const isLocalDevelopment =
    process.env.NODE_ENV !== "production" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);
  if (
    url.protocol !== "http:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    (url.hostname !== "pocketbase" && !isLocalDevelopment)
  ) {
    throw new Error(
      "POCKETBASE_INTERNAL_URL must be the private http://pocketbase:8090 origin",
    );
  }
  return url.origin;
}

function getStateSecret(): Buffer {
  const value = process.env.AUTH_STATE_SECRET;
  if (!value || Buffer.byteLength(value) < 32) {
    throw new Error("AUTH_STATE_SECRET must contain at least 32 bytes");
  }
  return Buffer.from(value);
}

function getStateEncryptionKey(): Buffer {
  // AUTH_STATE_SECRET is high-entropy key material, not a user password.
  return Buffer.from(
    hkdfSync(
      "sha256",
      getStateSecret(),
      OAUTH_STATE_CONTEXT,
      OAUTH_STATE_CONTEXT,
      32,
    ),
  );
}

function parseJwtExpiration(token: string): Date | undefined {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    ) as { exp?: unknown };
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return undefined;
    }
    const expires = new Date(payload.exp * 1000);
    return expires.getTime() > Date.now() ? expires : undefined;
  } catch {
    return undefined;
  }
}

export function createUserPocketBase(): PocketBase {
  const pb = new PocketBase(getInternalUrl());
  pb.autoCancellation(false);
  return pb;
}

export function getAuthCallbackUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const origin = configured ? new URL(configured).origin : "http://localhost:3000";
  if (
    process.env.NODE_ENV === "production" &&
    origin !== "https://www.deetnuts.com"
  ) {
    throw new Error("Production OAuth callback origin must be https://www.deetnuts.com");
  }
  return new URL("/auth/callback", `${origin}/`).toString();
}

export function sealOAuthState(
  state: string,
  codeVerifier: string,
  redirect: string,
): string {
  const payload: OAuthStatePayload = {
    provider: "google",
    state,
    codeVerifier,
    redirect: sanitizeRedirectPath(redirect),
    issuedAt: Date.now(),
  };
  const iv = randomBytes(OAUTH_STATE_IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", getStateEncryptionKey(), iv);
  cipher.setAAD(OAUTH_STATE_CONTEXT);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    OAUTH_STATE_VERSION,
    iv.toString("base64url"),
    ciphertext.toString("base64url"),
    tag.toString("base64url"),
  ].join(".");
}

export function openOAuthState(
  value: string | undefined,
): OAuthStatePayload | null {
  if (!value || value.length > OAUTH_STATE_MAX_LENGTH) return null;
  const [version, encodedIv, encodedCiphertext, encodedTag, extra] =
    value.split(".");
  if (
    version !== OAUTH_STATE_VERSION ||
    !encodedIv ||
    !encodedCiphertext ||
    !encodedTag ||
    extra
  ) {
    return null;
  }

  try {
    const iv = Buffer.from(encodedIv, "base64url");
    const ciphertext = Buffer.from(encodedCiphertext, "base64url");
    const tag = Buffer.from(encodedTag, "base64url");
    if (
      iv.length !== OAUTH_STATE_IV_BYTES ||
      !ciphertext.length ||
      tag.length !== OAUTH_STATE_TAG_BYTES
    ) {
      return null;
    }
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getStateEncryptionKey(),
      iv,
    );
    decipher.setAAD(OAUTH_STATE_CONTEXT);
    decipher.setAuthTag(tag);
    const encoded = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
    const payload = JSON.parse(encoded) as Partial<OAuthStatePayload>;
    if (
      payload.provider !== "google" ||
      typeof payload.state !== "string" ||
      payload.state.length < 16 ||
      typeof payload.codeVerifier !== "string" ||
      payload.codeVerifier.length < 32 ||
      typeof payload.redirect !== "string" ||
      typeof payload.issuedAt !== "number" ||
      payload.issuedAt > Date.now() + 60_000 ||
      Date.now() - payload.issuedAt > OAUTH_STATE_TTL_MS
    ) {
      return null;
    }
    return {
      provider: "google",
      state: payload.state,
      codeVerifier: payload.codeVerifier,
      redirect: sanitizeRedirectPath(payload.redirect),
      issuedAt: payload.issuedAt,
    };
  } catch {
    return null;
  }
}

export function createOAuthNonce(): string {
  return randomBytes(32).toString("base64url");
}

export async function setOAuthStateCookie(value: string): Promise<void> {
  const store = await cookies();
  store.set(OAUTH_STATE_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_STATE_TTL_MS / 1000,
    priority: "high",
  });
}

export async function clearOAuthStateCookie(): Promise<void> {
  const store = await cookies();
  store.set(OAUTH_STATE_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    priority: "high",
  });
}

export async function setAuthCookie(token: string): Promise<void> {
  const expires = parseJwtExpiration(token);
  if (!expires) throw new Error("PocketBase returned an invalid auth token");
  const store = await cookies();
  store.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
    priority: "high",
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    priority: "high",
  });
}

export async function getAuthenticatedPocketBase(): Promise<{
  pb: PocketBase;
  user: PocketBaseUserRecord;
} | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const pb = createUserPocketBase();
  pb.authStore.save(token, null);
  if (!pb.authStore.isValid) return null;

  try {
    const auth = await pb.collection("users").authRefresh<PocketBaseUserRecord>();
    if (auth.record.collectionName !== "users") return null;
    return { pb, user: auth.record };
  } catch (error) {
    if (error instanceof ClientResponseError && [401, 403].includes(error.status)) {
      return null;
    }
    throw error;
  }
}
