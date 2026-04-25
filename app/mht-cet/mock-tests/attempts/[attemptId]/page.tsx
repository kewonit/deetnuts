import { AttemptShell } from "@/components/mht-cet/mock-tests/AttemptShell";

export default async function MhtCetAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  return <AttemptShell attemptId={attemptId} />;
}
