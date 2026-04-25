import { ResultsSummary } from "@/components/mht-cet/mock-tests/ResultsSummary";

export default async function MhtCetAttemptResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  return <ResultsSummary attemptId={attemptId} />;
}
