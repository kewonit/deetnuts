import { getSiteUrl } from "@/lib/site-url";

const LOCAL_REDIRECT_ORIGIN = "https://deetnuts.local";

export const DEFAULT_AUTH_REDIRECT = "/";
export const DEFAULT_MHT_CET_REDIRECT = "/mht-cet";

const BLOCKED_REDIRECT_PREFIXES = [
  "/login",
  "/signup",
  "/auth/confirm",
  "/auth/callback",
  "/mht-cet-login-required",
];

function getFirstString(value: unknown): string {
  if (Array.isArray(value)) {
    return getFirstString(value[0]);
  }

  return typeof value === "string" ? value : "";
}

function isBlockedRedirectPath(pathname: string): boolean {
  return BLOCKED_REDIRECT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isSafeRelativeRedirect(value: string): boolean {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return false;
  }

  if (/[\u0000-\u001F\u007F]/.test(value)) {
    return false;
  }

  try {
    const parsed = new URL(value, LOCAL_REDIRECT_ORIGIN);
    return (
      parsed.origin === LOCAL_REDIRECT_ORIGIN &&
      !isBlockedRedirectPath(parsed.pathname)
    );
  } catch {
    return false;
  }
}

export function sanitizeRedirectPath(
  value: unknown,
  fallback = DEFAULT_AUTH_REDIRECT,
): string {
  const safeFallback = isSafeRelativeRedirect(fallback)
    ? fallback
    : DEFAULT_AUTH_REDIRECT;
  const candidate = getFirstString(value).trim();

  if (!isSafeRelativeRedirect(candidate)) {
    return safeFallback;
  }

  const parsed = new URL(candidate, LOCAL_REDIRECT_ORIGIN);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function sanitizeMhtCetRedirectPath(value: unknown): string {
  return sanitizeRedirectPath(value, DEFAULT_MHT_CET_REDIRECT);
}

function getBaseUrl(): string {
  return getSiteUrl();
}

export function buildAuthCallbackUrl(
  redirectTo: unknown,
  baseUrl = getBaseUrl(),
): string {
  const callbackUrl = new URL("/auth/callback", baseUrl);
  callbackUrl.searchParams.set("redirect", sanitizeRedirectPath(redirectTo));
  return callbackUrl.toString();
}
