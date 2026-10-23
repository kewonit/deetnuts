import Link from "next/link";
import {
  examCycle,
  formatDateRange,
  sessionLabel,
  sessionStatus,
  EXAM_COUNTDOWN_PATH,
  type Exam,
  type ExamSession,
} from "@/lib/timekeeper/exams";
import { DaysToGo } from "./Countdown";

export default function ExamDatesTable({
  rows,
  now,
  caption,
}: {
  rows: { exam: Exam; session: ExamSession }[];
  now: number;
  caption?: string;
}) {
  return (
    // Narrow screens scroll the table, so keyboard users can focus it.
    <div
      className="overflow-x-auto"
      tabIndex={0}
      role="region"
      aria-label={caption ?? "Exam dates"}
    >
      <table className="tk-table" data-testid="dates-table">
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            <th scope="col">Exam</th>
            <th scope="col">Session</th>
            <th scope="col">Date</th>
            <th scope="col">Days left</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ exam, session }) => (
            <tr key={`${exam.slug}-${session.session}`}>
              <th scope="row">
                <Link
                  href={`${EXAM_COUNTDOWN_PATH}/exams/${exam.slug}`}
                  prefetch={false}
                >
                  {exam.name} {examCycle(exam, now)}
                </Link>
              </th>
              <td>{sessionLabel(session)}</td>
              <td>{formatDateRange(session)}</td>
              <td>
                <DaysToGo date={session.date} endDate={session.endDate} />
              </td>
              <td>{sessionStatus(session)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
