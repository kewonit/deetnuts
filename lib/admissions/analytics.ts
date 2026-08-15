export function sanitizeAnalyticsPathname(pathname: string): string {
  if (/^\/(?:jee-main|jee-advanced)\/colleges\/[^/]+\/cutoffs\/\d{4}\/programs\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/?$/.test(pathname)) {
    return "/[jee-exam]/colleges/[slug]/cutoffs/[year]/programs/[program]/[body]/[quota]/[category]/[gender]";
  }
  if (/^\/(?:jee-main|jee-advanced)\/colleges\/[^/]+\/cutoffs\/\d{4}\/programs\/[^/]+\/?$/.test(pathname)) {
    return "/[jee-exam]/colleges/[slug]/cutoffs/[year]/programs/[program]";
  }
  if (/^\/(?:jee-main|jee-advanced)\/colleges\/[^/]+\/cutoffs\/\d{4}\/?$/.test(pathname)) {
    return "/[jee-exam]/colleges/[slug]/cutoffs/[year]";
  }
  if (/^\/(?:jee-main|jee-advanced)\/colleges\/[^/]+\/?$/.test(pathname)) {
    return "/[jee-exam]/colleges/[slug]";
  }
  if (/^\/mht-cet\/colleges\/[^/]+\/?$/.test(pathname)) {
    return "/mht-cet/colleges/[slug]";
  }
  return pathname || "/";
}
