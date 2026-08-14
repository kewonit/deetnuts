import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import MhtCetDetailView from "@/components/admissions/MhtCetDetailView";
import { getMhtCetCollegeDetail } from "@/lib/admissions/data";
import { getCanonicalUrl, matchesCanonicalSegment } from "@/lib/admissions/canonical";
import { isAdmissionsV2Enabled } from "@/lib/admissions/flags";
import {
  parseAdmissionsInteger,
  withNeutralAdmissionsQuery,
} from "@/lib/admissions/query-state";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string; round?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const model = await getMhtCetCollegeDetail(slug);
  if (!model) {
    return { title: "College not found", robots: { index: false, follow: false } };
  }
  const canonicalSegment = model.canonicalPath.split("/").at(-1) || "";
  if (!matchesCanonicalSegment(slug, canonicalSegment)) {
    permanentRedirect(model.canonicalPath);
  }
  const title = `${model.college.name} MHT-CET cutoffs`;
  const description = `Review verified 2026 MHT-CET cutoff evidence, exact seat pools, programs, and explicitly dated 2024 seat information for ${model.college.name}.`;
  return {
    title,
    description,
    alternates: { canonical: getCanonicalUrl(model.canonicalPath) },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(model.canonicalPath),
      type: "website",
    },
  };
}

export default async function CollegePage({ params, searchParams }: PageProps) {
  if (!isAdmissionsV2Enabled("mht-cet")) redirect("/mht-cet/colleges");
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const requestedYear = parseAdmissionsInteger(search.year);
  const requestedRound = parseAdmissionsInteger(search.round);
  if (
    (search.year !== undefined && requestedYear === undefined) ||
    (search.round !== undefined && requestedRound === undefined)
  ) {
    notFound();
  }
  const model = await getMhtCetCollegeDetail(slug, {
    year: requestedYear,
    round: requestedRound,
  });
  if (!model) notFound();
  if (
    (requestedYear !== undefined && requestedYear !== model.selectedYear) ||
    (requestedRound !== undefined && requestedRound !== model.selectedRound)
  ) {
    notFound();
  }
  const canonicalSegment = model.canonicalPath.split("/").at(-1) || "";
  if (!matchesCanonicalSegment(slug, canonicalSegment)) {
    permanentRedirect(
      withNeutralAdmissionsQuery(model.canonicalPath, {
        year: search.year ? model.selectedYear : undefined,
        round: search.round ? model.selectedRound : undefined,
      }),
    );
  }

  return <MhtCetDetailView model={model} />;
}
