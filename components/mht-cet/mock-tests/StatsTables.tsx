import type {
  ScoreBreakdown,
  ScoreAttemptResult,
} from "@/lib/mht-cet/mock-tests/score-attempt";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function StatsTable({
  rows,
}: {
  rows: Array<{ label: string; stats: ScoreBreakdown }>;
}) {
  return (
    <div className="overflow-x-auto rounded-base border-2 border-black bg-white">
      <table className="w-full min-w-[620px] border-collapse text-left">
        <thead className="bg-main">
          <tr>
            <th className="border-b-2 border-black p-3">Name</th>
            <th className="border-b-2 border-black p-3">Score</th>
            <th className="border-b-2 border-black p-3">Correct</th>
            <th className="border-b-2 border-black p-3">Wrong</th>
            <th className="border-b-2 border-black p-3">Unanswered</th>
            <th className="border-b-2 border-black p-3">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, stats }) => (
            <tr key={label}>
              <td className="border-b-2 border-black p-3 font-base">{label}</td>
              <td className="border-b-2 border-black p-3">
                {stats.rawScore} / {stats.maxScore}
              </td>
              <td className="border-b-2 border-black p-3">
                {stats.correctCount}
              </td>
              <td className="border-b-2 border-black p-3">
                {stats.wrongCount}
              </td>
              <td className="border-b-2 border-black p-3">
                {stats.unansweredCount}
              </td>
              <td className="border-b-2 border-black p-3">
                {formatPercent(stats.accuracy)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatsTables({ score }: { score: ScoreAttemptResult }) {
  const subjectRows = Object.entries(score.subjectStats).map(
    ([label, stats]) => ({
      label,
      stats,
    }),
  );
  const chapterRows = Object.entries(score.chapterStats).map(
    ([label, stats]) => ({
      label,
      stats,
    }),
  );

  return (
    <div className="grid gap-5">
      <section className="grid gap-3">
        <h2 className="font-heading text-2xl">Subjects</h2>
        <StatsTable rows={subjectRows} />
      </section>
      <section className="grid gap-3">
        <h2 className="font-heading text-2xl">Chapters</h2>
        <StatsTable rows={chapterRows} />
      </section>
    </div>
  );
}
