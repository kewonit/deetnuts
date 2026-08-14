import { createCollegeSlug } from "@/lib/slugify";

const SITE_URL = "https://deetnuts.com";

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
  return new URL(path, SITE_URL).toString();
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
