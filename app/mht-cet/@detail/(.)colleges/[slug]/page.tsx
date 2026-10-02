import { notFound } from "next/navigation";
import AdmissionsDetailSheet from "@/components/admissions/AdmissionsDetailSheet";
import MhtCetDetailView from "@/components/admissions/MhtCetDetailView";
import { EjamPageLayout } from "@/components/ejam-chrome/ejam-page-layout";
import {
  generateMhtCetCollegeMetadata,
  getMhtCetDetailPageModel,
} from "@/lib/admissions/detail-page";
import { getMhtCetCollegeDocumentMetadata } from "@/lib/admissions/metadata";
import { isAdmissionsV2Enabled } from "@/lib/admissions/flags";
import { parseMhtCetDetailSelection } from "@/lib/admissions/query-state";

export const generateMetadata = generateMhtCetCollegeMetadata;

export default async function InterceptedCollegePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string; round?: string }>;
}) {
  if (!isAdmissionsV2Enabled("mht-cet")) notFound();
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const selection = parseMhtCetDetailSelection(search.year, search.round);
  if (!selection) notFound();
  const model = await getMhtCetDetailPageModel(
    slug,
    selection.year,
    selection.round,
  );
  if (!model) notFound();
  const metadata = getMhtCetCollegeDocumentMetadata(model);

  return (
    <EjamPageLayout chrome="document">
      <AdmissionsDetailSheet
        title={model.college.name}
        description={`MHT-CET admission details for ${model.college.name}`}
        returnFocusHref={model.canonicalPath}
        metadata={{ ...metadata, title: metadata.title + " | DEETNUTS" }}
      >
        <MhtCetDetailView model={model} variant="sheet" />
      </AdmissionsDetailSheet>
    </EjamPageLayout>
  );
}
