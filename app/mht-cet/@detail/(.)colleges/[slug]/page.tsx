import { notFound } from "next/navigation";
import AdmissionsDetailSheet from "@/components/admissions/AdmissionsDetailSheet";
import MhtCetDetailView from "@/components/admissions/MhtCetDetailView";
import { getMhtCetCollegeDetail } from "@/lib/admissions/data";
import { isAdmissionsV2Enabled } from "@/lib/admissions/flags";
import { parseAdmissionsInteger } from "@/lib/admissions/query-state";

export default async function InterceptedCollegePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string; round?: string }>;
}) {
  if (!isAdmissionsV2Enabled("mht-cet")) notFound();
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

  return (
    <AdmissionsDetailSheet
      title={model.college.name}
      description={`MHT-CET admission details for ${model.college.name}`}
      returnFocusHref={model.canonicalPath}
    >
      <MhtCetDetailView model={model} variant="sheet" />
    </AdmissionsDetailSheet>
  );
}
