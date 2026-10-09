import ExamCards from "@/components/timekeeper/ExamCards";
import JsonLd from "@/components/timekeeper/JsonLd";
import { exams, EXAM_COUNTDOWN_PATH } from "@/lib/timekeeper/exams";
import { pageSchema, timekeeperMetadata } from "@/lib/timekeeper/metadata";

const title = "Live Countdown Timer for Indian Exams | JEE, NEET, CAT";
const description =
  "Track 58 Indian exams with TimeKeeper’s live countdown timers. Explore JEE, NEET, CAT, UPSC, board exams and more, create custom countdowns, and study together across India.";
export const metadata = timekeeperMetadata(
  EXAM_COUNTDOWN_PATH,
  title,
  description,
);
export default function Page() {
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
