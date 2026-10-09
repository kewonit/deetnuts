import Link from "next/link";
import {
  categorySlug,
  EXAM_COUNTDOWN_PATH,
  type Exam,
} from "@/lib/timekeeper/exams";
import { CardCountdown } from "./Countdown";

export function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    Engineering: "bg-blue-50 text-blue-700 border-blue-200",
    Medical: "bg-green-50 text-green-700 border-green-200",
    Management: "bg-purple-50 text-purple-700 border-purple-200",
    "Civil Services": "bg-orange-50 text-orange-700 border-orange-200",
    Banking: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Defence: "bg-red-50 text-red-700 border-red-200",
    "Government Jobs": "bg-yellow-50 text-yellow-700 border-yellow-200",
    Teaching: "bg-pink-50 text-pink-700 border-pink-200",
  };
  return (
    <span
      className={`inline-block px-2 py-1 text-xs border rounded-full ${colors[category] ?? "bg-gray-50 text-gray-700 border-gray-200"}`}
    >
      {category}
    </span>
  );
}

export default function ExamCards({ exams }: { exams: Exam[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {exams.map((exam) => (
        <article
          key={exam.slug}
          className="border border-dashed themed-border p-4 sm:p-6 rounded-lg flex flex-col themed-bg"
          data-testid="exam-card"
        >
          <Link
            href={`${EXAM_COUNTDOWN_PATH}/exams/${exam.slug}`}
            prefetch={false}
            className="block"
          >
            <h2 className="font-serif italic text-xl mb-1">{exam.name}</h2>
            <p className="text-sm themed-text-secondary mb-2">
              {exam.fullName}
            </p>
          </Link>
          <Link
            href={`${EXAM_COUNTDOWN_PATH}/category/${categorySlug(exam.category)}`}
            prefetch={false}
            className="self-start mb-3"
          >
            <CategoryBadge category={exam.category} />
          </Link>
          <p className="text-sm themed-text-secondary mb-4 flex-1">
            {exam.description}
          </p>
          <dl className="text-xs space-y-2 themed-text-secondary">
            <div className="flex justify-between gap-2">
              <dt>Duration</dt>
              <dd>{exam.duration}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Eligibility</dt>
              <dd className="text-right">{exam.eligibility}</dd>
            </div>
            {exam.seats !== "N/A" && (
              <div className="flex justify-between gap-2">
                <dt>Seats</dt>
                <dd>{exam.seats}</dd>
              </div>
            )}
          </dl>
          <CardCountdown sessions={exam.sessions} />
          <Link
            href={`${EXAM_COUNTDOWN_PATH}/exams/${exam.slug}`}
            prefetch={false}
            className="text-xs themed-text-secondary mt-3"
          >
            View Details →
          </Link>
        </article>
      ))}
    </div>
  );
}
