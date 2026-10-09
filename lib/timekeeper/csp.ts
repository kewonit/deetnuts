export function timekeeperCsp(
  supabaseUrl: string | undefined,
  production: boolean,
): string {
  let backend = "";
  try {
    const url = new URL(supabaseUrl ?? "");
    if (
      url.protocol === "https:" &&
      /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) &&
      !url.port &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    )
      backend = ` ${url.origin} wss://${url.hostname}`;
  } catch {
    /* An unconfigured map gets no backend network permission. */
  }
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${production ? "" : " 'unsafe-eval'"} https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' blob: data: https://api.dicebear.com https://a.basemaps.cartocdn.com https://b.basemaps.cartocdn.com https://c.basemaps.cartocdn.com https://d.basemaps.cartocdn.com",
    `connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://ipinfo.io${backend}`,
    "worker-src 'self' blob:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(production ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
