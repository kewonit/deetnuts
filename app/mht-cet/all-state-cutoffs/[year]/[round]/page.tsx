import { notFound, permanentRedirect } from "next/navigation";
import { parseLegacyMhtCetCutoffRoute } from "@/lib/admissions/legacy-route";

export default async function LegacyStateCutoffPage({
  params,
}: {
  params: Promise<{ year: string; round: string }>;
}) {
  const { year, round } = await params;
  const parsed = parseLegacyMhtCetCutoffRoute(year, round);
  if (!parsed) notFound();

  permanentRedirect(
    `/mht-cet/state-cutoffs?year=${parsed.year}&round=${parsed.round}`,
  );
}
