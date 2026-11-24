import "server-only";

import manifest from "@/data/mht-cet/college-media.json";
import jeeManifest from "@/data/jee/college-media.json";

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
  // Set for Wikimedia files, whose licence may require credit.
  license?: string;
  credit?: string;
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
const jeeColleges = (
  jeeManifest as { colleges: Record<string, CollegeMediaEntry> }
).colleges;

export function getMhtCetCollegeMedia(
  collegeId: string | number,
): CollegeMediaEntry | null {
  return colleges[String(Number(collegeId)).padStart(5, "0")] ?? null;
}

// Official names keyed by unpadded college code, for lists whose source data
// title-cases or strips punctuation from names.
export function getMhtCetCollegeNames(): Record<string, string> {
  return Object.fromEntries(
    Object.values(colleges).map((entry) => [String(Number(entry.code)), entry.collegeName]),
  );
}

// JEE institutes are keyed by their catalog id, e.g. "iit-bombay".
export function getJeeCollegeMedia(collegeId: string): CollegeMediaEntry | null {
  return jeeColleges[collegeId] ?? null;
}

export interface CollegeMediaCredit {
  collegeName: string;
  canonicalPath: string;
  kind: "logo" | "campus";
  sourcePage: string;
  license: string;
  credit: string | null;
}

// Openly licensed JEE images, for the credits on the open-source notices page. Fair-use
// logos identify their institution and need no credit line.
export function getJeeMediaCredits(): CollegeMediaCredit[] {
  return Object.values(jeeColleges)
    .flatMap((entry) =>
      (["logo", "campus"] as const).flatMap((kind) => {
        const asset = entry[kind];
        if (!asset?.license || /fair use/i.test(asset.license)) return [];
        return [
          {
            collegeName: entry.collegeName,
            canonicalPath: entry.canonicalPath,
            kind,
            sourcePage: asset.sourcePage,
            license: asset.license,
            credit: asset.credit ?? null,
          },
        ];
      }),
    )
    .sort((left, right) => left.collegeName.localeCompare(right.collegeName, "en"));
}
