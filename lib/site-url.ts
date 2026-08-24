export const PRODUCTION_SITE_URL = "https://www.deetnuts.com";
export const LOCAL_SITE_URL = "http://localhost:3000";

export function normalizeSiteUrl(value: string, production = false): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be an absolute URL");
  }

  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("NEXT_PUBLIC_APP_URL must contain only an origin");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTP or HTTPS");
  }

  if (production && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS in production");
  }

  if (production && url.origin !== PRODUCTION_SITE_URL) {
    throw new Error(
      `NEXT_PUBLIC_APP_URL must be ${PRODUCTION_SITE_URL} in production`,
    );
  }

  return url.origin;
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configured) {
    return process.env.NODE_ENV === "production"
      ? PRODUCTION_SITE_URL
      : LOCAL_SITE_URL;
  }

  return normalizeSiteUrl(configured, process.env.NODE_ENV === "production");
}

export function getRequestOrigin(
  requestUrl: string,
  production = process.env.NODE_ENV === "production",
  configuredSiteUrl = process.env.NEXT_PUBLIC_APP_URL?.trim(),
): string {
  if (production) {
    return configuredSiteUrl
      ? normalizeSiteUrl(configuredSiteUrl, true)
      : PRODUCTION_SITE_URL;
  }

  return new URL(requestUrl).origin;
}
