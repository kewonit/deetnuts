export function sanitizeAnalyticsPathname(pathname: string): string {
  if (/^\/mht-cet\/colleges\/[^/]+\/?$/.test(pathname)) {
    return "/mht-cet/colleges/[slug]";
  }
  return pathname || "/";
}
