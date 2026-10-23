import ExamCards from "@/components/timekeeper/ExamCards";
import ExamDatesTable from "@/components/timekeeper/ExamDatesTable";
import JsonLd from "@/components/timekeeper/JsonLd";
import {
  cycleYears,
  exams,
  upcomingSessions,
  EXAM_COUNTDOWN_PATH,
} from "@/lib/timekeeper/exams";
import { pageSchema, timekeeperMetadata } from "@/lib/timekeeper/metadata";

const description = `How many days are left for JEE Main, NEET, CAT, CBSE and state board exams? Live countdowns for ${exams.length} Indian exams with every session date, custom countdowns and a live study map.`;
function pageTitle() {
  return `Exam Countdown ${cycleYears(exams, Date.now())}: JEE, NEET, CAT, Board Exams`;
}
export function generateMetadata() {
  return timekeeperMetadata(EXAM_COUNTDOWN_PATH, pageTitle(), description);
}
export default function Page() {
  const title = pageTitle();
  const now = Date.now();
  return (
    <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8 mb-8">
      <JsonLd value={pageSchema(EXAM_COUNTDOWN_PATH, title, description)} />
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="font-serif italic text-xl">All Exams</h1>
        <span className="text-sm themed-text-secondary">
          ({exams.length} exams)
        </span>
      </div>
      <section className="border border-dashed themed-border rounded-lg p-4 sm:p-6 mb-6 themed-bg">
        <h2 className="font-serif italic text-xl mb-4">Coming up</h2>
        <ExamDatesTable
          rows={upcomingSessions(exams, now).slice(0, 12)}
          now={now}
        />
      </section>
      <ExamCards exams={exams} />
    </main>
  );
}
