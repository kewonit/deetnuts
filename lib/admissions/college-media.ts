import "server-only";

import manifest from "@/data/mht-cet/college-media.json";

export interface CollegeMediaAsset {
  src: string;
  width: number;
  height: number;
  sourcePage: string;
  sourceUrl: string;
  sourceType: "official" | "secondary";
  originalWidth: number;
  originalHeight: number;
  originalSha256: string;
  sha256: string;
  focalPoint?: { x: number; y: number };
  backgroundColor?: string;
  crop?: { left: number; top: number; width: number; height: number };
  extractedFrom?:
    | { page: number; embeddedImage: string; documentSha256: string }
    | { selector: string; documentSha256: string };
}

export interface CollegeMediaEntry {
  code: string;
  collegeName: string;
  canonicalPath: string;
  officialWebsite: string | null;
  identitySource: string | null;
  logo: CollegeMediaAsset | null;
  campus: CollegeMediaAsset | null;
  review: {
    status: "verified" | "partial" | "unavailable";
    reviewedAt: string;
    notes: string;
  };
  attemptedSources: string[];
}

const colleges = (manifest as { colleges: Record<string, CollegeMediaEntry> })
  .colleges;

export function getMhtCetCollegeMedia(
  collegeId: string | number,
): CollegeMediaEntry | null {
  return colleges[String(Number(collegeId)).padStart(5, "0")] ?? null;
}
