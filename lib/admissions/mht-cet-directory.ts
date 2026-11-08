import "server-only";
import directory from "@/lib/admissions/mht-cet-directory.generated.json";

export type MhtCetDirectoryEntry = {
  code: string;
  name: string;
  status: string;
  homeUniversity: string;
  path: string;
};

const data = directory as {
  source: { mhtCetYear: number; mhtCetRounds: number[] };
  colleges: MhtCetDirectoryEntry[];
};

/**
 * Every college in the current CAP year, generated alongside the canonical
 * manifest (scripts/generate-admissions-canonical-manifest.ts), so listing pages
 * render without querying every cutoff row.
 */
export function getMhtCetDirectory(): MhtCetDirectoryEntry[] {
  return data.colleges;
}

export const MHT_CET_DIRECTORY_SOURCE = data.source;
