import Link from "next/link";
import { notFound } from "next/navigation";
import ExamCountdown, { ShareExam } from "@/components/timekeeper/Countdown";
import { CategoryBadge } from "@/components/timekeeper/ExamCards";
import JsonLd from "@/components/timekeeper/JsonLd";
import LazyStudyMap from "@/components/timekeeper/LazyStudyMap";
import {
  categorySlug,
  exams,
  formatExamDate,
  getExam,
  relatedExams,
  EXAM_COUNTDOWN_PATH,
} from "@/lib/timekeeper/exams";
import { pageSchema, timekeeperMetadata } from "@/lib/timekeeper/metadata";

export const dynamicParams = false;
export function generateStaticParams() {
  return exams.map((exam) => ({ slug: exam.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const exam = getExam((await params).slug);
  if (!exam) notFound();
  return timekeeperMetadata(
    `${EXAM_COUNTDOWN_PATH}/exams/${exam.slug}`,
    `${exam.name} Countdown Timer | Live Exam Date Tracker`,
    exam.metaDescription,
    exam.keywords,
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const exam = getExam((await params).slug);
  if (!exam) notFound();
  const related = relatedExams(exam);
  return (
    <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
      <JsonLd
        value={pageSchema(
          `${EXAM_COUNTDOWN_PATH}/exams/${exam.slug}`,
          `${exam.name} Countdown Timer`,
          exam.description,
        )}
      />
      <div className="text-center mb-8">
        <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-6xl mb-4">
          {exam.name}
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl themed-text-secondary mb-6">
          {exam.fullName}
        </p>
        <div className="flex items-center justify-center gap-3 mb-6">
          <Link
            href={`${EXAM_COUNTDOWN_PATH}/category/${categorySlug(exam.category)}`}
          >
            <CategoryBadge category={exam.category} />
          </Link>
          <span className="px-3 py-2 text-xs themed-bg-tertiary themed-text-secondary rounded-full">
            {exam.conductingBody}
          </span>
        </div>
        <p className="text-base sm:text-lg themed-text-secondary max-w-3xl mx-auto">
          {exam.description}
        </p>
      </div>
      <ExamCountdown title={exam.name} sessions={exam.sessions} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <section className="border border-dashed themed-border p-4 sm:p-6 rounded-lg">
          <h2 className="font-serif italic text-xl mb-4">Basic Information</h2>
          <dl className="space-y-4 text-sm">
            {[
              ["Duration", exam.duration],
              ["Eligibility", exam.eligibility],
              ["Total Seats", exam.seats],
              ["Sessions", String(exam.sessions.length)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col sm:flex-row sm:justify-between gap-2"
              >
                <dt className="themed-text-tertiary">{label}:</dt>
                <dd className="sm:text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="border border-dashed themed-border p-4 sm:p-6 rounded-lg">
          <h2 className="font-serif italic text-xl mb-4">Subjects</h2>
          <div className="flex flex-wrap gap-2">
            {exam.subjects.map((subject) => (
              <span
                key={subject}
                className="px-3 py-1 text-sm themed-bg-tertiary themed-text-secondary rounded-full"
              >
                {subject}
              </span>
            ))}
          </div>
        </section>
        <section className="border border-dashed themed-border p-4 sm:p-6 rounded-lg">
          <h2 className="font-serif italic text-xl mb-4">Quick Links</h2>
          <div className="space-y-3">
            {exam.officialWebsite && (
              <a
                href={exam.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="tk-button w-full"
              >
                Official Website ↗
              </a>
            )}
            <ShareExam title={`${exam.name} Countdown`} />
            <Link
              href={`${EXAM_COUNTDOWN_PATH}/countdown`}
              className="tk-button w-full"
            >
              Create Custom Countdown
            </Link>
          </div>
        </section>
      </div>
      <section className="mb-8">
        <h2 className="font-serif italic text-xl mb-4">Live Study Map</h2>
        <LazyStudyMap examSlug={exam.slug} />
      </section>
      {related.length > 0 && (
        <section className="border border-dashed themed-border p-4 sm:p-6 rounded-lg mb-8">
          <h2 className="font-serif italic text-2xl mb-6">Related Exams</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`${EXAM_COUNTDOWN_PATH}/exams/${item.slug}`}
                prefetch={false}
                className="block p-4 border border-dashed themed-border rounded-lg"
              >
                <h3 className="text-base mb-2">{item.name}</h3>
                <p className="text-xs themed-text-tertiary mb-2">
                  {item.category}
                </p>
                <span className="text-xs">View Details →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <details className="border border-dashed themed-border rounded-lg p-4 mb-8">
        <summary>Latest published schedule</summary>
        <ul className="text-sm space-y-2 mt-3">
          {exam.sessions.map((session) => (
            <li key={session.session}>
              <strong>{session.session}:</strong> {formatExamDate(session.date)}
              {session.endDate ? ` – ${formatExamDate(session.endDate)}` : ""}
              {session.note ? ` · ${session.note}` : ""}
            </li>
          ))}
        </ul>
        <p className="text-xs themed-text-secondary mt-3">
          After a published cycle ends, the timer shows a clearly marked
          estimate for the next cycle. Verify dates with the conducting body.
        </p>
      </details>
      <aside className="border border-dashed themed-disclaimer p-4 rounded-lg text-xs">
        <h2 className="font-medium mb-1">Disclaimer</h2>
        <p>
          Please verify exam dates from {exam.conductingBody}’s official
          website. This countdown is for reference only.
        </p>
      </aside>
    </main>
  );
}
