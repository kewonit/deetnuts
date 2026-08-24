import { createCollegeSlug } from "@/lib/slugify";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

export function getMhtCetCollegePath(
  collegeName: string,
  collegeId: string | number,
): string {
  return `/mht-cet/colleges/${createCollegeSlug(
    collegeName,
    String(collegeId),
  )}`;
}

export function getCanonicalUrl(path: string): string {
  return new URL(path, PRODUCTION_SITE_URL).toString();
}

export function matchesCanonicalSegment(
  requested: string,
  canonical: string,
): boolean {
  try {
    return decodeURIComponent(requested) === canonical;
  } catch {
    return false;
  }
}
