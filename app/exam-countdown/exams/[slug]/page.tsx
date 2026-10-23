import Link from "next/link";
import { notFound } from "next/navigation";
import ExamCountdown, {
  DaysLeft,
  DaysLeftAnswer,
  DaysToGo,
  ShareExam,
  TimeLeft,
  WeeksLeftAnswer,
} from "@/components/timekeeper/Countdown";
import { CategoryBadge } from "@/components/timekeeper/ExamCards";
import JsonLd from "@/components/timekeeper/JsonLd";
import LazyStudyMap from "@/components/timekeeper/LazyStudyMap";
import {
  categorySlug,
  countdownTarget,
  examCycle,
  exams,
  formatDateRange,
  formatExamDate,
  formatShortDate,
  getExam,
  getExamDetails,
  nextSession,
  relatedExams,
  sessionLabel,
  sessionStatus,
  SCHEDULE_VERIFIED,
  EXAM_COUNTDOWN_PATH,
  type Exam,
} from "@/lib/timekeeper/exams";
import {
  breadcrumbSchema,
  pageSchema,
  timekeeperMetadata,
} from "@/lib/timekeeper/metadata";

// Describes the next session from data so the snippet never claims an
// estimate is official. It names the date rather than a day count because
// cached HTML can outlive any count.
function nextSessionSummary(exam: Exam, now: number) {
  const session = nextSession(exam.sessions, now);
  const title = `${exam.name} ${examCycle(exam, now)}`;
  if (!session)
    return `${title} dates will be announced by ${exam.conductingBody}.`;
  // Some session names already carry their cycle, e.g. "INI CET January 2027".
  const name =
    session.session === "Single Session"
      ? title
      : /\d{4}/.test(session.session)
        ? `${exam.name} ${session.session}`
        : `${title} ${session.session}`;
  const date = formatExamDate(session.date);
  if (session.endDate && now >= Date.parse(session.date))
    return `${name} is under way until ${formatExamDate(session.endDate)}.`;
  if (session.predicted)
    return `${name} is expected ${session.endDate ? "to start " : ""}on ${date}.`;
  return `${name} ${session.endDate ? "starts" : "is"} on ${date}.`;
}

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
  const now = Date.now();
  // The title carries the fixed date; a day count would be stale by the time
  // search results show it.
  const session = nextSession(exam.sessions, now);
  const target = session && formatShortDate(countdownTarget(session, now));
  const until = !target
    ? ""
    : session.predicted
      ? ` (Expected ${target})`
      : ` Until ${target}`;
  return timekeeperMetadata(
    `${EXAM_COUNTDOWN_PATH}/exams/${exam.slug}`,
    `${exam.name} ${examCycle(exam, now)} Countdown: Days Left${until}`,
    `${nextSessionSummary(exam, now)} Live countdown with weeks and study hours left, and every key date.`,
    exam.keywords,
    true,
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
  const details = getExamDetails(exam.slug);
  const now = Date.now();
  const cycle = examCycle(exam, now);
  const label = `${exam.name} ${cycle}`;
  const path = `${EXAM_COUNTDOWN_PATH}/exams/${exam.slug}`;
  const categoryPath = `${EXAM_COUNTDOWN_PATH}/category/${categorySlug(exam.category)}`;
  const upcoming = nextSession(exam.sessions, now);
  const dates = [
    ...exam.sessions.map((session) => ({
      event: sessionLabel(session),
      date: session.date,
      endDate: session.endDate,
      status: sessionStatus(session),
      note: session.note,
    })),
    ...(details.keyDates ?? []).map((item) => ({
      ...item,
      status: item.status === "official" ? "Official" : "Expected",
    })),
  ].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const questions: [string, React.ReactNode][] = [
    [
      `How many days are left for ${label}?`,
      <DaysLeftAnswer key="days" sessions={exam.sessions} />,
    ],
    [
      `When is ${label}?`,
      exam.sessions
        .map(
          (session) =>
            `${sessionLabel(session)}: ${formatDateRange(session)}${session.predicted ? " (expected)" : ""}`,
        )
        .join("; ") + ".",
    ],
    [
      `Is the ${label} date official?`,
      upcoming
        ? `${upcoming.predicted ? "Not yet" : "Yes"}: ${upcoming.note ?? exam.conductingBody}. Checked ${formatShortDate(SCHEDULE_VERIFIED)}.`
        : `Dates will be announced by ${exam.conductingBody}.`,
    ],
    [`Who conducts ${label}?`, `${exam.conductingBody}.`],
    [
      `How many weeks are left for ${label}?`,
      <WeeksLeftAnswer key="weeks" sessions={exam.sessions} />,
    ],
  ];
  return (
    <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
      <JsonLd
        value={pageSchema(
          path,
          `${label} Countdown`,
          nextSessionSummary(exam, now),
        )}
      />
      <JsonLd
        value={breadcrumbSchema([
          { name: exam.category, path: categoryPath },
          { name: label, path },
        ])}
      />
      <nav
        aria-label="Breadcrumb"
        className="text-xs themed-text-secondary text-center mb-4"
      >
        <Link href={EXAM_COUNTDOWN_PATH}>TimeKeeper</Link> ›{" "}
        <Link href={categoryPath}>{exam.category}</Link> ›{" "}
        <span aria-current="page">{label}</span>
      </nav>
      <div className="text-center mb-8">
        <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-6xl mb-4">
          {label} Countdown
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl themed-text-secondary mb-6">
          {exam.fullName}
        </p>
        <div className="flex items-center justify-center gap-3 mb-6">
          <Link href={categoryPath}>
            <CategoryBadge category={exam.category} />
          </Link>
          <span className="px-3 py-2 text-xs themed-bg-tertiary themed-text-secondary rounded-full">
            {exam.conductingBody}
          </span>
        </div>
        <p className="text-base sm:text-lg themed-text-secondary max-w-3xl mx-auto">
          {exam.description}
        </p>
        <DaysLeft sessions={exam.sessions} label={label} />
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
            ].map(([item, value]) => (
              <div
                key={item}
                className="flex flex-col sm:flex-row sm:justify-between gap-2"
              >
                <dt className="themed-text-tertiary">{item}:</dt>
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
            <ShareExam title={`${label} Countdown`} />
            <a
              href={`${path}/wallpaper`}
              download={`${exam.slug}-countdown-wallpaper.png`}
              className="tk-button w-full"
            >
              Phone Wallpaper
            </a>
            <Link
              href={`${EXAM_COUNTDOWN_PATH}/countdown`}
              className="tk-button w-full"
            >
              Create Custom Countdown
            </Link>
          </div>
        </section>
      </div>
      <section
        className="border border-dashed themed-border p-4 sm:p-6 rounded-lg mb-8"
        aria-labelledby="dates"
      >
        <h2 id="dates" className="font-serif italic text-xl mb-4">
          {label} Dates
        </h2>
        <div
          className="overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label={`${label} dates`}
        >
          <table className="tk-table" data-testid="exam-dates">
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Date</th>
                <th scope="col">Days left</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {dates.map((item) => (
                <tr key={`${item.event}-${item.date}`}>
                  <th scope="row">
                    {item.event}
                    {item.note && <small>{item.note}</small>}
                  </th>
                  <td>{formatDateRange(item)}</td>
                  <td>
                    <DaysToGo date={item.date} endDate={item.endDate} />
                  </td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs themed-text-secondary mt-3">
          Latest published schedule · Checked{" "}
          {formatShortDate(SCHEDULE_VERIFIED)}
          {details.sources?.map((source) => (
            <span key={source.url}>
              {" · "}
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.label} ↗
              </a>
            </span>
          ))}
          .
          {dates.some((item) => item.status === "Expected") &&
            ` Expected dates follow past cycles until ${exam.conductingBody} publishes them.`}
        </p>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <section className="border border-dashed themed-border p-4 sm:p-6 rounded-lg">
          <h2 className="font-serif italic text-xl mb-4">Time Left</h2>
          <TimeLeft sessions={exam.sessions} />
        </section>
        <section
          className="border border-dashed themed-border p-4 sm:p-6 rounded-lg"
          aria-labelledby="questions"
        >
          <h2 id="questions" className="font-serif italic text-xl mb-4">
            Questions
          </h2>
          <div className="space-y-4 text-sm">
            {questions.map(([question, answer]) => (
              <div key={question}>
                <h3 className="font-medium mb-1">{question}</h3>
                <p className="themed-text-secondary">{answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      {details.pattern && (
        <section className="border border-dashed themed-border p-4 sm:p-6 rounded-lg mb-8">
          <h2 className="font-serif italic text-xl mb-4">Exam Pattern</h2>
          <div
            className="overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label="Exam pattern"
          >
            <table className="tk-table" data-testid="exam-pattern">
              <caption>
                {details.pattern.mode} · {details.pattern.duration}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Paper</th>
                  <th scope="col">Subjects</th>
                  <th scope="col">Questions</th>
                  <th scope="col">Marks</th>
                </tr>
              </thead>
              <tbody>
                {details.pattern.papers.map((paper) => (
                  <tr key={`${paper.paper}-${paper.subjects}`}>
                    <th scope="row">{paper.paper}</th>
                    <td>{paper.subjects}</td>
                    <td>{paper.questions || "—"}</td>
                    <td>{paper.marks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {details.pattern.marking && (
            <p className="text-xs themed-text-secondary mt-3">
              {details.pattern.marking}
            </p>
          )}
        </section>
      )}
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
                <h3 className="text-base mb-2">
                  {item.name} {examCycle(item, now)}
                </h3>
                <p className="text-xs themed-text-tertiary mb-2">
                  {item.category}
                </p>
                <span className="text-xs">View Countdown →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
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
