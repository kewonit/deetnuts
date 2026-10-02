import "server-only";

import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { getMhtCetCollegeDetail } from "@/lib/admissions/data";
import { matchesCanonicalSegment } from "@/lib/admissions/canonical";
import {
  parseMhtCetDetailSelection,
  withNeutralAdmissionsQuery,
} from "@/lib/admissions/query-state";
import { buildMhtCetCollegeMetadata } from "@/lib/admissions/metadata";

export interface MhtCetDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    year?: string | string[];
    round?: string | string[];
  }>;
}

// Primitive arguments share one result between page HTML and its metadata.
export const getMhtCetDetailPageModel = cache(
  (slug: string, year?: number, round?: number) =>
    getMhtCetCollegeDetail(slug, { year, round }),
);

export async function generateMhtCetCollegeMetadata({
  params,
  searchParams,
}: MhtCetDetailPageProps): Promise<Metadata> {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const selection = parseMhtCetDetailSelection(search.year, search.round);
  if (!selection) notFound();
  // A source outage must remain a server error, never a persistent noindex directive.
  const model = await getMhtCetDetailPageModel(
    slug,
    selection.year,
    selection.round,
  );
  if (!model) notFound();
  const segment = model.canonicalPath.split("/").at(-1) || "";
  if (!matchesCanonicalSegment(slug, segment)) {
    permanentRedirect(
      withNeutralAdmissionsQuery(model.canonicalPath, selection),
    );
  }
  return buildMhtCetCollegeMetadata(model);
}
