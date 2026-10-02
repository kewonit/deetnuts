import { notFound, permanentRedirect, redirect } from "next/navigation";
import MhtCetDetailView from "@/components/admissions/MhtCetDetailView";
import {
  generateMhtCetCollegeMetadata,
  getMhtCetDetailPageModel,
  type MhtCetDetailPageProps,
} from "@/lib/admissions/detail-page";
import { matchesCanonicalSegment } from "@/lib/admissions/canonical";
import { isAdmissionsV2Enabled } from "@/lib/admissions/flags";
import {
  parseMhtCetDetailSelection,
  withNeutralAdmissionsQuery,
} from "@/lib/admissions/query-state";

export const generateMetadata = generateMhtCetCollegeMetadata;

export default async function CollegePage({
  params,
  searchParams,
}: MhtCetDetailPageProps) {
  if (!isAdmissionsV2Enabled("mht-cet")) redirect("/mht-cet/colleges");
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const selection = parseMhtCetDetailSelection(search.year, search.round);
  if (!selection) notFound();
  const model = await getMhtCetDetailPageModel(
    slug,
    selection.year,
    selection.round,
  );
  if (!model) notFound();
  const canonicalSegment = model.canonicalPath.split("/").at(-1) || "";
  if (!matchesCanonicalSegment(slug, canonicalSegment)) {
    permanentRedirect(
      withNeutralAdmissionsQuery(model.canonicalPath, selection),
    );
  }
  return <MhtCetDetailView model={model} />;
}
