import ExamCards from "@/components/timekeeper/ExamCards";
import JsonLd from "@/components/timekeeper/JsonLd";
import { cycleYears, exams, EXAM_COUNTDOWN_PATH } from "@/lib/timekeeper/exams";
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
  return (
    <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8 mb-8">
      <JsonLd value={pageSchema(EXAM_COUNTDOWN_PATH, title, description)} />
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="font-serif italic text-xl">All Exams</h1>
        <span className="text-sm themed-text-secondary">
          ({exams.length} exams)
        </span>
      </div>
      <ExamCards exams={exams} />
    </main>
  );
}
